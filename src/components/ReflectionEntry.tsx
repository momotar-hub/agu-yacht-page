import React, { useState, useEffect } from "react";
import { Reflection, Profile, WeatherInfo } from "../types";
import { fetchEnoshimaWeather, fetchEnoshimaWeatherForDate } from "./WeatherWidget";
import { Calendar, CloudSun, Plus, Trash2, Wind, Users, AlignLeft, Camera, Check, X, ArrowLeft } from "lucide-react";

interface ReflectionEntryProps {
  currentUserToken: string;
  profiles: Profile[];
  editReflection?: Reflection | null;
  prefilledDate?: string | null;
  onBack: () => void;
  onSaved: (badgeAwarded?: string) => void;
}

export default function ReflectionEntry({
  currentUserToken,
  profiles,
  editReflection,
  prefilledDate,
  onBack,
  onSaved
}: ReflectionEntryProps) {
  const isEditing = !!editReflection;

  // Form States
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [participatingMembers, setParticipatingMembers] = useState<string[]>([]);

  // Weather States
  const [windSpeed, setWindSpeed] = useState<number>(4.5);
  const [windDirection, setWindDirection] = useState("S");
  const [waveHeight, setWaveHeight] = useState<number>(0.5);
  const [condition, setCondition] = useState("晴れ");
  const [temp, setTemp] = useState<number>(23);

  const [fetchingWeather, setFetchingWeather] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize
  useEffect(() => {
    if (editReflection) {
      setDate(editReflection.date);
      setText(editReflection.text);
      setPhotos(editReflection.photos || []);
      setParticipatingMembers(editReflection.participating_members || []);
      
      setWindSpeed(editReflection.weather.windSpeed);
      setWindDirection(editReflection.weather.windDirection);
      setWaveHeight(editReflection.weather.waveHeight);
      setCondition(editReflection.weather.condition);
      setTemp(editReflection.weather.temp);
    } else {
      if (prefilledDate) {
        setDate(prefilledDate);
      } else {
        // Set to today's date in local timezone YYYY-MM-DD
        const localToday = new Date().toLocaleDateString("en-CA"); // Gets YYYY-MM-DD in local time
        setDate(localToday);
      }
      // Include current user in participants by default
      setParticipatingMembers([currentUserToken]);
    }
  }, [editReflection, currentUserToken, prefilledDate]);

  // Handle weather auto-fetch based on selected date
  const handleAutoFetchWeather = async () => {
    if (!date) {
      setError("練習日を選択してから自動取得を行ってください。");
      return;
    }
    setFetchingWeather(true);
    setError(null);
    try {
      const data = await fetchEnoshimaWeatherForDate(date);
      setWindSpeed(data.windSpeed);
      setWindDirection(data.windDirCompass);
      setWaveHeight(data.waveHeight);
      setCondition(data.condition);
      setTemp(data.temp);
    } catch (e) {
      setError(`「${date}」の江の島沖の気象データの自動取得に失敗しました。手動で入力してください。`);
    } finally {
      setFetchingWeather(false);
    }
  };

  // Automatically fetch weather when practice date is selected or changed
  useEffect(() => {
    if (date && !isEditing) {
      const fetchWeather = async () => {
        setFetchingWeather(true);
        setError(null);
        try {
          const data = await fetchEnoshimaWeatherForDate(date);
          setWindSpeed(data.windSpeed);
          setWindDirection(data.windDirCompass);
          setWaveHeight(data.waveHeight);
          setCondition(data.condition);
          setTemp(data.temp);
        } catch (e) {
          console.error("Auto fetch weather failed for date: " + date, e);
          // Don't disturb user with high-profile error banner on auto-run, but support fallback message
        } finally {
          setFetchingWeather(false);
        }
      };
      fetchWeather();
    }
  }, [date, isEditing]);

  // Toggle crew attendance
  const toggleMember = (userId: string) => {
    setParticipatingMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const windDirections = ["北 (N)", "北北東 (NNE)", "北東 (NE)", "東北東 (ENE)", "東 (E)", "東南東 (ESE)", "南東 (SE)", "南南東 (SSE)", "南 (S)", "南南西 (SSW)", "南西 (SW)", "西南西 (WSW)", "西 (W)", "西北西 (WNW)", "北西 (NW)", "北北西 (NNW)"];

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("日付を選択してください。");
      return;
    }
    if (!text.trim()) {
      setError("振り返りの内容を入力してください。");
      return;
    }
    if (participatingMembers.length === 0) {
      setError("乗艇したメンバーを少なくとも1名選択してください。");
      return;
    }

    setSaving(true);

    const payload = {
      date,
      text,
      photos,
      weather: {
        windSpeed,
        windDirection,
        waveHeight,
        condition,
        temp
      },
      participating_members: participatingMembers
    };

    try {
      const url = isEditing ? `/api/reflections/${editReflection!.id}` : "/api/reflections";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        onSaved(data.badgeAwarded);
      } else {
        const data = await res.json();
        setError(data.error || "日誌の保存に失敗しました。");
      }
    } catch (e) {
      setError("サーバーに接続できませんでした。");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center gap-1.5 pb-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> 戻る
        </button>
        <div className="h-4 w-[1px] bg-slate-200 mx-2" />
        <h2 className="text-base font-bold text-slate-800">
          {isEditing ? "乗艇日誌を編集する" : "乗艇日誌を新規作成する"}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns: Text & Photos */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
            {/* Date Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-500" /> 練習日 (日付)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full sm:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400 focus:bg-white text-slate-700 font-sans text-sm"
                required
              />
            </div>

            {/* Reflection Text */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5 text-sky-500" /> 活動内容・振り返り (乗艇日誌)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder="強風での動作、タック・ジャイブの角度、海上の波の状況、各自の反省点や課題、次回の目標などを入力してください。"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-400 focus:bg-white text-slate-700 text-sm leading-relaxed"
                required
              />
            </div>
          </div>
        </div>

        {/* Right Column: Crew & Weather */}
        <div className="space-y-6">
          {/* Participating Members Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-sky-500" /> 乗艇メンバー (複数選択)
            </h3>
            
            <p className="text-[10px] text-slate-400 leading-normal">
              ※本日乗艇した全てのメンバーを選択してください。日誌を登録すると、出席メンバーに振り返りの記載を促すリマインダー通知が送信されます。
            </p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {profiles.map(prof => {
                const isSelected = participatingMembers.includes(prof.user_id);
                return (
                  <button
                    key={prof.user_id}
                    type="button"
                    onClick={() => toggleMember(prof.user_id)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-sky-50 border-sky-200 text-sky-700 shadow-sm"
                        : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{prof.avatar}</span>
                      <div>
                        <span className="font-bold block">{prof.name}</span>
                        <span className="text-[9px] text-slate-400 block font-mono">{prof.role_display}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-sky-600 text-white p-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weather Conditions Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <CloudSun className="w-4 h-4 text-sky-500" /> 気象コンディション
              </h3>
              <button
                type="button"
                onClick={handleAutoFetchWeather}
                disabled={fetchingWeather}
                className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2.5 py-1.5 rounded-lg font-bold transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {fetchingWeather ? "取得中..." : "江の島の天気から自動取得"}
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {/* Wind Speed */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-400" /> 平均風速 (m/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="30"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              {/* Wind Direction */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">風向</label>
                <select
                  value={windDirection}
                  onChange={(e) => setWindDirection(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  {windDirections.map(dir => (
                    <option key={dir} value={dir}>{dir}</option>
                  ))}
                </select>
              </div>

              {/* Wave Height */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">波高 (m)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={waveHeight}
                  onChange={(e) => setWaveHeight(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                  required
                />
              </div>

              {/* Sky Condition / Temp */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">天候</label>
                  <input
                    type="text"
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">気温 (°C)</label>
                  <input
                    type="number"
                    value={temp}
                    onChange={(e) => setTemp(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer text-center border border-slate-200"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-3 rounded-xl text-xs font-bold shadow-md shadow-sky-600/10 transition-colors cursor-pointer text-center disabled:opacity-50"
            >
              {saving ? "保存中..." : (isEditing ? "変更を保存" : "日誌を投稿する")}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
