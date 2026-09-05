import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Tv, Server, Lock, User, Sparkles, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { AuthSession, XtreamLoginResponse } from '../types';
import { DEFAULT_PASS, DEFAULT_SERVER, DEFAULT_USER, loginXtream, saveAuth } from '../services/xtreamApi';

interface LoginViewProps {
  onLoginSuccess: (session: AuthSession, info: XtreamLoginResponse) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER);
  const [username, setUsername] = useState(DEFAULT_USER);
  const [password, setPassword] = useState(DEFAULT_PASS);
  const [anyname, setAnyname] = useState('PlayID Member');
  const [showPassword, setShowPassword] = useState(false);
  const [showServerSetting, setShowServerSetting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // TMDB backdrop details for cinematic background
  const [tmdbBackdrop, setTmdbBackdrop] = useState<string>(
    'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=1920&auto=format&fit=crop'
  );
  const [tmdbTitle, setTmdbTitle] = useState('ภาพยนตร์และช่องทีวียอดนิยมประจำวัน');
  const [tmdbRating, setTmdbRating] = useState('⭐ 8.9/10');

  useEffect(() => {
    // Fetch trending backdrop from TMDB
    const TMDB_API_KEY = '8baba8ab6b8bbe247645bcae7df63d0d';
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}&language=th-TH`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.results && data.results.length > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(6, data.results.length));
          const movie = data.results[randomIndex];
          if (movie.backdrop_path) {
            setTmdbBackdrop(`https://image.tmdb.org/t/p/original${movie.backdrop_path}`);
          }
          setTmdbTitle(movie.title || movie.name || movie.original_title);
          setTmdbRating(`⭐ ${(movie.vote_average || 8.5).toFixed(1)}/10 • ภาพยนตร์ยอดนิยม`);
        }
      })
      .catch(() => {
        // Fallback to default unsplash
      });
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim() || !serverUrl.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลให้ครบถ้วน');
      return;
    }

    setLoading(true);
    try {
      const data = await loginXtream(serverUrl.trim(), username.trim(), password.trim());
      const session: AuthSession = {
        serverUrl: serverUrl.trim(),
        username: username.trim(),
        password: password.trim(),
        anyname: anyname.trim() || username.trim(),
        userInfo: data.user_info,
      };

      if (rememberMe) {
        saveAuth(session);
      }

      onLoginSuccess(session, data);
    } catch (err: any) {
      setErrorMsg(err?.message || 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ กรุณาตรวจสอบข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="loginWrapper"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-cover bg-center transition-all duration-1000 select-none overflow-y-auto"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(11,15,25,0.95) 0%, rgba(11,15,25,0.7) 50%, rgba(11,15,25,0.85) 100%), radial-gradient(circle, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.9) 100%), url('${tmdbBackdrop}')`,
      }}
    >
      {/* Cinematic Highlight Info (Desktop only bottom-left) */}
      <div className="hidden md:block absolute bottom-10 left-12 max-w-xl pointer-events-none text-white z-10 animate-fade-in">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black bg-red-600 tracking-wide uppercase shadow-lg mb-3">
          <Sparkles className="w-3.5 h-3.5" /> แนะนำวันนี้
        </span>
        <h2 className="text-3xl lg:text-4xl font-black drop-shadow-md line-clamp-2 leading-tight mb-2">
          {tmdbTitle}
        </h2>
        <div className="text-amber-400 font-bold text-sm drop-shadow">{tmdbRating}</div>
      </div>

      {/* Login Box */}
      <div className="relative z-20 w-full max-w-md my-auto">
        <div className="backdrop-blur-xl bg-slate-900/85 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/80">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-xl shadow-indigo-500/25 mb-3 border border-white/20">
              <Tv className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-wider">
              Play<span className="text-pink-500">ID</span> IPTV
            </h1>
            <p className="text-xs text-slate-400 mt-1">Xtream Codes Player • ดูทีวีสด หนัง และซีรีส์</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Anyname */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ชื่อที่ใช้แสดง (Display Name)
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="loginAnyname"
                  type="text"
                  value={anyname}
                  onChange={(e) => setAnyname(e.target.value)}
                  placeholder="เช่น สมาชิก PlayID"
                  className="w-full bg-slate-800/90 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-pink-400">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="loginUsername"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full bg-slate-800/90 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                รหัสผ่าน (Password) <span className="text-pink-400">*</span>
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3.5 text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="loginPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full bg-slate-800/90 border border-white/10 text-white placeholder-slate-500 text-sm rounded-xl pl-10 pr-12 py-3 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Advanced Server Settings Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowServerSetting(!showServerSetting)}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1 font-semibold"
              >
                <Server className="w-3.5 h-3.5" />
                {showServerSetting ? 'ซ่อนการตั้งค่า URL เซิร์ฟเวอร์' : 'เปลี่ยน URL เซิร์ฟเวอร์ Xtream'}
              </button>
              {showServerSetting && (
                <div className="mt-2 animate-fade-in">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder="http://example.com:8080"
                    className="w-full bg-slate-800/90 border border-white/10 text-white text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    ตั้งค่าปัจจุบัน: {DEFAULT_SERVER}
                  </p>
                </div>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-800 border-white/10 text-indigo-600 focus:ring-indigo-500"
                />
                จดจำข้อมูลการเข้าสู่ระบบ
              </label>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              id="loginSubmitBtn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-indigo-500 to-pink-600 hover:from-indigo-400 hover:to-pink-500 text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังเชื่อมต่อเซิร์ฟเวอร์...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>เข้าสู่ระบบ (Connect)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Notice */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" />
              พร้อมใช้งานผ่านบัญชีทดสอบที่แนบมาโดยอัตโนมัติ
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
