import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { FoliageLocation, FoliageReport, LatLng, Region, StartPoint } from '@/domain/types';
import { deriveCondition, type Condition } from '@/domain/foliage';
import { estimateDriveMinutes, haversineMiles } from '@/domain/geo';
import type { LocationView } from '@/domain/filters';
import { seasonState, type SeasonState } from '@/domain/season';
import { DEFAULT_REGION_ID, getRegion } from '@/data/regions';
import { buildDemoReports } from '@/data/demoReports';
import { LocalFavoriteStore, LocalKeyValueStore, LocalReportStore } from '@/storage/local';
import type { FavoriteSnapshot, FavoriteStore, KeyValueStore, ReportStore } from '@/storage/store';

export type Origin = LatLng & { name: string; kind: 'home' | 'gps' };

export interface AppState {
  now: Date;
  region: Region;
  season: SeasonState;
  /** All reports: demo + local, newest first. */
  reports: FoliageReport[];
  localReports: FoliageReport[];
  addReport: (report: FoliageReport) => void;
  removeReport: (id: string) => void;
  clearLocalData: () => void;
  favorites: FavoriteSnapshot[];
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  markSeen: (id: string) => void;
  origin: Origin;
  setHomeBase: (start: StartPoint) => void;
  useMyLocation: () => Promise<boolean>;
  locating: boolean;
  locationError: string | null;
  views: LocationView[];
  viewFor: (id: string) => LocationView | undefined;
  conditionFor: (id: string) => Condition | undefined;
  locationById: (id: string) => FoliageLocation | undefined;
  /** True when the app is showing demo reports (no backend). */
  demoMode: boolean;
}

const Ctx = createContext<AppState | null>(null);

interface Stores {
  reports: ReportStore;
  favorites: FavoriteStore;
  kv: KeyValueStore;
}

function defaultStores(): Stores {
  const kv = new LocalKeyValueStore();
  return { reports: new LocalReportStore(kv), favorites: new LocalFavoriteStore(kv), kv };
}

/**
 * Resolve "today". Supports a `?today=YYYY-MM-DD` query for previewing
 * preseason / postseason states without changing the system clock.
 */
export function resolveNow(search: string = typeof window !== 'undefined' ? window.location.search : ''): Date {
  const params = new URLSearchParams(search);
  const override = params.get('today');
  if (override && /^\d{4}-\d{2}-\d{2}$/.test(override)) {
    const [y, m, d] = override.split('-').map(Number);
    const date = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1, 10, 0, 0);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

const HOME_KEY = 'homeBase';

export function AppProvider({ children, stores = defaultStores(), initialNow }: { children: ReactNode; stores?: Stores; initialNow?: Date }) {
  const storesRef = useRef(stores);
  const [now, setNow] = useState<Date>(() => initialNow ?? resolveNow());
  const region = useMemo(() => getRegion(DEFAULT_REGION_ID), []);

  // Keep "now" fresh for long-lived installed sessions (once a minute is plenty).
  useEffect(() => {
    if (initialNow) return;
    const id = window.setInterval(() => setNow(resolveNow()), 60_000);
    return () => window.clearInterval(id);
  }, [initialNow]);

  const [localReports, setLocalReports] = useState<FoliageReport[]>(() => storesRef.current.reports.list());
  const [favorites, setFavorites] = useState<FavoriteSnapshot[]>(() => storesRef.current.favorites.list());

  const demoReports = useMemo(() => buildDemoReports(region.locations, now), [region, now]);
  const reports = useMemo(
    () => [...localReports, ...demoReports].sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()),
    [localReports, demoReports],
  );

  const [origin, setOrigin] = useState<Origin>(() => {
    const saved = storesRef.current.kv.get<StartPoint>(HOME_KEY);
    const start = saved ?? region.defaultStart;
    return { ...start, kind: 'home' };
  });
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const setHomeBase = useCallback((start: StartPoint) => {
    storesRef.current.kv.set(HOME_KEY, start);
    setOrigin({ ...start, kind: 'home' });
    setLocationError(null);
  }, []);

  const useMyLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationError('Location is not available on this device.');
      return false;
    }
    setLocating(true);
    setLocationError(null);
    return new Promise<boolean>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setOrigin({ name: 'My location', latitude: pos.coords.latitude, longitude: pos.coords.longitude, kind: 'gps' });
          setLocating(false);
          resolve(true);
        },
        () => {
          setLocationError('Could not get your location. Using your home base instead.');
          setLocating(false);
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
      );
    });
  }, []);

  const addReport = useCallback((report: FoliageReport) => {
    storesRef.current.reports.add(report);
    setLocalReports(storesRef.current.reports.list());
  }, []);

  const removeReport = useCallback((id: string) => {
    storesRef.current.reports.remove(id);
    setLocalReports(storesRef.current.reports.list());
  }, []);

  const clearLocalData = useCallback(() => {
    storesRef.current.reports.clear();
    storesRef.current.favorites.clear();
    storesRef.current.kv.remove(HOME_KEY);
    setLocalReports([]);
    setFavorites([]);
    setOrigin({ ...region.defaultStart, kind: 'home' });
  }, [region]);

  const views = useMemo<LocationView[]>(() => {
    return region.locations.map((location) => {
      const miles = haversineMiles(origin, location);
      return { location, condition: deriveCondition(location, reports, now), miles, driveMinutes: estimateDriveMinutes(miles) };
    });
  }, [region, origin, reports, now]);

  const viewIndex = useMemo(() => new Map(views.map((v) => [v.location.id, v])), [views]);

  const isFavorite = useCallback((id: string) => favorites.some((f) => f.locationId === id), [favorites]);

  const toggleFavorite = useCallback(
    (id: string) => {
      const store = storesRef.current.favorites;
      if (store.list().some((f) => f.locationId === id)) {
        store.remove(id);
      } else {
        const pct = viewIndex.get(id)?.condition.colorPercent ?? 0;
        const at = now.toISOString();
        store.add({ locationId: id, addedAt: at, lastSeenPercent: pct, lastSeenAt: at });
      }
      setFavorites(store.list());
    },
    [viewIndex, now],
  );

  const markSeen = useCallback(
    (id: string) => {
      const pct = viewIndex.get(id)?.condition.colorPercent;
      if (pct === undefined) return;
      storesRef.current.favorites.markSeen(id, pct, now.toISOString());
      setFavorites(storesRef.current.favorites.list());
    },
    [viewIndex, now],
  );

  const value = useMemo<AppState>(
    () => ({
      now,
      region,
      season: seasonState(region, now),
      reports,
      localReports,
      addReport,
      removeReport,
      clearLocalData,
      favorites,
      isFavorite,
      toggleFavorite,
      markSeen,
      origin,
      setHomeBase,
      useMyLocation,
      locating,
      locationError,
      views,
      viewFor: (id) => viewIndex.get(id),
      conditionFor: (id) => viewIndex.get(id)?.condition,
      locationById: (id) => viewIndex.get(id)?.location,
      demoMode: true,
    }),
    [now, region, reports, localReports, addReport, removeReport, clearLocalData, favorites, isFavorite, toggleFavorite, markSeen, origin, setHomeBase, useMyLocation, locating, locationError, views, viewIndex],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used inside AppProvider');
  return v;
}
