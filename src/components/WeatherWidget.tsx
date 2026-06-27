import { useState, useEffect } from "react";
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Compass, Sun, Wind } from "lucide-react";

// Compass directions helper
export function getCompassDirection(degrees: number): string {
  const directions = ["北 (N)", "北北東 (NNE)", "北東 (NE)", "東北東 (ENE)", "東 (E)", "東南東 (ESE)", "南東 (SE)", "南南東 (SSE)", "南 (S)", "南南西 (SSW)", "南西 (SW)", "西南西 (WSW)", "西 (W)", "西北西 (WNW)", "北西 (NW)", "北北西 (NNW)"];
  const index = Math.round(((degrees % 360) / 22.5)) % 16;
  return directions[index];
}

// Translate English compass directions to Japanese for historical/imported logs
export function translateWindDirection(dir: string): string {
  if (!dir) return "不明";
  const trimmed = dir.trim();
  const mapping: { [key: string]: string } = {
    "N": "北 (N)",
    "NNE": "北北東 (NNE)",
    "NE": "北東 (NE)",
    "ENE": "東北東 (ENE)",
    "E": "東 (E)",
    "ESE": "東南東 (ESE)",
    "SE": "南東 (SE)",
    "SSE": "南南東 (SSE)",
    "S": "南 (S)",
    "SSW": "南南西 (SSW)",
    "SW": "南西 (SW)",
    "WSW": "西南西 (WSW)",
    "W": "西 (W)",
    "WNW": "西北西 (WNW)",
    "NW": "北西 (NW)",
    "NNW": "北北西 (NNW)"
  };
  
  if (mapping[trimmed]) return mapping[trimmed];
  const upper = trimmed.toUpperCase();
  if (mapping[upper]) return mapping[upper];
  return trimmed;
}

// Translate WMO weather code to Japanese text and icon
export function getWeatherCodeDetails(code: number) {
  if (code === 0) return { label: "快晴", icon: Sun, color: "text-amber-500" };
  if (code >= 1 && code <= 3) return { label: "晴れ〜曇り", icon: CloudSun, color: "text-sky-500" };
  if (code === 45 || code === 48) return { label: "霧", icon: CloudFog, color: "text-slate-400" };
  if (code >= 51 && code <= 55) return { label: "霧雨", icon: CloudRain, color: "text-blue-300" };
  if (code >= 61 && code <= 65) return { label: "雨", icon: CloudRain, color: "text-blue-500" };
  if (code >= 71 && code <= 75) return { label: "雪", icon: CloudSnow, color: "text-sky-200" };
  if (code >= 80 && code <= 82) return { label: "にわか雨", icon: CloudRain, color: "text-indigo-400" };
  if (code >= 95 && code <= 99) return { label: "雷雨", icon: CloudLightning, color: "text-red-500" };
  return { label: "曇り", icon: Cloud, color: "text-slate-500" };
}

export interface EnoshimaWeatherData {
  temp: number;
  windSpeed: number; // m/s
  windGusts: number; // m/s
  windDirDeg: number;
  windDirCompass: string;
  condition: string;
  weatherCode: number;
  humidity: number;
  waveHeight: number; // estimation
}

export async function fetchEnoshimaWeather(): Promise<EnoshimaWeatherData> {
  const url = "https://api.open-meteo.com/v1/forecast?latitude=35.301&longitude=139.481&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia%2FTokyo";
  
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch weather data");
  
  const data = await res.json();
  const current = data.current;
  
  // Convert wind speed from km/h to m/s
  const windSpeedMs = parseFloat((current.wind_speed_10m / 3.6).toFixed(1));
  const windGustsMs = parseFloat((current.wind_gusts_10m / 3.6).toFixed(1));
  
  // Wave height estimation based on wind speed (simple Beaufort scale proxy for ocean)
  let waveHeight = 0.2;
  if (windSpeedMs > 12) waveHeight = 1.8;
  else if (windSpeedMs > 8) waveHeight = 1.2;
  else if (windSpeedMs > 4) waveHeight = 0.7;
  else if (windSpeedMs > 2) waveHeight = 0.4;

  const weatherDetails = getWeatherCodeDetails(current.weather_code);

  return {
    temp: Math.round(current.temperature_2m),
    windSpeed: windSpeedMs,
    windGusts: windGustsMs,
    windDirDeg: current.wind_direction_10m,
    windDirCompass: getCompassDirection(current.wind_direction_10m),
    condition: weatherDetails.label,
    weatherCode: current.weather_code,
    humidity: current.relative_humidity_2m,
    waveHeight: waveHeight
  };
}

