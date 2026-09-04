import {
  AuthSession,
  Category,
  LiveStream,
  SeriesDetail,
  SeriesItem,
  VodDetail,
  VodStream,
  WatchHistoryItem,
  XtreamLoginResponse,
} from '../types';

export const DEFAULT_SERVER = 'http://103.114.203.129:8080';
export const DEFAULT_USER = 'playidtv2535';
export const DEFAULT_PASS = '12345';

const ADULT_KEYWORDS = [
  '18+',
  'adult',
  'หนังผู้ใหญ่',
  'หนังโป๊',
  'onlyfans',
  'xxx',
  'porn',
  'nsfw',
  'av ',
  'r21',
  'sex',
];

export function isAdultContent(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return ADULT_KEYWORDS.some((kw) => lower.includes(kw));
}

export async function loginXtream(
  serverUrl: string,
  user: string,
  pass: string
): Promise<XtreamLoginResponse> {
  const params = new URLSearchParams({
    serverUrl,
    username: user,
    password: pass,
  });

  const res = await fetch(`/api/xtream/data?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`การเชื่อมต่อล้มเหลว (HTTP ${res.status})`);
  }
  const data = await res.json();
  if (!data || !data.user_info || data.user_info.auth === 0) {
    throw new Error('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีหมดอายุ');
  }
  return data;
}

export async function fetchXtreamCategories(
  session: AuthSession,
  type: 'live' | 'vod' | 'series'
): Promise<Category[]> {
  const actionMap = {
    live: 'get_live_categories',
    vod: 'get_vod_categories',
    series: 'get_series_categories',
  };

  const params = new URLSearchParams({
    serverUrl: session.serverUrl,
    username: session.username,
    password: session.password,
    action: actionMap[type],
  });

  const res = await fetch(`/api/xtream/data?${params.toString()}`);
  if (!res.ok) throw new Error(`โหลดหมวดหมู่ไม่สำเร็จ HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    return data ? (Object.values(data) as Category[]) : [];
  }
  return data;
}

