import React, { useEffect, useState } from 'react';
import {
  Tv,
  Film,
  Clapperboard,
  History,
  Heart,
  Trophy,
  Crown,
  Download,
  Sun,
  Moon,
  RefreshCw,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { AuthSession } from '../types';
import { formatExpDate } from '../services/xtreamApi';
import { getFavorites } from '../services/favorites';

interface SidebarProps {
  session: AuthSession;
  activeTab: 'live' | 'vod' | 'series' | 'history' | 'favorites';
  onSelectTab: (tab: 'live' | 'vod' | 'series' | 'history' | 'favorites') => void;
  onOpenSports: () => void;
  onOpenPackages: () => void;
  onDownloadM3U: () => void;
  onRefresh: () => void;
  onLogout: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  session,
  activeTab,
  onSelectTab,
  onOpenSports,
  onOpenPackages,
  onDownloadM3U,
  onRefresh,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const userInfo = session.userInfo;
  const expFormatted = formatExpDate(userInfo?.exp_date);
  const displayName = session.anyname || session.username;
  const serverHost = session.serverUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

  const [favoritesCount, setFavoritesCount] = useState<number>(() => getFavorites().length);

  useEffect(() => {
    const updateCount = () => {
      setFavoritesCount(getFavorites().length);
    };
    window.addEventListener('playid-favorites-changed', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('playid-favorites-changed', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  return (
    <aside
      id="appSidebar"
      className="hidden md:flex flex-col w-64 lg:w-72 h-full border-r border-white/5 shrink-0 z-30 transition-colors duration-200 select-none bg-slate-900 text-slate-100"
    >
      {/* Brand & User Profile */}
      <div className="p-5 border-b border-white/5">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Tv className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-500">
            PLAYID TV
          </span>
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-white/5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center border-2 border-slate-800 text-white font-bold text-xs shrink-0 shadow">
            <span>{displayName.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" title="ออนไลน์" />
            </div>
            <p className="text-[10px] text-pink-500 font-bold uppercase tracking-wider">
              Premium Member
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {expFormatted}
            </p>
          </div>
        </div>

        <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950/60 border border-white/5 text-[11px] text-slate-400">
          <span>สถานะ: <strong className="text-emerald-400 font-bold">Active</strong></span>
          <span>การเชื่อมต่อ: <strong className="text-indigo-400 font-bold">{userInfo?.max_connections || '1'} จอ</strong></span>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-none">
        <div className="px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          เมนูหลัก (Navigation)
        </div>

        <button
          id="navTabLive"
          onClick={() => onSelectTab('live')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
            activeTab === 'live'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Tv className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">ช่องทีวีสด (Live TV)</span>
        </button>

        <button
          id="navTabVod"
          onClick={() => onSelectTab('vod')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
            activeTab === 'vod'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Film className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">หนัง VOD (ภาพยนตร์)</span>
        </button>

        <button
          id="navTabSeries"
          onClick={() => onSelectTab('series')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
            activeTab === 'series'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Clapperboard className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">ซีรีส์ (Series)</span>
        </button>

        <button
          id="navTabFavorites"
          onClick={() => onSelectTab('favorites')}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-150 ${
            activeTab === 'favorites'
              ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center space-x-3">
            <Heart className={`w-5 h-5 shrink-0 ${activeTab === 'favorites' ? 'fill-pink-500 text-pink-500' : 'text-pink-400'}`} />
            <span className="font-medium text-sm">รายการโปรด</span>
          </div>
          {favoritesCount > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
              {favoritesCount}
            </span>
          )}
        </button>

        <button
          id="navTabHistory"
          onClick={() => onSelectTab('history')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-150 ${
            activeTab === 'history'
              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <History className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">ประวัติการรับชม</span>
        </button>

        <div className="pt-3 px-3 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          ฟีเจอร์พิเศษ
        </div>

        {/* Live Sports Schedule */}
        <button
          id="btnSportsSchedule"
          onClick={onOpenSports}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150 border border-transparent hover:border-red-500/20"
        >
          <div className="flex items-center space-x-3">
            <Trophy className="w-4 h-4 shrink-0 text-red-400" />
            <span>ตารางถ่ายทอดสดกีฬา</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </button>

        {/* VIP Packages */}
        <button
          id="btnPackagesModal"
          onClick={onOpenPackages}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition-all duration-150 border border-transparent hover:border-amber-500/20"
        >
          <div className="flex items-center space-x-3">
            <Crown className="w-4 h-4 shrink-0 text-amber-400" />
            <span>แพ็กเกจ VIP & ต่ออายุ</span>
          </div>
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </button>

        {/* Download M3U */}
        <button
          id="btnDownloadM3U"
          onClick={onDownloadM3U}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all duration-150"
        >
          <Download className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>ดาวน์โหลดเพลย์ลิสต์ M3U</span>
        </button>
      </div>

      {/* Server Status Widget from Vibrant Palette */}
      <div className="p-4 bg-indigo-600/5 border-t border-white/5">
        <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-white/5">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Server Status</span>
            <span className="text-xs text-slate-300 truncate font-mono">{serverHost}</span>
          </div>
        </div>
      </div>

      {/* Bottom Settings & Controls */}
      <div className="p-3 border-t border-white/5 space-y-1 bg-slate-900/90">
        <button
          id="btnThemeToggle"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span>ธีม ({theme === 'dark' ? 'Dark Mode' : 'Light Mode'})</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-white/5">
            {theme}
          </span>
        </button>

        <button
          id="btnRefreshCache"
          onClick={onRefresh}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>รีเฟรชข้อมูลเซิร์ฟเวอร์</span>
        </button>

        <button
          id="btnLogout"
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-pink-400 hover:bg-pink-500/10 hover:text-pink-300 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ (Exit)</span>
        </button>
      </div>
    </aside>
  );
};
