import React, { useState, useEffect } from "react";
import { Document, Profile } from "../types";
import { BookOpen, Calendar, Edit, Trash2, Plus, ShieldCheck, FileText, Check, X, Search } from "lucide-react";

interface WikiTabProps {
  currentUserToken: string;
  currentUserProfile: Profile;
}

// Simple custom markdown renderer since we don't have react-markdown installed
function SimpleMarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  
  return (
    <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans select-text">
      {lines.map((line, idx) => {
        // H1 Heading
        if (line.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-lg font-black text-slate-800 font-display pt-4 pb-2 border-b border-slate-100 uppercase tracking-wide">
              {line.replace("# ", "")}
            </h1>
          );
        }
        // H2 Heading
        if (line.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-sm font-bold text-slate-800 font-display pt-3 pb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-sky-500 rounded-full inline-block" />
              {line.replace("## ", "")}
            </h2>
          );
        }
        // Bold item or list item
        if (line.startsWith("- ")) {
          const text = line.replace("- ", "");
          const isBoldItem = text.includes(":**");
          if (isBoldItem) {
            const parts = text.split(":**");
            return (
              <li key={idx} className="list-disc list-inside ml-4 text-slate-600">
                <strong className="text-slate-800">{parts[0].replace("**", "")}:</strong>
                {parts[1]}
              </li>
            );
          }
          return <li key={idx} className="list-disc list-inside ml-4 text-slate-600">{text}</li>;
        }
        // Numbered list items
        if (/^\d+\./.test(line)) {
          return <li key={idx} className="list-decimal list-inside ml-4 text-slate-600">{line.replace(/^\d+\.\s*/, "")}</li>;
        }
        // Empty lines
        if (!line.trim()) {
          return <div key={idx} className="h-2" />;
        }
        
        // Standard text
        return <p key={idx} className="pl-0.5">{line}</p>;
      })}
    </div>
  );
}

export default function WikiTab({ currentUserToken, currentUserProfile }: WikiTabProps) {
  const [docs, setDocs] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form states (Admin only)
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = currentUserProfile.role === "Admin";

  // Filter documents based on title or content search
  const filteredDocs = docs.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Load documents
  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
        if (data.length > 0 && !selectedDocId) {
          setSelectedDocId(data[0].id);
        }
      } else {
        setError("Wikiドキュメントの取得に失敗しました。");
      }
    } catch (e) {
      setError("サーバーに接続できません。");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [currentUserToken]);

  const activeDoc = docs.find(d => d.id === selectedDocId);

  // Handle open create
  const handleOpenCreate = () => {
    setTitle("");
    setContent("");
    setEditId(null);
    setShowForm(true);
    setError(null);
  };

  // Handle open edit
  const handleOpenEdit = (doc: Document) => {
    setTitle(doc.title);
    setContent(doc.content);
    setEditId(doc.id);
    setShowForm(true);
    setError(null);
  };

  // Handle save
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("タイトルと内容を入力してください。");
      return;
    }

    setSaving(true);
    try {
      const url = editId ? `/api/documents/${editId}` : "/api/documents";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({ title, content })
      });

      if (res.ok) {
        const savedDoc = await res.json();
        setShowForm(false);
        fetchDocs();
        setSelectedDocId(savedDoc.id);
      } else {
        const err = await res.json();
        setError(err.error || "ドキュメントの保存に失敗しました。");
      }
    } catch (e) {
      setError("サーバーに接続できません。");
    } finally {
      setSaving(false);
    }
  };

  // Handle delete
  const handleDeleteDoc = async (id: string) => {
    if (!confirm("このWiki記事を削除してもよろしいですか？")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        setSelectedDocId(null);
        fetchDocs();
      } else {
        const err = await res.json();
        alert(err.error || "削除できませんでした。");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-sky-500" /> 活動の手引き・Wikiマニュアル
          </h2>
          <p className="text-[10px] text-slate-400 mt-1">
            出航手順、気象警報時対応、完沈時の復帰方法、レスキュー随伴ルール、船体真水洗い要領など部員必須の共有知識です。
          </p>
        </div>
        {isAdmin && !showForm && (
          <button
            onClick={handleOpenCreate}
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/10 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 記事を新規作成
          </button>
        )}
      </div>

      {/* Grid Layout: Doc Lists left, viewer right */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Column: List directory */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-3">
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ドキュメント目次</h3>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="キーワード検索..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 focus:bg-white text-xs text-slate-700 transition-all font-sans"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {loading ? (
                <div className="text-center py-4 text-xs text-slate-400 animate-pulse">読込中...</div>
              ) : filteredDocs.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  {searchQuery ? "見つかりませんでした" : "記事がありません"}
                </p>
              ) : (
                filteredDocs.map(doc => {
                  const isActive = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setShowForm(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all truncate flex items-center gap-2 ${
                        isActive && !showForm
                          ? "bg-sky-50 text-sky-700 font-bold border border-sky-100 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 border border-transparent"
                      }`}
                    >
                      <FileText className={`w-4 h-4 flex-shrink-0 ${isActive && !showForm ? "text-sky-600" : "text-slate-400"}`} />
                      <span className="truncate">{doc.title}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Viewer or form */}
        <div className="md:col-span-3">
          {showForm ? (
            // Admin Edit Form
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">
                  {editId ? "Wiki記事を編集" : "新規Wiki記事を作成"}
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

              <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 mb-1">記事タイトル</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: スナイプ級マスト倒し要領"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-sky-400 text-sm font-bold text-slate-700"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 mb-1">
                    記事本文 (Markdown記法を部分サポート: # 見出し1, ## 見出し2, - 箇条書き)
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    placeholder="マニュアルの内容を分かりやすく記入してください。"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none text-slate-700 text-sm leading-relaxed font-mono"
                    required
                  />
                </div>

                <div className="flex gap-2">
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
          ) : activeDoc ? (
            // Document Viewer
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-start gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-800 font-display leading-tight">{activeDoc.title}</h1>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> 最終更新: {new Date(activeDoc.updated_at).toLocaleString()} (作成者: {activeDoc.author_name})
                  </p>
                </div>

                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleOpenEdit(activeDoc)}
                      className="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" /> 編集
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(activeDoc.id)}
                      className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> 削除
                    </button>
                  </div>
                )}
              </div>

              {/* Styled Content paper */}
              <div className="prose prose-sky max-w-none pt-2 bg-slate-50/30 p-4 sm:p-6 rounded-xl border border-slate-100">
                <SimpleMarkdownRenderer content={activeDoc.content} />
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center text-slate-400">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-wave" />
              <p className="text-sm font-bold">ドキュメントを選択してください。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
