import type { Condition } from './foliage';
import type { Activity, FoliageLocation, FoliageStatus } from './types';

export type DistanceFilter = 'nearby' | '1h' | '2h' | '3h' | 'any';
export type TimingFilter = 'peak-now' | 'peak-soon' | 'later';

export interface Filters {
  statuses: FoliageStatus[];
  activities: Activity[];
  distance: DistanceFilter;
  timing: TimingFilter[];
}

export const EMPTY_FILTERS: Filters = { statuses: [], activities: [], distance: 'any', timing: [] };

export const DISTANCE_MAX_MINUTES: Record<DistanceFilter, number> = {
  nearby: 45,
  '1h': 60,
  '2h': 120,
  '3h': 180,
  any: Infinity,
};

export const DISTANCE_LABEL: Record<DistanceFilter, string> = {
  nearby: 'Nearby',
  '1h': 'Under 1 hr',
  '2h': 'Under 2 hr',
  '3h': 'Under 3 hr',
  any: 'Any distance',
};

export const TIMING_FILTER_LABEL: Record<TimingFilter, string> = {
  'peak-now': 'Peak now',
  'peak-soon': 'Peak soon',
  later: 'Later',
};

export const ACTIVITY_META: Record<Activity, { label: string; glyph: string }> = {
  drive: { label: 'Scenic drive', glyph: '🚗' },
  hike: { label: 'Hiking', glyph: '🥾' },
  photo: { label: 'Photography', glyph: '📸' },
  dog: { label: 'Dog-friendly', glyph: '🐕' },
  accessible: { label: 'Accessible', glyph: '♿' },
  sunrise: { label: 'Sunrise', glyph: '🌅' },
  sunset: { label: 'Sunset', glyph: '🌄' },
};

export interface LocationView {
  location: FoliageLocation;
  condition: Condition;
  miles: number;
  driveMinutes: number;
}

export function isFilterActive(f: Filters): boolean {
  return f.statuses.length > 0 || f.activities.length > 0 || f.distance !== 'any' || f.timing.length > 0;
}

export function activeFilterCount(f: Filters): number {
  return f.statuses.length + f.activities.length + (f.distance !== 'any' ? 1 : 0) + f.timing.length;
}

export function matchesFilters(view: LocationView, f: Filters): boolean {
  if (f.statuses.length && !f.statuses.includes(view.condition.status)) return false;
  if (f.activities.length && !f.activities.every((a) => view.location.activities.includes(a))) return false;
  if (view.driveMinutes > DISTANCE_MAX_MINUTES[f.distance]) return false;
  if (f.timing.length) {
    const t = view.condition.timing;
    const ok = f.timing.some((want) => {
      if (want === 'peak-now') return t === 'peak-now';
      if (want === 'peak-soon') return t === 'peak-soon';
      return t === 'later';
    });
    if (!ok) return false;
  }
  return true;
}

export function applyFilters(views: LocationView[], f: Filters): LocationView[] {
  return views.filter((v) => matchesFilters(v, f));
}

export function toggleInList<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

/**
 * Default ordering for Explore: what's worth going to, nearest first within
 * a status tier. Peak > turning > early > past.
 */
const TIER: Record<FoliageStatus, number> = { peak: 0, turning: 1, early: 2, past: 3 };

export function sortForExplore(views: LocationView[]): LocationView[] {
  return [...views].sort((a, b) => {
    const t = TIER[a.condition.status] - TIER[b.condition.status];
    if (t !== 0) return t;
    return a.driveMinutes - b.driveMinutes;
  });
}

export function sortByDistance(views: LocationView[]): LocationView[] {
  return [...views].sort((a, b) => a.driveMinutes - b.driveMinutes);
}
