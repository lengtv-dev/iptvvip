import React from 'react';
import { Tv, Film, Clapperboard, Heart, History, Trophy, Crown } from 'lucide-react';

interface NavbarMobileProps {
  activeTab: 'live' | 'vod' | 'series' | 'history' | 'favorites';
  onSelectTab: (tab: 'live' | 'vod' | 'series' | 'history' | 'favorites') => void;
  onOpenSports: () => void;
  onOpenPackages: () => void;
}

export const NavbarMobile: React.FC<NavbarMobileProps> = ({
  activeTab,
  onSelectTab,
  onOpenSports,
  onOpenPackages,
}) => {
  return (
    <nav
      id="bottomNavMobile"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-white/5 px-2 py-2 flex items-center justify-around select-none shadow-2xl"
      style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom))' }}
    >
      <button
        onClick={() => onSelectTab('live')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          activeTab === 'live'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Tv className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">ทีวีสด</span>
      </button>

      <button
        onClick={() => onSelectTab('vod')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          activeTab === 'vod'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Film className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">หนัง</span>
      </button>

      <button
        onClick={() => onSelectTab('series')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
          activeTab === 'series'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Clapperboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">ซีรีส์</span>
      </button>

      <button
        onClick={() => onSelectTab('favorites')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors ${
          activeTab === 'favorites'
            ? 'text-pink-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Heart className={`w-5 h-5 ${activeTab === 'favorites' ? 'fill-pink-500' : ''}`} />
        <span className="text-[10px] mt-0.5">โปรด</span>
      </button>

      <button
        onClick={() => onSelectTab('history')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors ${
          activeTab === 'history'
            ? 'text-indigo-400 font-bold'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">ประวัติ</span>
      </button>

      <button
        onClick={onOpenSports}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-pink-400 hover:text-pink-300 transition-colors"
      >
        <Trophy className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">บอลสด</span>
      </button>

      <button
        onClick={onOpenPackages}
        className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-400 hover:text-amber-300 transition-colors"
      >
        <Crown className="w-5 h-5" />
        <span className="text-[10px] mt-0.5 font-medium">VIP</span>
      </button>
    </nav>
  );
};
