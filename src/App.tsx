import React, { useState, useEffect } from "react";
import { Profile, Reflection } from "./types";
import WeatherWidget, { translateWindDirection } from "./components/WeatherWidget";
import WindForecastMap from "./components/WindForecastMap";
import ReflectionDetail from "./components/ReflectionDetail";
import ReflectionEntry from "./components/ReflectionEntry";
import PersonalProfile from "./components/PersonalProfile";
import MaintenanceTab from "./components/MaintenanceTab";
import WikiTab from "./components/WikiTab";
import AdminTab from "./components/AdminTab";
import NotificationsPanel from "./components/NotificationsPanel";
import { Anchor, BookOpen, Calendar, Hammer, LogOut, Menu, MessageSquare, Sun, Trophy, User, Wind, X, ChevronRight, ChevronDown, Compass, Plus, Shield, Home } from "lucide-react";

type Tab = "home" | "reflections" | "profile" | "maintenance" | "wiki" | "weather" | "admin";

export default function App() {
  // Authentication States
  const [token, setToken] = useState<string | null>(localStorage.getItem("sailing_token"));
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loadingUser, setLoadingUser] = useState(!!token);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState("taro@agu.ac.jp");
  const [loginPassword, setLoginPassword] = useState("sailing");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // App Layout States
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reflections Core States
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loadingReflections, setLoadingReflections] = useState(false);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editReflectionTarget, setEditReflectionTarget] = useState<Reflection | null>(null);
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);
  const [celebratedBadge, setCelebratedBadge] = useState<string | null>(null);
  const [logsPage, setLogsPage] = useState(1);

  // All Profiles List State
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Selected User ID inside Profiles view
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  // Fetch current user details
  const fetchCurrentUser = async (authToken: string) => {
    setLoadingUser(true);
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.profile);
        setSelectedUserId(data.profile.user_id);
      } else {
        // Clear stale token
        handleLogout();
      }
    } catch (e) {
      console.error("Auth fetch failed", e);
    } finally {
      setLoadingUser(false);
    }
  };

  // Fetch reflections & profiles
  const loadCoreData = async () => {
    if (!token) return;
    setLoadingReflections(true);
    try {
      // Fetch Reflections
      const refRes = await fetch("/api/reflections", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (refRes.ok) {
        const refData = await refRes.json();
        setReflections(refData);
        
        // If a reflection was selected, update its local representation
        if (selectedReflection) {
          const updatedSelected = refData.find((r: Reflection) => r.id === selectedReflection.id);
          if (updatedSelected) setSelectedReflection(updatedSelected);
        }
      }

      // Fetch Profiles
      const profRes = await fetch("/api/profiles", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profRes.ok) {
        const profData = await profRes.json();
        setProfiles(profData);
        // If the current user's profile updated in server, sync it here
        const selfUpdated = profData.find((p: Profile) => p.user_id === token);
        if (selfUpdated) setCurrentUser(selfUpdated);
      }
    } catch (e) {
      console.error("Data load failed", e);
    } finally {
      setLoadingReflections(false);
    }
  };

  // Run on start
  useEffect(() => {
    if (token) {
      fetchCurrentUser(token);
    }
  }, [token]);

  // Run core loads once authenticated
  useEffect(() => {
    if (token && currentUser) {
      loadCoreData();
    }
  }, [token, currentUser?.user_id]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("sailing_token", data.token);
        setToken(data.token);
        setCurrentUser(data.user.profile);
        setSelectedUserId(data.user.profile.user_id);
      } else {
        const data = await res.json();
        setLoginError(data.error || "ログインに失敗しました。");
      }
    } catch (err) {
      setLoginError("サーバーへの接続に失敗しました。");
    } finally {
      setLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("sailing_token");
    setToken(null);
    setCurrentUser(null);
    setSelectedReflection(null);
    setShowEntryForm(false);
    setEditReflectionTarget(null);
    setActiveTab("reflections");
  };

  // Real-time Notification Banner Trigger
  const handleNewNotification = (msg: string) => {
    setToastMessage(msg);
    // Auto clear toast after 5s
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 5000);
  };

  // Handle deep-linking from notification click to reflection details view
  const handleNotificationClicked = (reflectionId: string) => {
    const matchedRef = reflections.find(r => r.id === reflectionId);
    if (matchedRef) {
      setSelectedReflection(matchedRef);
      setShowEntryForm(false);
      setEditReflectionTarget(null);
      setActiveTab("reflections");
    } else {
      // Reload core data first, then attempt to locate
      loadCoreData().then(() => {
        const reloadedRef = reflections.find(r => r.id === reflectionId);
        if (reloadedRef) {
          setSelectedReflection(reloadedRef);
          setShowEntryForm(false);
          setEditReflectionTarget(null);
          setActiveTab("reflections");
        }
      });
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <Anchor className="w-10 h-10 text-sky-600 animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-semibold">AGUセーリングポータルへログイン中...</p>
      </div>
    );
  }

  // --- LOGIN VIEW ---
  if (!currentUser) {
    const mockMembers = [
      { name: "山田 太郎 (主将/4年)", email: "taro@agu.ac.jp" },
      { name: "佐藤 美咲 (副将/4年)", email: "misaki@agu.ac.jp" },
      { name: "鈴木 拓海 (選手/2年)", email: "takumi@agu.ac.jp" },
      { name: "田中 優奈 (選手/1年)", email: "yuna@agu.ac.jp" },
      { name: "渡辺 健太 (OB/監督)", email: "kenta@agu.ac.jp" }
    ];

    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans select-none" style={{
        backgroundImage: "radial-gradient(at 0% 0%, hsla(199,83%,93%,1) 0, transparent 50%), radial-gradient(at 50% 0%, hsla(215,85%,91%,1) 0, transparent 50%)"
      }}>
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden w-full max-w-lg md:max-w-2xl flex flex-col md:flex-row h-[550px]">
          {/* Cover branding side */}
          <div className="bg-gradient-to-br from-sky-900 to-indigo-950 text-white p-8 flex flex-col justify-between md:w-5/12 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-cover bg-center opacity-10" style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=800&auto=format&fit=crop&q=60')"
            }} />
            
            <div className="relative z-10 space-y-1 animate-wave">
              <Anchor className="w-8 h-8 text-sky-400" />
              <h1 className="text-xl font-black font-display tracking-tight leading-tight mt-3">AGU Sailing Club</h1>
              <p className="text-[10px] text-sky-200 font-bold tracking-widest uppercase font-sans">青山学院大学理工ヨット部</p>
            </div>

            <div className="relative z-10 text-[10px] text-sky-300 leading-normal border-t border-white/10 pt-4 font-mono">
              <p>© 2026 AGU Yacht Club.</p>
              <p className="mt-0.5">Leaf Port Hayama, JP</p>
            </div>
          </div>

          {/* Login Interactive panel */}
          <div className="p-8 flex-grow flex flex-col justify-center space-y-6 md:w-7/12">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">ヨット部 管理ポータル</h2>
              <p className="text-xs text-slate-400 mt-1">氏名を選択し、パスワードを入力してください。</p>
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-[11px] p-3 rounded-xl font-medium">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4 text-xs font-medium">
              {/* Profile selector dropdown */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">部員名 (メンバーリスト)</label>
                <select
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                >
                  {mockMembers.map((m, idx) => (
                    <option key={idx} value={m.email}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-slate-400 font-bold mb-1.5 uppercase tracking-wider">パスワード</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Password (初期値: sailing)"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  required
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-sky-600/10 hover:shadow-lg hover:shadow-sky-600/20 transition-all cursor-pointer text-center text-xs mt-2"
              >
                {loggingIn ? "ログイン処理中..." : "ポータルに入る"}
              </button>
            </form>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <p className="text-[10px] text-slate-400 leading-normal">
                ※ セキュア開発テスト環境: 登録メンバーの初期パスワードは全て <code className="font-mono bg-white px-1 py-0.5 rounded border font-bold text-sky-600">sailing</code> です。ログイン後にマイプロフィールより基本情報の編集が可能です。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PORTAL PANEL VIEW ---
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-800">
      
      {/* Toast Alert popups for SSE Real-time */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-[9999] bg-slate-900 text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2.5 max-w-sm animate-bounce">
          <span className="bg-blue-500 text-white p-1 rounded-full text-xs">🔔</span>
          <p className="font-bold flex-grow pr-2">{toastMessage}</p>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* --- SIDEBAR NAVIGATION (Desktop) --- */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-[#1E293B] text-slate-300 border-r border-slate-200 p-6 shrink-0">
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 pb-5 border-b border-slate-700/50 select-none">
            <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
              <Anchor className="w-6 h-6 animate-wave" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">AGU Sailing Club</h1>
              <span className="text-[9px] text-blue-400 font-semibold tracking-wider uppercase font-mono">YACHT PORTAL</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            <button
              onClick={() => { setActiveTab("home"); setSelectedReflection(null); setShowEntryForm(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "home"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>ホーム (Home)</span>
            </button>

            <button
              onClick={() => { setActiveTab("reflections"); setSelectedReflection(null); setShowEntryForm(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "reflections"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>乗艇日誌 (Sailing Log)</span>
            </button>

            <button
              onClick={() => { setActiveTab("profile"); setSelectedUserId(currentUser.user_id); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>個人プロフィール・戦歴</span>
            </button>

            <button
              onClick={() => { setActiveTab("maintenance"); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "maintenance"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>メンテナンス管理</span>
            </button>

            <button
              onClick={() => { setActiveTab("wiki"); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "wiki"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>活動の手引き / Wiki</span>
            </button>

            <button
              onClick={() => { setActiveTab("weather"); }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "weather"
                  ? "bg-blue-600 text-white font-bold shadow-sm"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>海域天気ダッシュボード</span>
            </button>

            {(currentUser?.role === "Admin" || currentUser?.is_admin) && (
              <button
                onClick={() => { setActiveTab("admin"); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "admin"
                    ? "bg-red-600 text-white font-bold shadow-sm"
                    : "hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span className="text-red-300">管理者ページ (Admin)</span>
              </button>
            )}
          </nav>
        </div>

        {/* Current profile info at bottom of sidebar */}
        <div className="pt-4 border-t border-slate-700/50">
          <div className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between gap-2 min-w-0 border border-slate-700/30">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xl bg-slate-700 p-1 rounded-full h-8 w-8 flex items-center justify-center">
                {currentUser.avatar}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate font-mono">{currentUser.role_display}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
              title="ログアウト"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* --- SIDEBAR NAVIGATION (Mobile Menu Drawer) --- */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/50">
          <div className="bg-[#1E293B] text-slate-300 w-64 p-6 space-y-6 flex flex-col justify-between h-full relative border-r border-slate-700/50">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              {/* Brand Logo */}
              <div className="flex items-center gap-3 pb-5 border-b border-slate-700/50 select-none">
                <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Anchor className="w-6 h-6 animate-wave" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white leading-tight">AGU Sailing Club</h1>
                  <span className="text-[9px] text-blue-400 font-semibold tracking-wider uppercase font-mono">YACHT PORTAL</span>
                </div>
              </div>

              {/* Nav lists */}
              <nav className="space-y-1">
                {[
                  { id: "home", label: "ホーム (Home)", icon: Home },
                  { id: "reflections", label: "乗艇日誌 (Sailing Log)", icon: Calendar },
                  { id: "profile", label: "個人プロフィール・戦歴", icon: Trophy },
                  { id: "maintenance", label: "メンテナンス管理", icon: Hammer },
                  { id: "wiki", label: "活動の手引き / Wiki", icon: BookOpen },
                  { id: "weather", label: "海域天気ダッシュボード", icon: Compass },
                  ...((currentUser?.role === "Admin" || currentUser?.is_admin) ? [{ id: "admin", label: "管理者ページ (Admin)", icon: Shield }] : [])
                ].map((item) => {
                  const ItemIcon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as Tab);
                        setSelectedReflection(null);
                        setShowEntryForm(false);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                        isActive
                          ? "bg-blue-600 text-white font-bold shadow-sm"
                          : "hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              <div className="bg-slate-800/50 p-3 rounded-lg flex items-center justify-between gap-2 min-w-0 border border-slate-700/30">
                <div className="flex items-center gap-2">
                  <span className="text-xl bg-slate-700 p-1 rounded-full h-8 w-8 flex items-center justify-center">{currentUser.avatar}</span>
                  <div>
                    <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                    <p className="text-[9px] text-slate-400 font-mono">{currentUser.role_display}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors cursor-pointer flex-shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-grow" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* --- MAIN CORE PANEL CONTENT VIEW --- */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        
        {/* Main Content Top Header Bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 md:gap-0">
            {/* Mobile menu trigger button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <h1 className="text-sm md:text-base font-black text-slate-800 font-display flex items-center gap-1.5 select-none">
              {activeTab === "home" && "活動ホームダッシュボード"}
              {activeTab === "reflections" && "乗艇日誌・振り返りシェア"}
              {activeTab === "profile" && `${profiles.find(p => p.user_id === selectedUserId)?.name || currentUser.name} の戦歴プロフィール`}
              {activeTab === "maintenance" && "ボート・備品メンテナンス管理"}
              {activeTab === "wiki" && "ヨット活動マニュアル・手引きWiki"}
              {activeTab === "weather" && "江の島セーリング海域天気予報"}
              {activeTab === "admin" && "ポータル管理者設定"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Synchronized Notifications Dropdown Panel */}
            <NotificationsPanel
              currentUserToken={token}
              onNotificationClicked={handleNotificationClicked}
              onNewNotificationArrived={handleNewNotification}
            />
            
            <div className="h-4 w-[1px] bg-slate-200" />
            
            {/* Short Profile Bio */}
            <div className="flex items-center gap-2 select-none">
              <span className="text-lg bg-slate-50 p-1 rounded-full">{currentUser.avatar}</span>
              <span className="text-xs font-black text-slate-700 hidden sm:inline">{currentUser.name}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Tab Containers */}
        <main className="flex-grow p-6 max-w-7xl w-full mx-auto pb-16">
          
          {/* TAB 0: HOME DASHBOARD */}
          {activeTab === "home" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Welcome Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-44 h-44 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                
                <div className="relative space-y-2 max-w-2xl">
                  <span className="text-[10px] bg-white/20 font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full backdrop-blur-sm font-sans">
                    ACTIVITY PORTAL HOME
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight flex items-center gap-2">
                    <span>{currentUser?.avatar}</span> ようこそ、{currentUser?.name}さん！
                  </h2>
                  <p className="text-xs text-blue-100 leading-relaxed font-sans font-medium">
                    本日は {new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" })} です。
                    乗艇日誌の記録や24時間風況分析、部員同士の振り返りシェアを行って安全な活動を推進しましょう。
                  </p>
                </div>
              </div>

              {/* Home Grid Layout */}
              <div className="space-y-6">
                
                {/* Enoshima Offshore 24h Wind speed forecast at the very top */}
                <WindForecastMap />

                {/* Sailing Logs list */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-display flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-blue-500" /> 直近の乗艇日誌 (直近3日分)
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">直近3日間の練習記録と、各部員による振り返り・気象データ</p>
                    </div>
                  </div>

                  {(() => {
                    const sorted = [...reflections].sort((a, b) => b.date.localeCompare(a.date));
                    const reflectionsByDate: { [date: string]: Reflection[] } = {};
                    sorted.forEach(ref => {
                      if (!reflectionsByDate[ref.date]) {
                        reflectionsByDate[ref.date] = [];
                      }
                      reflectionsByDate[ref.date].push(ref);
                    });

                    // Sort dates descending and take latest 3 days
                    const sortedDates = Object.keys(reflectionsByDate).sort((a, b) => b.localeCompare(a));
                    const latest3Dates = sortedDates.slice(0, 3);

                    if (latest3Dates.length === 0) {
                      return (
                        <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center text-slate-400">
                          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs font-bold">乗艇日誌がまだ登録されていません。</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {latest3Dates.map(date => {
                          const dateLogs = reflectionsByDate[date];
                          const firstWeather = dateLogs[0]?.weather;
                          const isExpanded = expandedDate === date;

                          return (
                            <div key={date} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                              {/* Date Header / Toggle click area */}
                              <div 
                                onClick={() => setExpandedDate(isExpanded ? null : date)}
                                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                              >
                                <div className="flex items-center gap-4">
                                  <div className="bg-sky-50 text-sky-700 h-12 w-12 rounded-xl flex flex-col items-center justify-center border border-sky-100 shrink-0 font-mono">
                                    <span className="text-[10px] font-bold uppercase text-sky-500">
                                      {(() => {
                                        const d = new Date(date);
                                        return isNaN(d.getTime()) ? "MEMO" : d.toLocaleDateString("ja-JP", { month: "short" });
                                      })()}
                                    </span>
                                    <span className="text-lg font-black leading-none">
                                      {(() => {
                                        const d = new Date(date);
                                        return isNaN(d.getTime()) ? "⚓" : d.getDate();
                                      })()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                      {date} の練習
                                      <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-sky-100 font-sans">
                                        日誌 {dateLogs.length}件
                                      </span>
                                    </h4>
                                    <p className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                                      {firstWeather && (
                                        <>
                                          <span>天気: {firstWeather.condition || "晴れ"}</span>
                                          <span>•</span>
                                          <span>風速: {firstWeather.windSpeed || 0}m/s ({firstWeather.windDirection ? translateWindDirection(firstWeather.windDirection) : "北"})</span>
                                          <span>•</span>
                                          <span>気温: {firstWeather.temp || 20}°C</span>
                                        </>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                                  {/* Avatars of authors */}
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-400 font-bold mr-1">提出部員:</span>
                                    <div className="flex -space-x-1.5">
                                      {dateLogs.map((log) => (
                                        <span 
                                          key={log.id} 
                                          className="text-sm bg-slate-50 h-7 w-7 rounded-full border border-white flex items-center justify-center shadow-sm" 
                                          title={log.author_name}
                                        >
                                          {log.author_avatar}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Chevron icon to toggle expand/collapse */}
                                  <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4 text-sky-600" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Expanded Content: list of individual member logs on this date */}
                              {isExpanded && (
                                <div className="border-t border-slate-50 bg-slate-50/20 p-5 space-y-3">
                                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">
                                    部員の振り返り日誌一覧 ({dateLogs.length}名)
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dateLogs.map((log) => (
                                      <div 
                                        key={log.id}
                                        onClick={() => {
                                          setSelectedReflection(log);
                                          setActiveTab("reflections");
                                          window.scrollTo({ top: 0, behavior: "smooth" });
                                        }}
                                        className="bg-white p-4 rounded-xl border border-slate-150 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3"
                                      >
                                        <div className="space-y-2.5">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xl bg-slate-50 rounded-full h-7 w-7 flex items-center justify-center border border-slate-100 shrink-0">
                                              {log.author_avatar}
                                            </span>
                                            <div>
                                              <h5 className="text-xs font-black text-slate-800 leading-tight">{log.author_name}</h5>
                                              <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                                                役割: {profiles.find(p => p.user_id === log.author_id)?.role_display || "メンバー"}
                                              </p>
                                            </div>
                                          </div>
                                          <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                                            {log.text}
                                          </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[10px] text-slate-400 font-bold font-sans">
                                          <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5 text-slate-300" />
                                            コメント: {log.comments_count || 0}
                                          </span>
                                          <span className="text-sky-600 hover:underline flex items-center gap-0.5">
                                            詳細を見る <ChevronRight className="w-3 h-3" />
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* View More Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("reflections");
                            setSelectedReflection(null);
                            setShowEntryForm(false);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                          className="w-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer text-xs font-sans"
                        >
                          <span>すべての乗艇日誌を見る</span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    );
                  })()}

                </div>

              </div>

            </div>
          )}

          {/* TAB 1: REFLECTIONS */}
          {activeTab === "reflections" && (
            <div className="space-y-6">
              {selectedReflection ? (
                // Detailed Viewer
                <ReflectionDetail
                  reflection={selectedReflection}
                  currentUserToken={token!}
                  currentUserProfile={currentUser!}
                  profiles={profiles}
                  onBack={() => setSelectedReflection(null)}
                  onEdit={(ref) => {
                    setEditReflectionTarget(ref);
                    setShowEntryForm(true);
                  }}
                  onDeleted={() => {
                    setSelectedReflection(null);
                    loadCoreData();
                  }}
                  onBadgeAwarded={(badgeName) => {
                    setCelebratedBadge(badgeName);
                    fetchCurrentUser(token!);
                    loadCoreData();
                  }}
                />
              ) : showEntryForm ? (
                // Creating/Editing Form Entry
                <ReflectionEntry
                  currentUserToken={token!}
                  profiles={profiles}
                  editReflection={editReflectionTarget}
                  prefilledDate={prefilledDate}
                  onBack={() => {
                    setShowEntryForm(false);
                    setEditReflectionTarget(null);
                    setPrefilledDate(null);
                  }}
                  onSaved={(badgeAwarded?: string) => {
                    setShowEntryForm(false);
                    setEditReflectionTarget(null);
                    setPrefilledDate(null);
                    loadCoreData();
                    if (badgeAwarded) {
                      setCelebratedBadge(badgeAwarded);
                      fetchCurrentUser(token!);
                    }
                  }}
                />
              ) : (
                // List of Reflections
                <div className="space-y-6">

                  {/* List header filters */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">日誌タイムライン</h3>
                      <p className="text-[10px] text-slate-400">最新の乗艇トレーニング・振り返りが日付順に表示されます。</p>
                    </div>
                    <button
                      onClick={() => { setShowEntryForm(true); setEditReflectionTarget(null); setPrefilledDate(null); }}
                      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-sky-600/10 hover:shadow-sky-600/20 transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> 新規日誌を登録
                    </button>
                  </div>

                  {/* Log Cards Layout */}
                  {loadingReflections && reflections.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 animate-pulse font-medium">日誌データを読込中...</div>
                  ) : reflections.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 border border-dashed border-slate-200 text-center text-slate-400">
                      <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold">乗艇日誌がまだ登録されていません。</p>
                    </div>
                  ) : (
                    (() => {
                      // Group reflections by date
                      const reflectionsByDate: { [date: string]: Reflection[] } = {};
                      reflections.forEach(ref => {
                        if (!reflectionsByDate[ref.date]) {
                          reflectionsByDate[ref.date] = [];
                        }
                        reflectionsByDate[ref.date].push(ref);
                      });

                      // Sort dates descending
                      const sortedDates = Object.keys(reflectionsByDate).sort((a, b) => b.localeCompare(a));
                      const itemsPerPage = 10;
                      const totalPages = Math.ceil(sortedDates.length / itemsPerPage);
                      const paginatedDates = sortedDates.slice((logsPage - 1) * itemsPerPage, logsPage * itemsPerPage);

                      return (
                        <div className="space-y-4">
                          {paginatedDates.map(date => {
                            const dateLogs = reflectionsByDate[date];
                            const firstWeather = dateLogs[0]?.weather;
                            const isExpanded = expandedDate === date;

                            return (
                              <div key={date} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden transition-all">
                                {/* Date Header / Toggle click area */}
                                <div 
                                  onClick={() => setExpandedDate(isExpanded ? null : date)}
                                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="bg-sky-50 text-sky-700 h-12 w-12 rounded-xl flex flex-col items-center justify-center border border-sky-100 shrink-0 font-mono">
                                      <span className="text-[10px] font-bold uppercase text-sky-500">
                                        {(() => {
                                          const d = new Date(date);
                                          return isNaN(d.getTime()) ? "MEMO" : d.toLocaleDateString("ja-JP", { month: "short" });
                                        })()}
                                      </span>
                                      <span className="text-lg font-black leading-none">
                                        {(() => {
                                          const d = new Date(date);
                                          return isNaN(d.getTime()) ? "⚓" : d.getDate();
                                        })()}
                                      </span>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                                        {date} の練習
                                        <span className="bg-sky-50 text-sky-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-sky-100 font-sans">
                                          日誌 {dateLogs.length}件
                                        </span>
                                      </h4>
                                      <p className="text-[10px] text-slate-400 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                                        {firstWeather && (
                                          <>
                                            <span>天気: {firstWeather.condition || "晴れ"}</span>
                                            <span>•</span>
                                            <span>風速: {firstWeather.windSpeed || 0}m/s ({firstWeather.windDirection ? translateWindDirection(firstWeather.windDirection) : "北"})</span>
                                            <span>•</span>
                                            <span>気温: {firstWeather.temp || 20}°C</span>
                                          </>
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-50">
                                    {/* Avatars of authors */}
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-400 font-bold mr-1">提出部員:</span>
                                      <div className="flex -space-x-1.5">
                                        {dateLogs.map((log) => (
                                          <span 
                                            key={log.id} 
                                            className="text-sm bg-slate-50 h-7 w-7 rounded-full border border-white flex items-center justify-center shadow-sm" 
                                            title={log.author_name}
                                          >
                                            {log.author_avatar}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    {/* Plus Button to add a log for this specific date */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setPrefilledDate(date);
                                        setShowEntryForm(true);
                                        setEditReflectionTarget(null);
                                      }}
                                      title={`${date}の新しい日誌を書く`}
                                      className="h-8 w-8 rounded-full bg-sky-50 hover:bg-sky-100 border border-sky-100 flex items-center justify-center text-sky-600 transition-colors cursor-pointer shrink-0"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>

                                    {/* Chevron icon to toggle expand/collapse */}
                                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors shrink-0">
                                      {isExpanded ? (
                                        <ChevronDown className="w-4 h-4 text-sky-600" />
                                      ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Content: list of individual member logs on this date */}
                                {isExpanded && (
                                  <div className="border-t border-slate-50 bg-slate-50/20 p-5 space-y-3">
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black mb-1">
                                      部員の振り返り日誌一覧 ({dateLogs.length}名)
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      {dateLogs.map((log) => (
                                        <div 
                                          key={log.id}
                                          onClick={() => setSelectedReflection(log)}
                                          className="bg-white p-4 rounded-xl border border-slate-150 hover:border-sky-300 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between space-y-3"
                                        >
                                          <div className="space-y-2.5">
                                            <div className="flex items-center gap-2">
                                              <span className="text-xl bg-slate-50 rounded-full h-7 w-7 flex items-center justify-center border border-slate-100 shrink-0">
                                                {log.author_avatar}
                                              </span>
                                              <div>
                                                <h5 className="text-xs font-black text-slate-800 leading-tight">{log.author_name}</h5>
                                                <p className="text-[8px] text-slate-400 font-mono mt-0.5">
                                                  役割: {profiles.find(p => p.user_id === log.author_id)?.role_display || "メンバー"}
                                                </p>
                                              </div>
                                            </div>
                                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-sans">
                                              {log.text}
                                            </p>
                                          </div>

                                          <div className="pt-2.5 border-t border-slate-50 flex justify-between items-center text-[10px] text-slate-400">
                                            <span className="font-mono text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100">乗員数: {log.participating_members?.length || 1}名</span>
                                            <span className="text-sky-600 font-bold flex items-center gap-0.5 hover:underline">
                                              詳しく見る <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Pagination Controls */}
                          {totalPages > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                              <p className="text-xs text-slate-500 font-bold font-sans">
                                全 {sortedDates.length} 日間中 {(logsPage - 1) * itemsPerPage + 1} 〜 {Math.min(logsPage * itemsPerPage, sortedDates.length)} 日目を表示 ({logsPage} / {totalPages} ページ)
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  disabled={logsPage === 1}
                                  onClick={() => {
                                    setLogsPage(prev => Math.max(prev - 1, 1));
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-black bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 transition-all disabled:opacity-40 disabled:hover:border-slate-200 cursor-pointer"
                                >
                                  ← 前の10日分
                                </button>
                                <button
                                  type="button"
                                  disabled={logsPage === totalPages}
                                  onClick={() => {
                                    setLogsPage(prev => Math.min(prev + 1, totalPages));
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }}
                                  className="px-3.5 py-1.5 text-xs font-black bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-slate-600 transition-all disabled:opacity-40 disabled:hover:border-slate-200 cursor-pointer"
                                >
                                  次の10日分 →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE & CAREER STATS */}
          {activeTab === "profile" && (
            <PersonalProfile
              currentUserToken={token}
              currentUserProfile={currentUser}
              profiles={profiles}
              reflections={reflections}
              onProfileUpdated={loadCoreData}
            />
          )}

          {/* TAB 3: MAINTENANCE repairs */}
          {activeTab === "maintenance" && (
            <MaintenanceTab
              currentUserToken={token}
              currentUserProfile={currentUser}
              onRefreshNeeded={loadCoreData}
            />
          )}

          {/* TAB 5: WIKI Manual */}
          {activeTab === "wiki" && (
            <WikiTab
              currentUserToken={token}
              currentUserProfile={currentUser}
            />
          )}

          {/* TAB 6: WEATHER COMPREHENSIVE */}
          {activeTab === "weather" && (
            <div className="space-y-6">
              <WindForecastMap />
              
              {/* Extra Sea weather guide elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-display">
                    <Compass className="w-4 h-4 text-sky-500" /> 江の島海域セーリング特徴
                  </h3>
                  <div className="text-xs text-slate-600 leading-relaxed space-y-3">
                    <p>
                      <strong>1. 風系の特徴:</strong> 江の島沖は午前中は穏やかな北〜北東の陸風（オフショア）が吹きやすく、午後になると相模湾南部からの安定した南〜南西の海風（シーブリーズ、オンショア）に切り替わることが多いです。江の島特有の地形により、島影での風の乱れや風向シフトが生じやすいのが特徴です。
                    </p>
                    <p>
                      <strong>2. 波とうねり:</strong> 南西からの強風が吹くと、相模湾外洋からの大きく高いうねりや浅瀬でのブレイク波（砕波）が生じやすくなります。うねりに対する艇体の角度、セールの微調整、キール/センターボードの適正なコントロールが重要になります。
                    </p>
                    <p>
                      <strong>3. 安全指導:</strong> 急な気圧配置の変化により急速に風速が強まり波が高くなることがあります。江の島ヨットハーバーに掲揚される出港制限信号フラッグや、気象庁の注意報発令状況、雷雲レーダーをポータル上で常に確認してください。
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 font-display">
                    <Sun className="w-4 h-4 text-sky-500" /> 出航制限安全基準
                  </h3>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-left text-slate-400">
                          <th className="pb-2 font-bold text-[10px]">ステータス</th>
                          <th className="pb-2 font-bold text-[10px]">風速基準</th>
                          <th className="pb-2 font-bold text-[10px]">行動指示</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-[11px]">
                        <tr>
                          <td className="py-2.5 font-bold text-emerald-600">通常出航</td>
                          <td className="py-2.5 font-mono">0.0 〜 5.9 m/s</td>
                          <td className="py-2.5 text-slate-500">良好。初心者の乗艇指導・基本帆走に最適。</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-amber-500">強風注意</td>
                          <td className="py-2.5 font-mono">6.0 〜 7.9 m/s</td>
                          <td className="py-2.5 text-slate-500">ハイクアウト、沈起こしの技術必須。レスキュー艇追随。</td>
                        </tr>
                        <tr>
                          <td className="py-2.5 font-bold text-red-500">出航制限</td>
                          <td className="py-2.5 font-mono">8.0 m/s 以上</td>
                          <td className="py-2.5 text-slate-500 font-bold">全艇出航見合わせ。陸上トレーニングまたは座学に切り替え。</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ADMIN CONTROL PANEL */}
          {activeTab === "admin" && (currentUser?.role === "Admin" || currentUser?.is_admin) && (
            <AdminTab
              currentUserToken={token}
              currentUserProfile={currentUser}
              profiles={profiles}
              onRefreshNeeded={loadCoreData}
            />
          )}

          {/* Achievement Celebration Popup */}
          {celebratedBadge && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-sky-100 shadow-2xl text-center space-y-6 relative overflow-hidden">
                {/* Decorative Background Glows */}
                <div className="absolute -top-12 -left-12 w-24 h-24 bg-sky-400/10 rounded-full blur-xl" />
                <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-400/10 rounded-full blur-xl" />

                <div className="relative space-y-4">
                  <div className="text-6xl">🏆</div>
                  <h3 className="text-xl font-black text-slate-800 font-display">
                    バッジ獲得おめでとうございます！
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    継続的なご投稿、本当にお疲れ様です！活動への貢献を称え、新しいバッジ実績があなたのプロフィールに付与されました。
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/60 shadow-inner flex flex-col items-center justify-center space-y-2">
                  <span className="text-3xl">⭐</span>
                  <p className="text-sm font-black text-amber-800 tracking-tight">
                    {celebratedBadge}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCelebratedBadge(null)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-600/15 hover:shadow-blue-600/25 transition-all cursor-pointer text-xs"
                >
                  ありがとう！
                </button>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
