import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShieldAlert, Sparkles, ChevronLeft, ChevronRight, Play, Film, Clapperboard, Tv, Heart } from 'lucide-react';
import { Category, LiveStream, SeriesItem, VodStream } from '../types';
import { getProxiedImageUrl, isAdultContent } from '../services/xtreamApi';
import { isFavorite, toggleFavorite, determineItemKind } from '../services/favorites';

interface ContentGridProps {
  type: 'live' | 'vod' | 'series' | 'history' | 'favorites';
  items: (LiveStream | VodStream | SeriesItem)[];
  categories: Category[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onSelectItem: (item: any) => void;
  showAdult: boolean;
  onToggleAdult: () => void;
  isLoading: boolean;
}

const ITEMS_PER_PAGE = 36;

export const ContentGrid: React.FC<ContentGridProps> = ({
  type,
  items,
  categories,
  selectedCategoryId,
  onSelectCategory,
  onSelectItem,
  showAdult,
  onToggleAdult,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [favVersion, setFavVersion] = useState(0);

  useEffect(() => {
    const onFavChange = () => setFavVersion((v) => v + 1);
    window.addEventListener('playid-favorites-changed', onFavChange);
    window.addEventListener('storage', onFavChange);
    return () => {
      window.removeEventListener('playid-favorites-changed', onFavChange);
      window.removeEventListener('storage', onFavChange);
    };
  }, []);

  // Filter Categories by adult flag & category search
  const visibleCategories = useMemo(() => {
    return categories.filter((cat) => {
      if (!showAdult && isAdultContent(cat.category_name)) return false;
      if (categoryFilter.trim()) {
        return cat.category_name.toLowerCase().includes(categoryFilter.toLowerCase());
      }
      return true;
    });
  }, [categories, showAdult, categoryFilter]);

  // Filter Items by adult flag & search query
  const filteredItems = useMemo(() => {
    return items.filter((item: any) => {
      const name = item.name || item.title || '';
      if (!showAdult && isAdultContent(name)) return false;
      if (searchQuery.trim()) {
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [items, showAdult, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isLive = type === 'live';

  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === 'all') return 'ทั้งหมด';
    const found = categories.find((c) => String(c.category_id) === String(selectedCategoryId));
    return found ? found.category_name : 'รายการทั้งหมด';
  }, [categories, selectedCategoryId]);

  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 select-none">
      {/* Search & Category Filter Header */}
      <div className="bg-slate-900/70 border border-white/5 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Main Item Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={
                isLive
                  ? 'ค้นหาช่องทีวีสด (เช่น ช่อง 3, Mono, True, Bein, Fox)...'
                  : 'ค้นหาภาพยนตร์ / ซีรีส์...'
              }
              className="w-full bg-slate-900/80 border border-white/10 rounded-full pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            />
          </div>

          {/* Adult 18+ Protection Toggle */}
          <button
            onClick={onToggleAdult}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all shrink-0 ${
              showAdult
                ? 'bg-red-500/20 border-red-500/50 text-red-400 shadow-lg shadow-red-500/10'
                : 'bg-slate-800/80 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{showAdult ? '🔞 หมวด 18+ (เปิดใช้งาน)' : '🔞 หมวด 18+ (ซ่อนอยู่)'}</span>
          </button>
        </div>

        {/* Categories Chips */}
        {categories.length > 0 && type !== 'history' && (
          <div className="pt-3 border-t border-white/5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                เลือกหมวดหมู่ ({visibleCategories.length} หมวด)
              </span>
              {categories.length > 10 && (
                <div className="w-48">
                  <input
                    type="text"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    placeholder="กรองหมวดหมู่..."
                    className="w-full bg-slate-800/60 border border-white/10 rounded-full px-3 py-1 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto scrollbar-none pr-1">
              <button
                onClick={() => {
                  onSelectCategory('all');
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-white/5'
                }`}
              >
                All • รวมทั้งหมด ({items.length})
              </button>

              {visibleCategories.map((cat) => {
                const isSelected = String(cat.category_id) === String(selectedCategoryId);
                return (
                  <button
                    key={cat.category_id}
                    onClick={() => {
                      onSelectCategory(cat.category_id);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat.category_name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Grid Content Title */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
          {type === 'live' && <Tv className="w-5 h-5 text-indigo-400" />}
          {type === 'vod' && <Film className="w-5 h-5 text-pink-400" />}
          {type === 'series' && <Clapperboard className="w-5 h-5 text-indigo-400" />}
          {type === 'favorites' && <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />}
          <span>
            {type === 'favorites' ? 'รายการโปรดที่บันทึกไว้' : selectedCategoryName} ({filteredItems.length} {isLive ? 'ช่อง' : 'รายการ'})
          </span>
        </h2>
        {totalPages > 1 && (
          <span className="text-xs font-medium text-slate-400 bg-slate-800/60 px-3 py-1 rounded-full border border-white/5">
            หน้า {validPage} จาก {totalPages}
          </span>
        )}
      </div>

      {/* Loading Spinner */}
      {isLoading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-3 border-slate-700 border-t-indigo-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">กำลังโหลดรายการจากเซิร์ฟเวอร์...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="py-24 text-center bg-slate-900/40 rounded-2xl border border-white/5 px-4">
          {type === 'favorites' ? (
            <>
              <div className="w-14 h-14 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-3 text-pink-400">
                <Heart className="w-7 h-7 fill-pink-500/30" />
              </div>
              <p className="text-base font-bold text-slate-200">ยังไม่มีรายการโปรด</p>
              <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto leading-relaxed">
                คลิกที่รายการใดๆ เพื่อเปิดหน้าข้อมูล และกดปุ่ม <span className="text-pink-400 font-semibold">"รายการโปรด"</span> หรือคลิกไอคอนหัวใจบนการ์ด เพื่อบุ๊กมาร์กช่อง หนัง และซีรีส์ที่ชอบ
              </p>
            </>
          ) : (
            <>
              <Sparkles className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-base font-bold text-slate-300">ไม่พบรายการเนื้อหา</p>
              <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกหมวดหมู่อื่น</p>
            </>
          )}
        </div>
      ) : (
        /* Items Grid */
        <div
          className={`grid gap-4 sm:gap-5 ${
            isLive
              ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6'
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'
          }`}
        >
          {pageItems.map((item: any, idx) => {
            const title = item.name || item.title || '-';
            const icon = item.stream_icon || item.cover || '';
            const proxiedIcon = getProxiedImageUrl(icon);
            const channelNum = String(item.num || item.stream_id || (startIndex + idx + 1)).padStart(3, '0').slice(-3);
            const itemId = String(item.stream_id || item.series_id || item.id);
            const isFav = isFavorite(itemId);
            const is4K =
              title.toUpperCase().includes('4K') ||
              title.toUpperCase().includes('2160') ||
              selectedCategoryName.toUpperCase().includes('4K');

            return (
              <div
                key={idx}
                onClick={() => onSelectItem(item)}
                className="group relative flex flex-col bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/40 cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-200"
              >
                {/* Thumbnail Container */}
                <div
                  className={`relative w-full overflow-hidden flex items-center justify-center ${
                    isLive ? 'aspect-video p-3 bg-indigo-950/30' : 'aspect-[2/3] bg-slate-950'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 pointer-events-none" />

                  {/* Quick Favorite Toggle Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const kind = item.kind || determineItemKind(item, type === 'favorites' ? undefined : type);
                      toggleFavorite(item, kind);
                      setFavVersion((v) => v + 1);
                    }}
                    className={`absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all backdrop-blur-md ${
                      isFav
                        ? 'bg-pink-500/90 text-white shadow-md shadow-pink-500/40 opacity-100 scale-105'
                        : 'bg-black/50 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-black/75'
                    }`}
                    title={isFav ? 'ลบออกจากรายการโปรด' : 'เพิ่มในรายการโปรด'}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-current' : ''}`} />
                  </button>

                  {proxiedIcon ? (
                    <img
                      src={proxiedIcon}
                      alt={title}
                      loading="lazy"
                      className={`w-full h-full relative z-0 ${
                        isLive
                          ? 'object-contain'
                          : 'object-cover group-hover:scale-105 transition-transform duration-300'
                      }`}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.visibility = 'hidden';
                      }}
                    />
                  ) : (
                    <div className="text-white/20 text-xl font-black italic tracking-tighter text-center px-2 uppercase">
                      {title.slice(0, 15)}
                    </div>
                  )}

                  {/* Hover Play Button Overlay */}
                  <div className="absolute inset-0 z-10 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Content Details (from Vibrant Palette Card design) */}
                <div className="p-3 sm:p-3.5 flex-1 flex flex-col justify-between bg-slate-900">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {channelNum}
                      </span>
                      {isLive ? (
                        <span className="text-[10px] px-2 py-0.5 bg-red-500 rounded text-white font-bold uppercase shadow-sm">
                          Live
                        </span>
                      ) : is4K ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black tracking-wider uppercase">
                          4K UHD
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                          HD
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-sm text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                      {title}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-1">
                    {item.category_name || selectedCategoryName || 'PLAYID IPTV'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/5">
          <button
            onClick={() => handlePageChange(validPage - 1)}
            disabled={validPage <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5"
          >
            <ChevronLeft className="w-4 h-4" /> ก่อนหน้า
          </button>

          <span className="px-3.5 py-1.5 text-xs font-bold text-indigo-300 bg-slate-900 border border-indigo-500/30 rounded-full">
            หน้า {validPage} / {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(validPage + 1)}
            disabled={validPage >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-full text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none transition-colors border border-white/5"
          >
            ถัดไป <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
