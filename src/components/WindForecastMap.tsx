import React, { useState, useEffect } from "react";
import { Compass, Clock, Wind, Sun, AlertTriangle, ArrowRight, ShieldCheck, Thermometer } from "lucide-react";
import { getCompassDirection, getWeatherCodeDetails } from "./WeatherWidget";

interface HourlyForecast {
  time: string;
  hourText: string;
  temp: number;
  windSpeed: number; // m/s
  windDirection: number; // degrees
  windGusts: number; // m/s
  weatherCode: number;
  condition: string;
}

export default function WindForecastMap() {
  const [forecast, setForecast] = useState<HourlyForecast[]>([]);
  const [forecastDay, setForecastDay] = useState<"today" | "tomorrow">("today");
  const [sliderHour, setSliderHour] = useState<number>(12); // 0 to 23
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHourlyForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch 2 days of hourly data for Enoshima to support tomorrow's forecast
      const url = "https://api.open-meteo.com/v1/forecast?latitude=35.301&longitude=139.481&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&timezone=Asia%2FTokyo&forecast_days=2";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch hourly weather data");
      const data = await res.json();
      
      const hourly = data.hourly;
      const formatted: HourlyForecast[] = [];

      for (let i = 0; i < hourly.time.length; i++) {
        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const month = dateObj.getMonth() + 1;
        const date = dateObj.getDate();
        const hourText = `${month}/${date} ${String(dateObj.getHours()).padStart(2, "0")}:00`;
        const windSpeedMs = parseFloat((hourly.wind_speed_10m[i] / 3.6).toFixed(1));
        const windGustsMs = parseFloat((hourly.wind_gusts_10m[i] / 3.6).toFixed(1));
        const weatherDetails = getWeatherCodeDetails(hourly.weather_code[i]);

        formatted.push({
          time: timeStr,
          hourText,
          temp: Math.round(hourly.temperature_2m[i]),
          windSpeed: windSpeedMs,
          windDirection: hourly.wind_direction_10m[i],
          windGusts: windGustsMs,
          weatherCode: hourly.weather_code[i],
          condition: weatherDetails.label
        });
      }

      setForecast(formatted);
      
      // Auto-set slider to current hour
      const currentHour = new Date().getHours();
      setSliderHour(currentHour);
      setForecastDay("today");
    } catch (e) {
      console.error(e);
      setError("時間帯別風向予測データの取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHourlyForecast();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center h-72">
        <Wind className="w-8 h-8 text-sky-400 animate-spin mb-2" />
        <p className="text-sm text-slate-400 font-sans font-medium">江の島沖の24時間風況データをロード中...</p>
      </div>
    );
  }

  if (error || forecast.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-center">
        <p className="text-sm text-red-500 mb-2 font-bold">{error || "データがありません"}</p>
        <button 
          onClick={fetchHourlyForecast}
          className="text-xs bg-sky-50 text-sky-600 px-3 py-1.5 rounded-lg font-bold hover:bg-sky-100 transition-colors cursor-pointer"
        >
          再読み込み
        </button>
      </div>
    );
  }

  const selectedHourIdx = (forecastDay === "today" ? 0 : 24) + sliderHour;
  const currentData = forecast[selectedHourIdx] || forecast[0];
  const windDirCompass = getCompassDirection(currentData.windDirection);

  // Get wind severity class and description
  const getWindSeverity = (speed: number) => {
    if (speed >= 8.0) {
      return {
        bg: "bg-rose-500",
        text: "text-rose-600",
        bgLight: "bg-rose-50",
        border: "border-rose-200/60",
        label: "出航制限",
        description: "平均風速が8m/sを超えています。初心者のセーリングは原則中止、熟練者も十分警戒してください。"
      };
    }
    if (speed >= 5.5) {
      return {
        bg: "bg-amber-500",
        text: "text-amber-600",
        bgLight: "bg-amber-50",
        border: "border-amber-200/60",
        label: "強風警戒",
        description: "風が強まっています。沈（キャップサイズ）やトラブルに十分注意し、艤装の確認を怠らないでください。"
      };
    }
    return {
      bg: "bg-emerald-500",
      text: "text-emerald-600",
      bgLight: "bg-emerald-50",
      border: "border-emerald-100",
      label: "出航可能",
      description: "セーリングに最適な穏やかな風速です。安全を最優先に日誌への振り返りも忘れずに行いましょう。"
    };
  };

  const severity = getWindSeverity(currentData.windSpeed);

  return (
    <div id="wind-forecast-container" className="bg-white text-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-2 border-b border-slate-100">
        <div>
          <span className="text-[9px] bg-sky-50 text-sky-600 font-extrabold tracking-widest uppercase px-2 py-0.5 rounded border border-sky-150 font-mono">
            24H WIND FORECAST ANALYSIS
          </span>
          <h3 className="text-sm sm:text-base font-black text-slate-800 mt-1 flex items-center gap-1.5 font-display">
            <Wind className="w-4 h-4 text-sky-500 shrink-0" />
            江の島沖・24時間風況分析データ
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans leading-relaxed">
            スライダーやショートカットを選択して、時間帯別のリアルタイムな風向き・風速変化を詳細に分析できます。
          </p>
        </div>
        <button
          type="button"
          onClick={fetchHourlyForecast}
          className="text-[10px] sm:text-xs text-sky-700 hover:text-sky-800 transition-colors border border-sky-200 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl font-bold cursor-pointer self-start sm:self-center shrink-0"
        >
          予測データ更新
        </button>
      </div>

      {/* Main Layout without the Geography Map */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Compass Rose Indicator */}
        <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/40 rounded-2xl border border-slate-200/60 p-5 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] relative overflow-hidden">
          
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span className="text-[10px] font-black text-slate-700 font-sans">
              解析時刻: <span className="font-mono text-sky-600 font-extrabold">{currentData.hourText}</span>
            </span>
          </div>

          <div className="flex flex-col items-center justify-center mt-4">
            {/* Elegant Responsive Compass Rose with needle */}
            <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-2 border-slate-300 bg-white shadow-md flex items-center justify-center">
              {/* Compass Cardinal Points */}
              <span className="absolute top-1 text-[11px] font-black text-slate-700 z-10 bg-white/95 px-1.5 rounded select-none shadow-sm border border-slate-100">北</span>
              <span className="absolute bottom-1 text-[11px] font-black text-slate-700 z-10 bg-white/95 px-1.5 rounded select-none shadow-sm border border-slate-100">南</span>
              <span className="absolute left-1 text-[11px] font-black text-slate-700 z-10 bg-white/95 px-1.5 rounded select-none shadow-sm border border-slate-100">西</span>
              <span className="absolute right-1 text-[11px] font-black text-slate-700 z-10 bg-white/95 px-1.5 rounded select-none shadow-sm border border-slate-100">東</span>
              
              {/* Compass grid lines */}
              <div className="absolute inset-2 border border-dashed border-slate-200 rounded-full z-0 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1px] bg-slate-200 z-0 pointer-events-none" />
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[1px] bg-slate-200 z-0 pointer-events-none" />

              {/* Rotating Arrow based on actual wind angle */}
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center transition-transform duration-700 relative"
                style={{ transform: `rotate(${currentData.windDirection}deg)` }}
              >
                {/* Visual arrow indicating wind flow DIRECTION */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[14px] border-b-sky-600 filter drop-shadow-sm" />
                  <div className="w-1.5 h-10 bg-sky-600 rounded-b" />
                </div>
                {/* Arrow tail */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-300 rounded-full border border-white" />
              </div>

              {/* Center Hub */}
              <div className="absolute w-5 h-5 rounded-full bg-slate-800 shadow-md border-2 border-white flex items-center justify-center text-[8px] font-bold text-white font-mono">
                {currentData.windDirection}°
              </div>
            </div>

            {/* Weather condition text */}
            <p className="text-[11px] font-black text-slate-700 mt-4 tracking-tight flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              風向: {windDirCompass} ({currentData.windDirection}°)
            </p>
          </div>
        </div>

        {/* Right Column: Key Weather Metrics configured to NEVER clip on mobile */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          
          {/* Key Metrics Grid (2x2) */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Wind Speed Card */}
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60 shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                平均風速
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-800 font-mono tracking-tight">
                  {currentData.windSpeed}
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-sans">m/s</span>
              </div>
              <div className="w-full bg-slate-200 h-1 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ 
                    width: `${Math.min((currentData.windSpeed / 12) * 100, 100)}%`,
                    backgroundColor: severity.bg === "bg-rose-500" ? "#f43f5e" : severity.bg === "bg-amber-500" ? "#f59e0b" : "#10b981"
                  }} 
                />
              </div>
            </div>

            {/* Peak Gusts Card */}
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60 shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                予想最大突風
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-800 font-mono tracking-tight">
                  {currentData.windGusts}
                </span>
                <span className="text-[10px] font-bold text-slate-400 font-sans">m/s</span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1.5 font-medium leading-none">平均値の約1.5倍に警戒</p>
            </div>

            {/* Weather Sky Status Card */}
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60 shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                天候コンディション
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-black text-slate-700 font-sans truncate">
                  {currentData.condition}
                </span>
              </div>
            </div>

            {/* Temperature Card */}
            <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/60 shadow-inner">
              <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                予想気温
              </span>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Thermometer className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="text-xs font-black text-slate-700 font-mono">
                  {currentData.temp} <span className="font-sans font-bold text-slate-400">°C</span>
                </span>
              </div>
            </div>

          </div>

          {/* Safety Advisory Banner based on selected hour wind */}
          <div className={`${severity.bgLight} ${severity.border} border rounded-xl p-3 flex gap-2.5 items-start`}>
            {severity.label === "出航制限" ? (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            ) : severity.label === "強風警戒" ? (
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <p className={`text-[10px] font-extrabold ${severity.text} flex items-center gap-1`}>
                セーリング判断: {severity.label}
              </p>
              <p className="text-[9px] text-slate-500 leading-normal font-sans">
                {severity.description}
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Hourly Slider Timeline */}
      <div className="bg-slate-50/70 border border-slate-150 rounded-2xl p-4 space-y-4">
        
        {/* Day Selectors & Status display */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setForecastDay("today")}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                forecastDay === "today"
                  ? "bg-white text-sky-600 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              今日 (Today)
            </button>
            <button
              type="button"
              onClick={() => setForecastDay("tomorrow")}
              className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                forecastDay === "tomorrow"
                  ? "bg-white text-sky-600 shadow-sm font-black"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              明日 (Tomorrow)
            </button>
          </div>
          <span className="bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-sky-600 shadow-sm font-black text-xs self-start sm:self-auto flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            {currentData.hourText} の予測値
          </span>
        </div>

        {/* Custom input range styled for maximum precision */}
        <div className="relative pt-1">
          <input
            type="range"
            min="0"
            max="23"
            value={sliderHour}
            onChange={(e) => setSliderHour(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600 focus:outline-none"
          />
          <div className="flex justify-between text-[8px] sm:text-[10px] text-slate-400 font-extrabold font-mono mt-2.5 px-0.5">
            <span>00:00</span>
            <span>04:00</span>
            <span>08:00</span>
            <span>12:00</span>
            <span>16:00</span>
            <span>20:00</span>
            <span>23:00</span>
          </div>
        </div>

        {/* Shortcuts chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/50">
          <span className="text-[9px] font-bold text-slate-400 uppercase mr-1">クイック切替:</span>
          {[6, 9, 12, 15, 18, 21].map((hr) => {
            const isSelected = sliderHour === hr;
            return (
              <button
                key={hr}
                type="button"
                onClick={() => setSliderHour(hr)}
                className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-black rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-sky-600 text-white border-sky-600 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {String(hr).padStart(2, "0")}:00
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
