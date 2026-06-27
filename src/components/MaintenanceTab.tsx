import React, { useState, useEffect } from "react";
import { MaintenanceRecord, Profile } from "../types";
import { Hammer, Calendar, Plus, Edit, Trash2, ShieldCheck, CheckCircle2, Loader2, Hourglass, HelpCircle, X, ExternalLink } from "lucide-react";

interface MaintenanceTabProps {
  currentUserToken: string;
  currentUserProfile: Profile;
  onRefreshNeeded: () => void;
}

export default function MaintenanceTab({
  currentUserToken,
  currentUserProfile,
  onRefreshNeeded
}: MaintenanceTabProps) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [dateFound, setDateFound] = useState("");
  const [boat, setBoat] = useState("");
  const [location, setLocation] = useState("");
  const [cost, setCost] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [status, setStatus] = useState<"Pending" | "In Progress" | "Completed">("Pending");

  const [saving, setSaving] = useState(false);

  // Load records
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/maintenance", {
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      } else {
        setError("データの取得に失敗しました。");
      }
    } catch (e) {
      setError("サーバーに接続できませんでした。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [currentUserToken]);

  // Open Form for creating
  const handleOpenCreate = () => {
    setDateFound(new Date().toLocaleDateString("en-CA"));
    setBoat("AGU-01 (スナイプ級)");
    setLocation("");
    setCost(0);
    setNotes("");
    setPhotoUrl("");
    setStatus("Pending");
    setEditId(null);
    setShowForm(true);
    setError(null);
  };

  // Open Form for editing
  const handleOpenEdit = (rec: MaintenanceRecord) => {
    setDateFound(rec.date_found);
    setBoat(rec.boat);
    setLocation(rec.location);
    setCost(rec.cost);
    setNotes(rec.notes);
    setPhotoUrl(rec.photos?.[0] || "");
    setStatus(rec.status);
    setEditId(rec.id);
    setShowForm(true);
    setError(null);
  };

  // Save Record
  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFound || !boat || !location || !notes) {
      setError("未入力の必須項目があります。");
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      date_found: dateFound,
      boat,
      location,
      cost,
      photos: photoUrl.trim() ? [photoUrl.trim()] : [],
      notes,
      status
    };

    try {
      const url = editId ? `/api/maintenance/${editId}` : "/api/maintenance";
      const method = editId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setShowForm(false);
        fetchRecords();
        onRefreshNeeded(); // trigger activity refresh in profile
      } else {
        const err = await res.json();
        setError(err.error || "データの保存に失敗しました。");
      }
    } catch (e) {
      setError("通信エラーが発生しました。");
    } finally {
      setSaving(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("このメンテナンス記録を削除してもよろしいですか？")) return;

    try {
      const res = await fetch(`/api/maintenance/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        fetchRecords();
        onRefreshNeeded();
      } else {
        const err = await res.json();
        alert(err.error || "削除できませんでした。");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to draw status badges
  const getStatusBadge = (status: "Pending" | "In Progress" | "Completed") => {
    if (status === "Completed") {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
          <CheckCircle2 className="w-3 h-3" /> 完了 (Fixed)
        </span>
      );
    }
    if (status === "In Progress") {
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse">
          <Loader2 className="w-3 h-3 animate-spin" /> 補修中 (In Progress)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full">
        <Hourglass className="w-3 h-3" /> 未対応 (Pending)
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-sky-500" /> メンテナンス・船体不具合管理
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">練習中に発生した船体の割れ、セール破れ、パーツ紛失、艤装不具合を記録し修復状況を共有します。</p>
        </div>
        {!showForm && (
          <button
            onClick={handleOpenCreate}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 不具合報告を登録
          </button>
        )}
      </div>

      {/* Editor/Creator Modal Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md max-w-2xl mx-auto space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
              {editId ? "メンテナンス報告を編集" : "新規メンテナンスを報告"}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSaveRecord} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">発見日 (Date found)</label>
                <input
                  type="date"
                  value={dateFound}
                  onChange={(e) => setDateFound(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-400"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">対象艇 (Boat)</label>
                <select
                  value={boat}
                  onChange={(e) => setBoat(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                >
                  <option value="AGU-01 (スナイプ級)">AGU-01 (スナイプ級)</option>
                  <option value="AGU-02 (スナイプ級)">AGU-02 (スナイプ級)</option>
                  <option value="AGU-470 (470級)">AGU-470 (470級)</option>
                  <option value="レスキュー艇 (マーキュリー)">レスキュー艇 (マーキュリー)</option>
                  <option value="その他・共同備品">その他・共同備品</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-500 mb-1">破損部位・パーツ (Location)</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="例: スプレッダー先端ピン、メインクリート"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-500 mb-1">修復費用 (Cost in 円, 未定なら0)</label>
                <input
                  type="number"
                  value={cost}
                  onChange={(e) => setCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none font-mono text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">状況写真 (URL, 任意)</label>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... 等の写真アドレス"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-1">詳細内容・修理方法 (Notes)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="不具合の状況、誰がどのように直すか、パテ補修の段階などを分かりやすく記入してください。"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none text-slate-700 leading-normal"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-500 mb-2">現在のステータス (Status)</label>
              <div className="flex gap-4">
                {["Pending", "In Progress", "Completed"].map((st) => (
                  <label key={st} className="flex items-center gap-1.5 font-bold text-slate-600 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={st}
                      checked={status === st}
                      onChange={() => setStatus(st as any)}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <span>
                      {st === "Pending" ? "未対応" : st === "In Progress" ? "対応中" : "完了"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-2.5 rounded-lg font-bold"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-sky-600 hover:bg-sky-700 text-white py-2.5 rounded-lg font-bold"
              >
                {saving ? "保存中..." : "保存する"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records Lists */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-medium">不具合データを読み込み中...</div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center text-slate-400">
          <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold">登録されたメンテナンス記録はありません。</p>
          <p className="text-xs text-slate-300 mt-1">ヨットの破損や不具合があったら、最初の不具合報告を登録しましょう！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {records.map((rec) => {
            const isReporterOrAdmin = rec.reporter_id === currentUserToken || currentUserProfile.role === "Admin";
            return (
              <div
                key={rec.id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:border-slate-200 hover:shadow-md transition-all"
              >
                {/* Photo Header if available */}
                {rec.photos && rec.photos.length > 0 ? (
                  <div className="h-44 bg-slate-100 relative group overflow-hidden">
                    <img src={rec.photos[0]} alt={rec.location} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute top-3 left-3">
                      {getStatusBadge(rec.status)}
                    </div>
                  </div>
                ) : (
                  <div className="h-12 bg-sky-50 flex items-center px-4 justify-between border-b border-sky-100/50">
                    {getStatusBadge(rec.status)}
                    <span className="text-[10px] bg-sky-600/10 text-sky-700 px-2 py-0.5 rounded font-mono font-bold">{rec.boat}</span>
                  </div>
                )}

                {/* Body Content */}
                <div className="p-5 flex-grow space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      {rec.photos && rec.photos.length > 0 && (
                        <span className="text-[9px] bg-sky-600/10 text-sky-700 px-1.5 py-0.5 rounded font-mono font-bold block w-max mb-1.5">{rec.boat}</span>
                      )}
                      <h4 className="text-sm font-black text-slate-800 font-display leading-tight">{rec.location}</h4>
                    </div>
                    {rec.cost > 0 && (
                      <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded">
                        ¥{rec.cost.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-sans">{rec.notes}</p>

                  <div className="pt-3 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                    <div className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>発見: {rec.date_found}</span>
                    </div>
                    <span className="font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                      報告者: {rec.reporter_name}
                    </span>
                  </div>
                </div>

                {/* Edit Controls Footer (Only shown if owns the record) */}
                {isReporterOrAdmin && (
                  <div className="bg-slate-50/60 p-3 border-t border-slate-100/50 flex justify-end gap-1">
                    <button
                      onClick={() => handleOpenEdit(rec)}
                      className="text-[10px] bg-white hover:bg-slate-100 text-sky-700 border border-slate-200 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit className="w-3 h-3" /> 編集する
                    </button>
                    <button
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-[10px] bg-white hover:bg-red-50 text-red-600 border border-red-100 px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" /> 削除
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
