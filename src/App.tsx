import React, { useEffect, useState, useMemo } from 'react';
import {
  AuthSession,
  Category,
  Episode,
  LiveStream,
  SeriesItem,
  VodStream,
  WatchHistoryItem,
  XtreamLoginResponse,
} from './types';
import {
  clearAuth,
  fetchSeriesDetail,
  fetchXtreamCategories,
  fetchXtreamStreams,
  getAdultState,
  getSavedAuth,
  getWatchHistory,
  loginXtream,
  setAdultState,
} from './services/xtreamApi';
import { getFavorites } from './services/favorites';
import { LoginView } from './components/LoginView';
import { Sidebar } from './components/Sidebar';
import { HeroSlider } from './components/HeroSlider';
import { ContentGrid } from './components/ContentGrid';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { InfoModal } from './components/InfoModal';
import { SportsModal } from './components/SportsModal';
import { PackagesModal } from './components/PackagesModal';
import { NavbarMobile } from './components/NavbarMobile';
import { GlobalSearchInput } from './components/GlobalSearchInput';
import { GlobalSearchResults } from './components/GlobalSearchResults';
import { Lock, ShieldAlert, X, Play, Maximize2, Tv, Film, Clapperboard, History, Heart } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'vod' | 'series' | 'history' | 'favorites'>('live');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [items, setItems] = useState<(LiveStream | VodStream | SeriesItem | WatchHistoryItem)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Global Search State & Media Caches
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [allLiveCache, setAllLiveCache] = useState<LiveStream[]>([]);
  const [allVodCache, setAllVodCache] = useState<VodStream[]>([]);
  const [allSeriesCache, setAllSeriesCache] = useState<SeriesItem[]>([]);
  const [isGlobalLoading, setIsGlobalLoading] = useState<boolean>(false);

  // Adult 18+ State
  const [showAdult, setShowAdult] = useState<boolean>(false);
  const [adultModalOpen, setAdultModalOpen] = useState<boolean>(false);
  const [adultPinInput, setAdultPinInput] = useState<string>('');
  const [adultPinError, setAdultPinError] = useState<string>('');

  // Modals
  const [sportsModalOpen, setSportsModalOpen] = useState<boolean>(false);
  const [packagesModalOpen, setPackagesModalOpen] = useState<boolean>(false);
  const [infoModalItem, setInfoModalItem] = useState<any | null>(null);
  const [playingItem, setPlayingItem] = useState<{
    id: string | number;
    name: string;
    cover?: string;
    kind: 'live' | 'vod' | 'series';
    ext?: string;
    resumeTime?: number;
    episodes?: Episode[];
    currentEpIndex?: number;
  } | null>(null);

  const [lastPlayedItem, setLastPlayedItem] = useState<{
    id: string | number;
    name: string;
    cover?: string;
    kind: 'live' | 'vod' | 'series';
    ext?: string;
    resumeTime?: number;
    episodes?: Episode[];
    currentEpIndex?: number;
  } | null>(null);

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Initialize Auth & Theme
  useEffect(() => {
    const savedTheme = (localStorage.getItem('m7_theme') as 'dark' | 'light') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);

    const adultState = getAdultState();
    setShowAdult(adultState.showAdult);

    const savedAuth = getSavedAuth();
    if (savedAuth && savedAuth.username && savedAuth.password && savedAuth.serverUrl) {
      setSession(savedAuth);
      // Verify session in background
      loginXtream(savedAuth.serverUrl, savedAuth.username, savedAuth.password)
        .then((res) => {
          setSession((prev) => (prev ? { ...prev, userInfo: res.user_info } : prev));
        })
        .catch(() => {
          // Keep saved session or clear if invalid
        });
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('m7_theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const handleLoginSuccess = (newSession: AuthSession) => {
    setSession(newSession);
    setActiveTab('live');
    setGlobalSearchQuery('');
  };

  const handleLogout = () => {
    clearAuth();
    setSession(null);
    setItems([]);
    setCategories([]);
    setPlayingItem(null);
    setInfoModalItem(null);
    setAllLiveCache([]);
    setAllVodCache([]);
    setAllSeriesCache([]);
    setGlobalSearchQuery('');
  };

  // Load Data when session, tab or adult status changes
  useEffect(() => {
    if (!session) return;

    if (activeTab === 'history') {
      const history = getWatchHistory();
      setItems(history);
      setCategories([]);
      setSelectedCategoryId('all');
      setIsLoading(false);
      return;
    }

    if (activeTab === 'favorites') {
      const favs = getFavorites().map((f) => ({
        ...f,
        ...(f.rawItem || {}),
        name: f.name,
        stream_icon: f.stream_icon || f.cover,
        cover: f.cover,
        kind: f.kind,
        category_name: f.kind === 'live' ? 'ช่องสด' : f.kind === 'vod' ? 'หนัง VOD' : 'ซีรีส์',
      }));
      setItems(favs);
      setCategories([
        { category_id: 'all', category_name: 'ทั้งหมด' },
        { category_id: 'live', category_name: '🔴 ทีวีสด' },
        { category_id: 'vod', category_name: '🎬 หนัง VOD' },
        { category_id: 'series', category_name: '📺 ซีรีส์' },
      ]);
      setSelectedCategoryId('all');
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetchXtreamCategories(session, activeTab),
      fetchXtreamStreams(session, activeTab),
    ])
      .then(([cats, streamList]) => {
        if (!isMounted) return;
        setCategories(cats);
        setItems(streamList as any);
        setSelectedCategoryId('all');

        // Populate global caches for instant multi-category search
        if (activeTab === 'live') {
          setAllLiveCache(streamList as LiveStream[]);
        } else if (activeTab === 'vod') {
          setAllVodCache(streamList as VodStream[]);
        } else if (activeTab === 'series') {
          setAllSeriesCache(streamList as SeriesItem[]);
        }
      })
      .catch((err) => {
        console.error('Error loading data:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [session, activeTab]);

  // Background prefetch for instant search experience across VOD & Series
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => {
      if (allVodCache.length === 0) {
        fetchXtreamStreams<VodStream>(session, 'vod')
          .then((res) => setAllVodCache(res || []))
          .catch(() => {});
      }
      if (allSeriesCache.length === 0) {
        fetchXtreamStreams<SeriesItem>(session, 'series')
          .then((res) => setAllSeriesCache(res || []))
          .catch(() => {});
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [session, allVodCache.length, allSeriesCache.length]);

  // Ensure all media streams are cached when user types into global search
  useEffect(() => {
    if (!session || !globalSearchQuery.trim()) return;

    let isMounted = true;
    const fetchMissing = async () => {
      const promises: Promise<any>[] = [];
      if (allLiveCache.length === 0) {
        promises.push(
          fetchXtreamStreams<LiveStream>(session, 'live')
            .then((res) => {
              if (isMounted) setAllLiveCache(res || []);
            })
            .catch(() => {})
        );
      }
      if (allVodCache.length === 0) {
        promises.push(
          fetchXtreamStreams<VodStream>(session, 'vod')
            .then((res) => {
              if (isMounted) setAllVodCache(res || []);
            })
            .catch(() => {})
        );
      }
      if (allSeriesCache.length === 0) {
        promises.push(
          fetchXtreamStreams<SeriesItem>(session, 'series')
            .then((res) => {
              if (isMounted) setAllSeriesCache(res || []);
            })
            .catch(() => {})
        );
      }

      if (promises.length > 0) {
        setIsGlobalLoading(true);
        await Promise.all(promises);
        if (isMounted) setIsGlobalLoading(false);
      }
    };

    fetchMissing();

    return () => {
      isMounted = false;
    };
  }, [globalSearchQuery, session, allLiveCache.length, allVodCache.length, allSeriesCache.length]);

  // Listen for favorite changes to keep favorites tab in sync
  useEffect(() => {
    if (activeTab !== 'favorites') return;

    const handleFavChange = () => {
      const favs = getFavorites().map((f) => ({
        ...f,
        ...(f.rawItem || {}),
        name: f.name,
        stream_icon: f.stream_icon || f.cover,
        cover: f.cover,
        kind: f.kind,
        category_name: f.kind === 'live' ? 'ช่องสด' : f.kind === 'vod' ? 'หนัง VOD' : 'ซีรีส์',
      }));

      if (selectedCategoryId === 'all') {
        setItems(favs);
      } else {
        setItems(favs.filter((item) => item.kind === selectedCategoryId));
      }
    };

    window.addEventListener('playid-favorites-changed', handleFavChange);
    window.addEventListener('storage', handleFavChange);
    return () => {
      window.removeEventListener('playid-favorites-changed', handleFavChange);
      window.removeEventListener('storage', handleFavChange);
    };
  }, [activeTab, selectedCategoryId]);

  // Load specific category items if user clicked a specific category ID (other than 'all')
  const handleSelectCategory = async (catId: string) => {
    setSelectedCategoryId(catId);
    if (!session || activeTab === 'history') return;

    if (activeTab === 'favorites') {
      const allFavs = getFavorites().map((f) => ({
        ...f,
        ...(f.rawItem || {}),
        name: f.name,
        stream_icon: f.stream_icon || f.cover,
        cover: f.cover,
        kind: f.kind,
        category_name: f.kind === 'live' ? 'ช่องสด' : f.kind === 'vod' ? 'หนัง VOD' : 'ซีรีส์',
      }));

      if (catId === 'all') {
        setItems(allFavs);
      } else {
        setItems(allFavs.filter((item) => item.kind === catId));
      }
      return;
    }

    if (catId === 'all') {
      setIsLoading(true);
      try {
        const streamList = await fetchXtreamStreams(session, activeTab);
        setItems(streamList as any);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const streamList = await fetchXtreamStreams(session, activeTab, catId);
      setItems(streamList as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Featured Items for Hero Slider
  const heroFeaturedItems = useMemo(() => {
    if (activeTab === 'history' || items.length === 0) return [];
    if (activeTab === 'live') {
      const sportKeywords = ['sport', 'กีฬา', 'บอล', 'bein', 'true sport', 'premier', 'hd 1', 'hd 2', '3 hd', '7 hd'];
      const sports = items.filter((it: any) => {
        const name = (it.name || it.title || '').toLowerCase();
        return sportKeywords.some((kw) => name.includes(kw));
      });
      return sports.length > 0 ? sports.slice(0, 16) : items.slice(0, 16);
    }
    return items.slice(0, 16);
  }, [items, activeTab]);

  // Click on item
  const handleItemClick = async (item: any) => {
    const kind = item.kind || activeTab;

    if (kind === 'live') {
      const liveItem = {
        id: item.stream_id || item.id,
        name: item.name || item.title || 'Live Stream',
        cover: item.stream_icon || item.cover,
        kind: 'live' as const,
      };
      setPlayingItem(liveItem);
      setLastPlayedItem(liveItem);
      return;
    }

    // Open detail info modal for VOD / Series
    setInfoModalItem(item);
  };

  // Start playback from InfoModal
  const handleStartPlayFromInfo = async (item: any) => {
    setInfoModalItem(null);
    const isSeries = activeTab === 'series' || item.kind === 'series' || Boolean(item.series_id);

    if (isSeries && session) {
      const sid = item.series_id || item.id;
      try {
        const details = await fetchSeriesDetail(session, sid);
        const epList: Episode[] = [];
        if (details && details.episodes) {
          const seasons = Object.keys(details.episodes).sort((a, b) => Number(a) - Number(b));
          seasons.forEach((sn) => {
            details.episodes[sn].forEach((ep) => {
              epList.push({
                ...ep,
                season: Number(sn),
              });
            });
          });
        }

        // Look up saved episode progress from history
        const savedHistory = getWatchHistory().find(
          (h) => h.kind === 'series' && String(h.id) === String(sid)
        );
        const resumeIndex = savedHistory?.epIndex || 0;
        const resumeTime = savedHistory?.pos || 0;

        const seriesPlayback = {
          id: sid,
          name: item.name || item.title,
          cover: item.cover || item.stream_icon,
          kind: 'series' as const,
          episodes: epList,
          currentEpIndex: resumeIndex < epList.length ? resumeIndex : 0,
          resumeTime,
        };
        setPlayingItem(seriesPlayback);
        setLastPlayedItem(seriesPlayback);
      } catch (err) {
        console.error('Error fetching series details:', err);
      }
      return;
    }

    // VOD Playback
    const savedHistory = getWatchHistory().find(
      (h) => h.kind === 'vod' && String(h.id) === String(item.stream_id || item.id)
    );
    const vodPlayback = {
      id: item.stream_id || item.id,
      name: item.name || item.title,
      cover: item.stream_icon || item.cover,
      kind: 'vod' as const,
      ext: item.container_extension || item.ext || 'mp4',
      resumeTime: savedHistory?.pos || 0,
    };
    setPlayingItem(vodPlayback);
    setLastPlayedItem(vodPlayback);
  };

  // Download Playlist
  const handleDownloadM3U = () => {
    if (!session) return;
    const url = `/api/xtream/m3u?serverUrl=${encodeURIComponent(session.serverUrl)}&username=${encodeURIComponent(session.username)}&password=${encodeURIComponent(session.password)}&type=m3u_plus`;
    window.location.href = url;
  };

  // Adult 18+ Toggle Handling
  const handleToggleAdultBtn = () => {
    if (showAdult) {
      if (window.confirm('ต้องการปิด/ซ่อนหมวดหมู่ 18+ หรือไม่?')) {
        setShowAdult(false);
        setAdultState(false);
      }
    } else {
      setAdultPinInput('');
      setAdultPinError('');
      setAdultModalOpen(true);
    }
  };

  const handleVerifyAdultPin = (e: React.FormEvent) => {
    e.preventDefault();
    const { pin } = getAdultState();
    if (!pin) {
      // First time PIN setup
      if (!adultPinInput.trim()) {
        setAdultPinError('กรุณากำหนดรหัสผ่านตัวเลขอย่างน้อย 4 หลัก');
        return;
      }
      setAdultState(true, adultPinInput.trim());
      setShowAdult(true);
      setAdultModalOpen(false);
    } else {
      if (adultPinInput.trim() === pin) {
        setAdultState(true);
        setShowAdult(true);
        setAdultModalOpen(false);
      } else if (adultPinInput.trim().toLowerCase() === 'reset') {
        setAdultState(false, '');
        alert('ล้างรหัสผ่านเรียบร้อยแล้ว');
        setAdultModalOpen(false);
      } else {
        setAdultPinError('รหัสผ่านไม่ถูกต้อง (พิมพ์ reset เพื่อล้างรหัส)');
      }
    }
  };

  // If not logged in, render Login View
  if (!session) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div
      id="appContainer"
      className="w-full h-screen flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100 font-sans"
    >
      {/* Desktop Sidebar */}
      <Sidebar
        session={session}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setGlobalSearchQuery('');
        }}
        onOpenSports={() => setSportsModalOpen(true)}
        onOpenPackages={() => setPackagesModalOpen(true)}
        onDownloadM3U={handleDownloadM3U}
        onRefresh={() => {
          setIsLoading(true);
          Promise.all([
            fetchXtreamCategories(session, activeTab),
            fetchXtreamStreams(session, activeTab),
          ]).then(([cats, streamList]) => {
            setCategories(cats);
            setItems(streamList as any);
            setSelectedCategoryId('all');
            setIsLoading(false);
          });
        }}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Column */}
      <div className="flex-1 h-full flex flex-col overflow-hidden min-w-0">
        {/* Top Header matching Vibrant Palette */}
        <header className="h-16 md:h-20 flex items-center justify-between px-3 sm:px-6 md:px-8 bg-slate-950/70 backdrop-blur-md border-b border-white/5 shrink-0 z-20 gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-slate-400 hidden xl:inline">
                {(session.serverUrl || '').replace(/^https?:\/\//, '').replace(/\/+$/, '')}
              </span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/20 hidden md:inline-block">
              {activeTab === 'live' && 'ถ่ายทอดสด (Live TV)'}
              {activeTab === 'vod' && 'ภาพยนตร์ (Movies VOD)'}
              {activeTab === 'series' && 'ซีรีส์ (TV Series)'}
              {activeTab === 'favorites' && 'รายการโปรด (Favorites)'}
              {activeTab === 'history' && 'ประวัติการรับชม'}
            </span>
          </div>

          {/* Global Search Input Field in Header */}
          <GlobalSearchInput
            query={globalSearchQuery}
            onQueryChange={setGlobalSearchQuery}
            onClear={() => setGlobalSearchQuery('')}
            liveItems={allLiveCache}
            vodItems={allVodCache}
            seriesItems={allSeriesCache}
            onSelectItem={(item, kind) => handleItemClick({ ...item, kind })}
            onViewAll={() => {
              // Keeps the globalSearchQuery active to view in main area
            }}
            isLoading={isGlobalLoading}
            showAdult={showAdult}
          />

          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white truncate max-w-[140px] lg:max-w-[180px]">
                {session.anyname || session.username}
              </p>
              <p className="text-[10px] text-pink-500 font-bold uppercase tracking-wider">
                Premium Member
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center border-2 border-slate-800 shadow-lg shadow-indigo-500/20 shrink-0">
              <span className="text-xs font-bold text-white uppercase">
                {(session.anyname || session.username).slice(0, 2)}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 h-full overflow-y-auto overflow-x-hidden flex flex-col pb-16 md:pb-0">
          {globalSearchQuery.trim() ? (
            <GlobalSearchResults
              query={globalSearchQuery}
              onClearQuery={() => setGlobalSearchQuery('')}
              liveItems={allLiveCache}
              vodItems={allVodCache}
              seriesItems={allSeriesCache}
              onSelectItem={(item, kind) => handleItemClick({ ...item, kind })}
              showAdult={showAdult}
              isLoading={isGlobalLoading}
            />
          ) : (
            <>
              {/* Featured Hero Slider (hidden on history & favorites tabs) */}
              {activeTab !== 'history' && activeTab !== 'favorites' && (
                <HeroSlider
                  items={heroFeaturedItems}
                  type={activeTab as 'live' | 'vod' | 'series'}
                  onSelectItem={handleItemClick}
                />
              )}

              {/* Content Grid */}
              <ContentGrid
                type={activeTab}
                items={items as any}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onSelectCategory={handleSelectCategory}
                onSelectItem={handleItemClick}
                showAdult={showAdult}
                onToggleAdult={handleToggleAdultBtn}
                isLoading={isLoading}
              />
            </>
          )}
        </main>

        {/* Vibrant Palette Now Playing Persistent Bar (when last played item exists and player not fullscreen) */}
        {lastPlayedItem && !playingItem && (
          <footer
            onClick={() => setPlayingItem(lastPlayedItem)}
            className="h-14 sm:h-16 bg-gradient-to-r from-indigo-600 via-indigo-700 to-pink-700 px-4 sm:px-8 flex items-center justify-between text-white shadow-xl z-30 shrink-0 cursor-pointer hover:opacity-95 transition-opacity"
          >
            <div className="flex items-center space-x-3.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Play className="w-4 h-4 text-white fill-current ml-0.5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold uppercase opacity-80 leading-none">
                  Now Playing / ล่าสุด
                </span>
                <span className="text-sm font-bold truncate max-w-xs sm:max-w-md mt-0.5">
                  {lastPlayedItem.name}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs font-semibold">
              <span className="hidden sm:inline bg-white/20 px-3 py-1 rounded-full text-[11px] font-medium">
                คลิกเพื่อเล่นต่อ
              </span>
              <Maximize2 className="w-4 h-4 text-white/90" />
            </div>
          </footer>
        )}
      </div>

      {/* Mobile Navigation Bar */}
      <NavbarMobile
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setGlobalSearchQuery('');
        }}
        onOpenSports={() => setSportsModalOpen(true)}
        onOpenPackages={() => setPackagesModalOpen(true)}
      />

      {/* Video Player Modal */}
      {playingItem && (
        <VideoPlayerModal
          session={session}
          item={playingItem}
          onClose={() => setPlayingItem(null)}
          onSelectEpisode={(idx) => {
            setPlayingItem((prev) => (prev ? { ...prev, currentEpIndex: idx } : null));
          }}
        />
      )}

      {/* Movie / Series Info Modal */}
      {infoModalItem && (
        <InfoModal
          session={session}
          item={infoModalItem}
          onClose={() => setInfoModalItem(null)}
          onPlay={handleStartPlayFromInfo}
        />
      )}

      {/* Live Sports Schedule Modal */}
      {sportsModalOpen && (
        <SportsModal
          onClose={() => setSportsModalOpen(false)}
          onWatchChannel={(channelKeyword) => {
            setActiveTab('live');
            // User can search for the channel in live view
          }}
        />
      )}

      {/* VIP Packages Modal */}
      {packagesModalOpen && (
        <PackagesModal onClose={() => setPackagesModalOpen(false)} />
      )}

      {/* 18+ Adult Content PIN Prompt Modal */}
      {adultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-red-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>ปลดล็อกหมวด 18+ (ผู้ใหญ่)</span>
              </div>
              <button
                onClick={() => setAdultModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyAdultPin} className="space-y-4">
              <p className="text-xs text-slate-300">
                {getAdultState().pin
                  ? 'กรุณากรอกรหัสผ่านเพื่อแสดงหมวดหมู่ 18+ (พิมพ์ reset เพื่อล้างรหัส)'
                  : 'ตั้งรหัสผ่านตัวเลขสำหรับป้องกันหมวดหมู่ 18+:'}
              </p>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3 text-slate-400" />
                <input
                  type="password"
                  autoFocus
                  required
                  value={adultPinInput}
                  onChange={(e) => setAdultPinInput(e.target.value)}
                  placeholder="รหัสผ่านตัวเลข"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 font-mono tracking-widest text-center"
                />
              </div>

              {adultPinError && (
                <p className="text-xs text-red-400 font-semibold text-center">{adultPinError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdultModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white transition-colors shadow"
                >
                  ยืนยัน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
