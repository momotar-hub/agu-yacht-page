import React, { useState, useEffect } from "react";
import { Reflection, Comment, Profile } from "../types";
import { Calendar, ChevronLeft, ChevronRight, CornerDownRight, MessageSquare, Trash2, Edit, User, Wind, Compass, Thermometer, Waves, Send, X } from "lucide-react";
import { translateWindDirection } from "./WeatherWidget";

interface ReflectionDetailProps {
  reflection: Reflection;
  currentUserToken: string;
  currentUserProfile: Profile;
  profiles: Profile[];
  onBack: () => void;
  onEdit: (ref: Reflection) => void;
  onDeleted: () => void;
  onBadgeAwarded?: (badge: string) => void;
}

export default function ReflectionDetail({
  reflection,
  currentUserToken,
  currentUserProfile,
  profiles,
  onBack,
  onEdit,
  onDeleted,
  onBadgeAwarded
}: ReflectionDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Is current user the author of the reflection, or an Admin?
  const isAuthorOrAdmin = reflection.author_id === currentUserToken || currentUserProfile.role === "Admin";

  // Fetch comments
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`/api/reflections/${reflection.id}/comments`, {
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (e) {
      console.error("Error fetching comments", e);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    fetchComments();

    // Listen to incoming real-time SSE comments
    const sseUrl = `/api/events?token=${currentUserToken}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const eventData = JSON.parse(event.data);
        // If there's a new comment or notification for us, refresh comments
        if (eventData.reflection_id === reflection.id || eventData.type === "comment" || eventData.type === "reply") {
          fetchComments();
        }
      } catch (err) {
        // Ignored
      }
    };

    return () => {
      eventSource.close();
    };
  }, [reflection.id, currentUserToken]);

  // Handle comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/reflections/${reflection.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({ text: newCommentText })
      });
      if (res.ok) {
        const commentData = await res.json();
        if (commentData.badgeAwarded && onBadgeAwarded) {
          onBadgeAwarded(commentData.badgeAwarded);
        }
        setNewCommentText("");
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle reply submit
  const handleReplySubmit = async (parentId: string) => {
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/reflections/${reflection.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserToken}`
        },
        body: JSON.stringify({ text: replyText, parent_id: parentId })
      });
      if (res.ok) {
        const commentData = await res.json();
        if (commentData.badgeAwarded && onBadgeAwarded) {
          onBadgeAwarded(commentData.badgeAwarded);
        }
        setReplyText("");
        setReplyToCommentId(null);
        fetchComments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("このコメントを削除してよろしいですか？")) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        fetchComments();
      } else {
        const err = await res.json();
        alert(err.error || "コメントの削除に失敗しました。");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle delete reflection
  const handleDeleteReflection = async () => {
    if (!confirm("この乗艇日誌を完全に削除しますか？この操作は取り消せません。")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/reflections/${reflection.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUserToken}` }
      });
      if (res.ok) {
        onDeleted();
      } else {
        const err = await res.json();
        alert(err.error || "削除できませんでした。");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  // Lookup profile helper
  const getParticipantProfile = (userId: string) => {
    return profiles.find(p => p.user_id === userId);
  };

  // Organize comments hierarchy
  const rootComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" /> 一覧に戻る
        </button>

        {isAuthorOrAdmin && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => onEdit(reflection)}
              className="flex items-center gap-1 text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <Edit className="w-3.5 h-3.5" /> 編集する
            </button>
            <button
              onClick={handleDeleteReflection}
              disabled={deleting}
              className="flex items-center gap-1 text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> {deleting ? "削除中..." : "削除"}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Log Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            {/* Header info */}
            <div className="flex items-center gap-3">
              <span className="text-3xl p-1 bg-sky-50 rounded-xl">{reflection.author_avatar}</span>
              <div>
                <h2 className="text-base font-bold text-slate-800">{reflection.author_name} の日誌</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                  <Calendar className="w-3.5 h-3.5" /> {reflection.date} 乗艇 (作成: {new Date(reflection.created_at).toLocaleDateString()})
                </p>
              </div>
            </div>

            {/* Photos Carousel */}
            {reflection.photos && reflection.photos.length > 0 && (
              <div className="relative rounded-xl overflow-hidden aspect-video bg-slate-100 group">
                <img
                  src={reflection.photos[photoIndex]}
                  alt={`Sailing Log ${photoIndex + 1}`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                
                {reflection.photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex(prev => (prev === 0 ? reflection.photos.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setPhotoIndex(prev => (prev === reflection.photos.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/40 text-[10px] text-white px-2 py-0.5 rounded-full font-mono">
                      {photoIndex + 1} / {reflection.photos.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Reflections body text */}
            <div className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans pt-2 border-t border-slate-50">
              {reflection.text}
            </div>

            {/* Weather metrics cards */}
            <div className="border-t border-slate-100 pt-6">
              <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase mb-3">気象観測データ</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Wind className="w-4 h-4 text-sky-500" />
                    <span className="text-[10px] font-bold">風速</span>
                  </div>
                  <p className="text-base font-bold font-mono text-slate-800">{reflection.weather.windSpeed} <span className="text-xs font-normal">m/s</span></p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    <span className="text-[10px] font-bold">風向</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{translateWindDirection(reflection.weather.windDirection)}</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Waves className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-bold">波高</span>
                  </div>
                  <p className="text-base font-bold font-mono text-slate-800">{reflection.weather.waveHeight} <span className="text-xs font-normal">m</span></p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Thermometer className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-bold">気温 / 天候</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 truncate">{reflection.weather.temp}°C ({reflection.weather.condition})</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Crew roster & Comments */}
        <div className="space-y-6">
          {/* Participating members card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">乗艇メンバー ({reflection.participating_members.length}名)</h3>
            <div className="space-y-2">
              {reflection.participating_members.map(mId => {
                const prof = getParticipantProfile(mId);
                return (
                  <div key={mId} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-xl bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
                      {prof?.avatar || "⚓"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-700 truncate">{prof?.name || mId}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{prof?.role_display}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comments and replies board */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col min-h-64 space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MessageSquare className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-slate-800">コメント・返信 ({comments.length})</h3>
            </div>

            {/* Comment List */}
            <div className="space-y-4 flex-grow overflow-y-auto max-h-[380px] pr-1">
              {loadingComments ? (
                <div className="text-center py-8 text-xs text-slate-400 animate-pulse">読み込み中...</div>
              ) : rootComments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">コメントはまだありません。</div>
              ) : (
                rootComments.map(comment => {
                  const replies = getReplies(comment.id);
                  const canDeleteComm = comment.author_id === currentUserToken || currentUserProfile.role === "Admin";
                  
                  return (
                    <div key={comment.id} className="space-y-3">
                      {/* Main Comment */}
                      <div className="bg-slate-50/60 rounded-xl p-3 border border-slate-100 relative group">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{comment.author_avatar}</span>
                            <div>
                              <p className="text-xs font-bold text-slate-700">{comment.author_name}</p>
                              <p className="text-[9px] text-slate-400 font-mono">{new Date(comment.created_at).toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setReplyToCommentId(comment.id)}
                              className="text-[10px] text-sky-600 hover:underline font-bold"
                            >
                              返信
                            </button>
                            {canDeleteComm && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="text-red-500 hover:text-red-700 p-0.5"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mt-2 pl-1">{comment.text}</p>
                      </div>

                      {/* Nested Replies */}
                      {replies.map(reply => {
                        const canDeleteReply = reply.author_id === currentUserToken || currentUserProfile.role === "Admin";
                        return (
                          <div key={reply.id} className="pl-6 flex gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-300 mt-1 flex-shrink-0" />
                            <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex-grow relative group">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs">{reply.author_avatar}</span>
                                  <div>
                                    <p className="text-[11px] font-bold text-slate-700">{reply.author_name}</p>
                                    <p className="text-[8px] text-slate-400 font-mono">{new Date(reply.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                                {canDeleteReply && (
                                  <button
                                    onClick={() => handleDeleteComment(reply.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 pl-1">{reply.text}</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Reply Form */}
                      {replyToCommentId === comment.id && (
                        <div className="pl-6 flex gap-1.5">
                          <CornerDownRight className="w-3.5 h-3.5 text-slate-300 mt-2 flex-shrink-0" />
                          <div className="flex-grow flex items-center gap-1.5 bg-sky-50/50 p-1.5 rounded-lg border border-sky-100">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder={`${comment.author_name}さんへ返信...`}
                              className="text-xs flex-grow bg-white px-2 py-1.5 rounded border border-slate-100 focus:outline-none focus:border-sky-300 text-slate-700"
                            />
                            <button
                              onClick={() => handleReplySubmit(comment.id)}
                              className="bg-sky-600 hover:bg-sky-700 text-white p-1.5 rounded transition-colors"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setReplyToCommentId(null);
                                setReplyText("");
                              }}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="コメントを入力..."
                className="text-xs flex-grow bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-400 focus:bg-white text-slate-700"
              />
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-700 text-white p-2.5 rounded-xl transition-colors cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
