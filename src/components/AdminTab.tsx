import React, { useState, useEffect } from "react";
import { Profile, Document } from "../types";
import { Users, UserPlus, Trash2, ShieldAlert, BookOpen, Plus, Edit, X, Check, FileText, Key, Eye, EyeOff, Shield, ShieldCheck } from "lucide-react";

interface AdminTabProps {
  currentUserToken: string;
  currentUserProfile: Profile;
  profiles: Profile[];
  onRefreshNeeded: () => void;
}

type AdminSubTab = "members" | "wiki";

export default function AdminTab({
  currentUserToken,
  currentUserProfile,
  profiles,
  onRefreshNeeded
}: AdminTabProps) {
  const [subTab, setSubTab] = useState<AdminSubTab>("members");
  
  // Member Form States
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPassword, setMemberPassword] = useState("sailing");
  const [memberRoleText, setMemberRoleText] = useState("");
  const [memberGrade, setMemberGrade] = useState("1年");
  const [memberAvatar, setMemberAvatar] = useState("⛵");
  const [showPassword, setShowPassword] = useState(false);
  const [memberIsAdmin, setMemberIsAdmin] = useState(false);

  // Wiki Doc States
  const [docs, setDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [docEditId, setDocEditId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");

  // Status States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const avatarsList = ["⛵", "⚓", "🌊", "⭐", "🐋", "🛹", "🦈", "🏆", "🧭", "☀️", "☁️", "💨"];
  const gradesList = ["1年", "2年", "3年", "4年", "OB", "KSC"];

  // Fetch Documents
  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (e) {
      console.error("Failed to load documents", e);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (subTab === "wiki") {
      fetchDocs();
    }
    setError(null);
    setSuccess(null);
  }, [subTab]);

  // Handle Toggle Admin Right
  const handleToggleAdmin = async (userId: string, currentIsAdmin: boolean) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/profiles/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({ is_admin: !currentIsAdmin })
      });
      if (res.ok) {
        setSuccess(`管理者権限を${!currentIsAdmin ? "付与" : "解除"}しました。`);
        onRefreshNeeded();
      } else {
        const data = await res.json();
        setError(data.error || "権限の変更に失敗しました。");
      }
    } catch (e) {
      console.error(e);
      setError("サーバーに接続できませんでした。");
    } finally {
      setLoading(false);
    }
  };
  const handleStartEdit = (prof: Profile) => {
    setEditingMemberId(prof.user_id);
    setMemberName(prof.name);
    setMemberEmail(""); 
    setMemberRoleText(prof.role_display);
    setMemberGrade(prof.grade || "1年");
    setMemberAvatar(prof.avatar);
    setMemberIsAdmin(!!prof.is_admin);
    setShowMemberForm(true);
    // Smooth scroll to top so the edit form is immediately visible
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (editingMemberId) {
      // Edit mode
      if (!memberName.trim()) {
        setError("氏名を入力してください。");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`/api/profiles/${editingMemberId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentUserToken}`
          },
          body: JSON.stringify({
            name: memberName,
            grade: memberGrade,
            role_display: memberRoleText,
            role: memberIsAdmin ? "Admin" : "Member",
            avatar: memberAvatar,
            is_admin: memberIsAdmin
          })
        });

        if (res.ok) {
          setSuccess(`部員「${memberName}」の情報を更新しました！`);
          setEditingMemberId(null);
          setMemberName("");
          setMemberEmail("");
          setMemberRoleText("");
          setMemberGrade("1年");
          setMemberAvatar("⛵");
          setMemberIsAdmin(false);
          setShowMemberForm(false);
          onRefreshNeeded();
        } else {
          const data = await res.json();
          setError(data.error || "情報の更新に失敗しました。");
        }
      } catch (err) {
        setError("サーバー通信に失敗しました。");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Add mode
    if (!memberName.trim() || !memberEmail.trim()) {
      setError("氏名とメールアドレスを入力してください。");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({
          name: memberName,
          email: memberEmail,
          password: memberPassword,
          role: memberIsAdmin ? "Admin" : "Member",
          role_display: memberRoleText,
          grade: memberGrade,
          avatar: memberAvatar,
          is_admin: memberIsAdmin
        })
      });

      if (res.ok) {
        setSuccess(`新しい部員「${memberName}」を登録しました！`);
        // Reset form
        setMemberName("");
        setMemberEmail("");
        setMemberPassword("sailing");
        setMemberRoleText("");
        setMemberGrade("1年");
        setMemberAvatar("⛵");
        setMemberIsAdmin(false);
        setShowMemberForm(false);
        onRefreshNeeded();
      } else {
        const data = await res.json();
        setError(data.error || "部員の追加に失敗しました。");
      }
    } catch (err) {
      setError("サーバー通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (userId: string, name: string) => {
    if (userId === currentUserProfile.user_id) {
      setError("自分自身を削除することはできません。");
      return;
    }

    if (!confirm(`本当に部員「${name}」を削除しますか？\nこの操作は取り消せません。`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentUserToken}`
        }
      });

      if (res.ok) {
        setSuccess(`部員「${name}」を削除しました。`);
        onRefreshNeeded();
      } else {
        const data = await res.json();
        setError(data.error || "削除に失敗しました。");
      }
    } catch (err) {
      setError("サーバー通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // Handle Save Wiki Document
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (!docTitle.trim() || !docContent.trim()) {
      setError("タイトルと内容を入力してください。");
      setLoading(false);
      return;
    }

    try {
      const url = docEditId ? `/api/documents/${docEditId}` : "/api/documents";
      const method = docEditId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({ title: docTitle, content: docContent })
      });

      if (res.ok) {
        setSuccess(docEditId ? "Wiki記事を更新しました！" : "新しいWiki記事を追加しました！");
        setDocTitle("");
        setDocContent("");
        setDocEditId(null);
        setShowDocForm(false);
        fetchDocs();
        onRefreshNeeded(); // refresh app state as well
      } else {
        const data = await res.json();
        setError(data.error || "ドキュメントの保存に失敗しました。");
      }
    } catch (err) {
      setError("サーバー通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Wiki Doc
  const handleDeleteDoc = async (id: string, title: string) => {
    if (!confirm(`本当にWiki記事「${title}」を削除しますか？`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });

      if (res.ok) {
        setSuccess(`Wiki記事「${title}」を削除しました。`);
        fetchDocs();
        onRefreshNeeded();
      } else {
        const data = await res.json();
        setError(data.error || "削除に失敗しました。");
      }
    } catch (err) {
      setError("サーバー通信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDocEdit = (doc: Document) => {
    setDocEditId(doc.id);
    setDocTitle(doc.title);
    setDocContent(doc.content);
    setShowDocForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleOpenDocCreate = () => {
    setDocEditId(null);
    setDocTitle("");
    setDocContent("");
    setShowDocForm(true);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Tab bar header */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" /> ポータル管理者設定
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">
            部員の追加・削除、Wikiマニュアル情報の作成・編集など、クラブ全体の管理業務を行います。
          </p>
        </div>

        {/* Subtab buttons */}
        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 w-full">
          <button
            onClick={() => setSubTab("members")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === "members"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" /> 部員管理 ({profiles.length}名)
          </button>
          <button
            onClick={() => setSubTab("wiki")}
            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              subTab === "wiki"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" /> Wiki管理
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3.5 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center gap-1.5">
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* SUBTAB 1: MEMBERS */}
      {subTab === "members" && (
        <div className="space-y-6">
          {/* Member actions */}
          {!showMemberForm ? (
            <div className="flex justify-end">
              <button
                onClick={() => setShowMemberForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> 新規部員を追加
              </button>
            </div>
          ) : (
            // Add/Edit Member Form
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4 max-w-xl">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  {editingMemberId ? (
                    <>
                      <Edit className="w-4 h-4 text-blue-500" /> 部員情報の編集
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-blue-500" /> 新規部員登録
                    </>
                  )}
                </h3>
                <button
                  onClick={() => {
                    setEditingMemberId(null);
                    setMemberName("");
                    setMemberEmail("");
                    setMemberRoleText("");
                    setMemberGrade("1年");
                    setMemberAvatar("⛵");
                    setMemberIsAdmin(false);
                    setShowMemberForm(false);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddMember} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className={editingMemberId ? "sm:col-span-2" : ""}>
                    <label className="block font-bold text-slate-500 mb-1">氏名 *</label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="青山 帆走"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700"
                      required
                    />
                  </div>

                  {/* Email (Only show when creating) */}
                  {!editingMemberId && (
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">メールアドレス *</label>
                      <input
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        placeholder="sail@agu.ac.jp"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">役職/ポジション *</label>
                    <input
                      type="text"
                      value={memberRoleText}
                      onChange={(e) => setMemberRoleText(e.target.value)}
                      placeholder="主将、副主将、コーチ、選手 など"
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700"
                      required
                    />
                  </div>

                  {/* Grade */}
                  <div>
                    <label className="block font-bold text-slate-500 mb-1">所属/学年</label>
                    <select
                      value={memberGrade}
                      onChange={(e) => setMemberGrade(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700"
                    >
                      {gradesList.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password input (Only show when creating) */}
                {!editingMemberId && (
                  <div>
                    <label className="block font-bold text-slate-500 mb-1 flex items-center justify-between">
                      <span>ログインパスワード (初期設定)</span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-blue-500 hover:underline flex items-center gap-0.5 text-[10px] cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {showPassword ? "非表示" : "表示"}
                      </button>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={memberPassword}
                        onChange={(e) => setMemberPassword(e.target.value)}
                        placeholder="sailing"
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700 font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1">※部員が最初ログインする時に使用するパスワードです。デフォルトは「sailing」です。</p>
                  </div>
                )}

                {/* Is Admin Checkbox */}
                <div className="flex items-center gap-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="memberIsAdmin"
                    checked={memberIsAdmin}
                    onChange={(e) => setMemberIsAdmin(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="memberIsAdmin" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                    この部員に管理者権限（日誌管理、メンバー管理、Wiki編集機能など）を付与する
                  </label>
                </div>

                {/* Avatar emoji */}
                <div>
                  <label className="block font-bold text-slate-500 mb-2">アバター絵文字 * ({memberAvatar})</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    {avatarsList.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setMemberAvatar(emoji)}
                        className={`text-2xl h-10 w-10 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                          memberAvatar === emoji
                            ? "bg-white border-2 border-blue-500 shadow-sm transform scale-110"
                            : "hover:bg-slate-200 border border-transparent"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMemberId(null);
                      setMemberName("");
                      setMemberEmail("");
                      setMemberRoleText("");
                      setMemberGrade("1年");
                      setMemberAvatar("⛵");
                      setMemberIsAdmin(false);
                      setShowMemberForm(false);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-colors cursor-pointer"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-600/10 transition-colors cursor-pointer"
                  >
                    {loading ? (editingMemberId ? "保存中..." : "登録中...") : (editingMemberId ? "変更を保存する" : "部員を登録する")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members list table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">部員名簿一覧</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">部員</th>
                    <th className="px-6 py-3">学年/所属</th>
                    <th className="px-6 py-3">役職</th>
                    <th className="px-6 py-3">管理者権限</th>
                    <th className="px-6 py-3 font-mono">USER ID</th>
                    <th className="px-6 py-3 text-right">アクション</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150">
                  {profiles.map(prof => {
                    const isSelf = prof.user_id === currentUserProfile.user_id;
                    return (
                      <tr key={prof.user_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl bg-slate-100 h-9 w-9 rounded-full flex items-center justify-center border border-slate-200 shrink-0 shadow-sm">
                              {prof.avatar}
                            </span>
                            <div>
                              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                                {prof.name}
                                {prof.is_admin && (
                                  <span className="bg-sky-50 text-sky-700 text-[8px] font-bold px-1.5 py-0.5 rounded border border-sky-100">
                                    管理者
                                  </span>
                                )}
                              </p>
                              {isSelf && (
                                <span className="bg-blue-50 text-blue-600 text-[8px] font-black px-1.5 py-0.5 rounded border border-blue-100 uppercase font-mono tracking-wider mt-0.5 inline-block">
                                  あなた
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {prof.grade || "未設定"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            prof.role === "Admin"
                              ? "bg-red-50 text-red-700 border border-red-100"
                              : prof.role === "Captain"
                              ? "bg-amber-50 text-amber-700 border border-amber-100"
                              : prof.role === "Vice Captain"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                              : "bg-slate-50 text-slate-600 border border-slate-200"
                          }`}>
                            {prof.role_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {prof.is_admin ? (
                            <span className="bg-sky-50 text-sky-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-sky-100 flex items-center gap-1 w-fit">
                              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> あり
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold px-2 py-1">なし</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px]">
                          {prof.user_id}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Edit button */}
                            <button
                              onClick={() => handleStartEdit(prof)}
                              disabled={loading}
                              className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-extrabold"
                              title="部員データを編集"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-500" />
                              編集
                            </button>

                            {!isSelf && (
                              <>
                                <button
                                  onClick={() => handleDeleteMember(prof.user_id, prof.name)}
                                  disabled={loading}
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"
                                  title="部員アカウント削除"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}

                            {isSelf && (
                              <span className="text-[10px] text-slate-400 font-bold font-sans italic px-1.5 py-0.5 bg-slate-50 border border-slate-150 rounded select-none" title="管理者自身は管理権限変更・削除できません">
                                本人
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: WIKI MANAGEMENT */}
      {subTab === "wiki" && (
        <div className="space-y-6">
          {!showDocForm ? (
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="max-w-2xl">
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  部員共有のWiki活動マニュアル・手引きドキュメントを直接管理します。追加した情報は「活動の手引き/Wiki」タブに即座に反映されます。
                </p>
              </div>
              <button
                onClick={handleOpenDocCreate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 hover:shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> Wiki記事を追加
              </button>
            </div>
          ) : (
            // Doc Form
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-500 tracking-wider uppercase flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {docEditId ? "Wikiマニュアルを編集" : "新規Wikiマニュアル記事を作成"}
                </h3>
                <button
                  onClick={() => setShowDocForm(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">記事タイトル *</label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="例: 江の島ハーバーの着岸マナーと進入ルート"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 text-sm font-bold text-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    記事本文 * (箇条書きや段落分けをして、読みやすく作成してください。部分的なMarkdown書式も利用可能です。)
                  </label>
                  <textarea
                    value={docContent}
                    onChange={(e) => setDocContent(e.target.value)}
                    rows={12}
                    placeholder={`# 記事タイトル

## 1. 概要
ここに概要を記載します。

## 2. 具体的な手順
- 手順Aの要領
- 手順Bの要領

## 3. 注意点
雷注意報や荒天時は絶対に...`}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 text-sm leading-relaxed font-mono"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDocForm(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-600/10 transition-colors"
                  >
                    {loading ? "保存中..." : "Wikiに登録する"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Wiki articles list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">公開済みWikiドキュメント一覧</h3>
            </div>

            {loadingDocs ? (
              <div className="text-center py-12 text-slate-400 animate-pulse font-medium">読込中...</div>
            ) : docs.length === 0 ? (
              <div className="p-12 text-center text-slate-400">
                <BookOpen className="w-10 h-10 text-slate-200 mx-auto mb-2 animate-wave" />
                <p className="text-sm font-bold">Wiki記事がまだありません。</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {docs.map(doc => (
                  <div key={doc.id} className="p-5 flex justify-between items-center hover:bg-slate-50/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="bg-sky-50 h-8 w-8 rounded-lg flex items-center justify-center text-sky-600 border border-sky-100 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 leading-tight">{doc.title}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-mono">
                          最終更新: {new Date(doc.updated_at).toLocaleString()} | 作成者: {doc.author_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleOpenDocEdit(doc)}
                        className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3 h-3" /> 編集
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id, doc.title)}
                        className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> 削除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