export async function fetchEnoshimaWeatherForDate(dateString: string): Promise<EnoshimaWeatherData> {
  const useArchive = new Date(dateString) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const baseUrl = useArchive 
    ? "https://archive-api.open-meteo.com/v1/archive" 
    : "https://api.open-meteo.com/v1/forecast";

  const url = `${baseUrl}?latitude=35.301&longitude=139.481&start_date=${dateString}&end_date=${dateString}&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia%2FTokyo`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch historical weather data");

  const data = await res.json();
  const hourly = data.hourly;
  if (!hourly || !hourly.time || hourly.time.length === 0) {
    throw new Error("No weather data found for this date");
  }

  // Calculate averages over daylight hours (e.g., 9:00 to 17:00)
  const startHour = 9;
  const endHour = 17;
  
  let tempSum = 0;
  let windSum = 0;
  let gustSum = 0;
  let dirSum = 0;
  let codeCount: { [key: number]: number } = {};
  let count = 0;

  for (let i = startHour; i <= endHour && i < hourly.time.length; i++) {
    if (hourly.temperature_2m[i] !== undefined) {
      tempSum += hourly.temperature_2m[i];
      windSum += hourly.wind_speed_10m[i];
      gustSum += hourly.wind_gusts_10m[i];
      dirSum += hourly.wind_direction_10m[i];
      const code = hourly.weather_code[i];
      codeCount[code] = (codeCount[code] || 0) + 1;
      count++;
    }
  }

  if (count === 0) {
    for (let i = 0; i < hourly.time.length; i++) {
      tempSum += hourly.temperature_2m[i];
      windSum += hourly.wind_speed_10m[i];
      gustSum += hourly.wind_gusts_10m[i];
      dirSum += hourly.wind_direction_10m[i];
      const code = hourly.weather_code[i];
      codeCount[code] = (codeCount[code] || 0) + 1;
      count++;
    }
  }

  const avgTemp = count > 0 ? Math.round(tempSum / count) : 20;
  const avgWindSpeedKmh = count > 0 ? windSum / count : 15;
  const avgWindSpeedMs = parseFloat((avgWindSpeedKmh / 3.6).toFixed(1));
  const avgWindGustsMs = parseFloat(((count > 0 ? gustSum / count : 20) / 3.6).toFixed(1));
  const avgWindDir = count > 0 ? Math.round(dirSum / count) % 360 : 180;

  let maxCode = 0;
  let maxCount = 0;
  Object.keys(codeCount).forEach(k => {
    const code = parseInt(k);
    if (codeCount[code] > maxCount) {
      maxCount = codeCount[code];
      maxCode = code;
    }
  });

  let waveHeight = 0.2;
  if (avgWindSpeedMs > 12) waveHeight = 1.8;
  else if (avgWindSpeedMs > 8) waveHeight = 1.2;
  else if (avgWindSpeedMs > 4) waveHeight = 0.7;
  else if (avgWindSpeedMs > 2) waveHeight = 0.4;

  const weatherDetails = getWeatherCodeDetails(maxCode);

  return {
    temp: avgTemp,
    windSpeed: avgWindSpeedMs,
    windGusts: avgWindGustsMs,
    windDirDeg: avgWindDir,
    windDirCompass: getCompassDirection(avgWindDir),
    condition: weatherDetails.label,
    weatherCode: maxCode,
    humidity: 65,
    waveHeight: waveHeight
  };
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<EnoshimaWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadWeather = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEnoshimaWeather();
      setWeather(data);
    } catch (e: any) {
      setError("天気情報の取得に失敗しました。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse flex flex-col items-center justify-center h-48">
        <Wind className="w-8 h-8 text-sky-400 animate-spin mb-2" />
        <p className="text-sm text-slate-400">江の島の気象データを読込中...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
        <p className="text-sm text-red-500 mb-2">{error || "データがありません"}</p>
        <button 
          onClick={loadWeather}
          className="text-xs bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg font-medium hover:bg-sky-100 transition-colors"
        >
          再読み込み
        </button>
      </div>
    );
  }

  const { icon: WeatherIcon, color: weatherColor } = getWeatherCodeDetails(weather.weatherCode);

  return (
    <div className="bg-white text-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <span className="text-[9px] bg-blue-50 text-blue-600 font-bold tracking-wider uppercase px-2.5 py-0.5 rounded border border-blue-100 font-mono">
            ENOSHIMA PORT COOP
          </span>
          <h3 className="text-base font-bold text-slate-800 mt-1.5">神奈川県 江の島 気象状況</h3>
        </div>
        <button 
          onClick={loadWeather} 
          className="text-xs text-slate-600 hover:text-slate-900 transition-colors border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium shadow-sm bg-white cursor-pointer"
        >
          更新
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 relative z-10">
        {/* Main Condition Card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <WeatherIcon className={`w-5 h-5 ${weatherColor}`} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">現在の天気</p>
            <p className="text-sm font-bold text-slate-800">{weather.condition}</p>
          </div>
        </div>

        {/* Temp Card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <Sun className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-medium">気温 / 湿度</p>
            <p className="text-sm font-bold text-slate-800">{weather.temp}°C <span className="text-xs font-normal text-slate-400">({weather.humidity}%)</span></p>
          </div>
        </div>

        {/* Wind Speed and Direction Card */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3 col-span-1">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <Wind className="w-5 h-5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium">風向・風速</p>
            <p className="text-sm font-bold truncate text-slate-800">{weather.windSpeed} m/s</p>
          </div>
        </div>

        {/* Direction Indicator */}
        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
            <Compass className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] text-slate-400 font-medium">風向き (方位)</p>
            <p className="text-sm font-bold truncate text-slate-800">{weather.windDirCompass}</p>
          </div>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="mt-5 pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${weather.windSpeed >= 8.0 ? "bg-red-500 animate-ping" : "bg-emerald-500"}`} />
          <span className="font-semibold text-slate-700">
            {weather.windSpeed >= 8.0 
              ? "【出航注意】風速が制限基準の 8m/s に接近しています。" 
              : "【出航可能】風向き安定。安全なセーリングコンディションです。"}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 font-mono bg-slate-50 px-2.5 py-0.5 rounded border border-slate-200 self-start sm:self-auto">波高目安: ~{weather.waveHeight}m</p>
      </div>
    </div>
  );
}