export async function fetchXtreamStreams<T>(
  session: AuthSession,
  type: 'live' | 'vod' | 'series',
  categoryId?: string
): Promise<T[]> {
  const actionMap = {
    live: 'get_live_streams',
    vod: 'get_vod_streams',
    series: 'get_series',
  };

  const params = new URLSearchParams({
    serverUrl: session.serverUrl,
    username: session.username,
    password: session.password,
    action: actionMap[type],
  });

  if (categoryId && categoryId !== 'all' && !categoryId.startsWith('year_') && categoryId !== 'recent') {
    params.set('category_id', categoryId);
  }

  const res = await fetch(`/api/xtream/data?${params.toString()}`);
  if (!res.ok) throw new Error(`โหลดรายการไม่สำเร็จ HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) {
    return data ? (Object.values(data) as T[]) : [];
  }
  return data;
}

export async function fetchVodDetail(
  session: AuthSession,
  vodId: number | string
): Promise<VodDetail> {
  const params = new URLSearchParams({
    serverUrl: session.serverUrl,
    username: session.username,
    password: session.password,
    action: 'get_vod_info',
    vod_id: String(vodId),
  });

  const res = await fetch(`/api/xtream/data?${params.toString()}`);
  if (!res.ok) throw new Error(`โหลดข้อมูลภาพยนตร์ไม่สำเร็จ`);
  return res.json();
}

export async function fetchSeriesDetail(
  session: AuthSession,
  seriesId: number | string
): Promise<SeriesDetail> {
  const params = new URLSearchParams({
    serverUrl: session.serverUrl,
    username: session.username,
    password: session.password,
    action: 'get_series_info',
    series_id: String(seriesId),
  });

  const res = await fetch(`/api/xtream/data?${params.toString()}`);
  if (!res.ok) throw new Error(`โหลดข้อมูลซีรีส์ไม่สำเร็จ`);
  return res.json();
}

export function buildStreamUrl(
  session: AuthSession,
  type: 'live' | 'vod' | 'series',
  id: number | string,
  ext: string = 'mp4'
): string {
  const cleanBase = session.serverUrl.replace(/\/+$/, '');
  const u = encodeURIComponent(session.username);
  const p = encodeURIComponent(session.password);

  if (type === 'live') {
    return `${cleanBase}/live/${u}/${p}/${id}.m3u8`;
  }
  if (type === 'vod') {
    return `${cleanBase}/movie/${u}/${p}/${id}.${ext}`;
  }
  return `${cleanBase}/series/${u}/${p}/${id}.${ext}`;
}

export function getProxiedUrl(targetUrl: string): string {
  if (!targetUrl) return '';
  return `/api/stream/proxy?url=${encodeURIComponent(targetUrl)}`;
}

export function getProxiedImageUrl(imageUrl?: string): string {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('https://')) return imageUrl;
  return `/api/stream/image?url=${encodeURIComponent(imageUrl)}`;
}

// Local Storage helpers
const STORAGE_AUTH_KEY = 'xtream_login_session';
const STORAGE_RECENT_KEY = 'xtream_watch_history';
const STORAGE_ADULT_PIN = 'adult';
const STORAGE_SHOW_ADULT = 'adult';

export function getSavedAuth(): AuthSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(session: AuthSession): void {
  try {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(session));
  } catch (e) {
    console.error(e);
  }
}

export function clearAuth(): void {
  try {
    localStorage.removeItem(STORAGE_AUTH_KEY);
  } catch (e) {
    console.error(e);
  }
}

export function getWatchHistory(): WatchHistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchHistory(items: WatchHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_RECENT_KEY, JSON.stringify(items.slice(0, 30)));
  } catch (e) {
    console.error(e);
  }
}

export function upsertWatchHistory(item: Omit<WatchHistoryItem, 'timestamp'>): void {
  const current = getWatchHistory();
  const filtered = current.filter(
    (x) => !(x.kind === item.kind && String(x.id) === String(item.id))
  );
  const newItem: WatchHistoryItem = {
    ...item,
    timestamp: Date.now(),
  };
  saveWatchHistory([newItem, ...filtered]);
}

export function updateWatchProgress(
  id: string | number,
  kind: 'live' | 'vod' | 'series',
  pos: number,
  duration?: number,
  epIndex?: number
): void {
  const current = getWatchHistory();
  const idx = current.findIndex((x) => x.kind === kind && String(x.id) === String(id));
  if (idx >= 0) {
    current[idx].pos = pos;
    if (duration) current[idx].duration = duration;
    if (epIndex !== undefined) current[idx].epIndex = epIndex;
    current[idx].timestamp = Date.now();
    saveWatchHistory(current);
  }
}

export function getAdultState(): { showAdult: boolean; pin: string | null } {
  return {
    showAdult: localStorage.getItem(STORAGE_SHOW_ADULT) === 'true',
    pin: localStorage.getItem(STORAGE_ADULT_PIN),
  };
}

export function setAdultState(show: boolean, pin?: string): void {
  localStorage.setItem(STORAGE_SHOW_ADULT, show ? 'true' : 'false');
  if (pin !== undefined) {
    if (pin === '') {
      localStorage.removeItem(STORAGE_ADULT_PIN);
    } else {
      localStorage.setItem(STORAGE_ADULT_PIN, pin);
    }
  }
}

export function formatExpDate(expTimestamp: string | number | undefined): string {
  if (!expTimestamp || expTimestamp === 'null') return 'ไม่มีวันหมดอายุ (Lifetime)';
  const num = typeof expTimestamp === 'string' ? parseInt(expTimestamp, 10) : expTimestamp;
  if (isNaN(num) || num <= 0) return 'ไม่มีวันหมดอายุ';
  const date = new Date(num * 1000);
  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
