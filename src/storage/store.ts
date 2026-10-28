import type { FoliageReport } from '@/domain/types';

/**
 * Outcome of a write. `ok` is true only when the value was written and read
 * back unchanged. Screens must not tell the user something was saved unless
 * they got `{ ok: true }`.
 */
export type SaveResult =
  | { ok: true }
  | { ok: false; reason: 'quota' | 'unavailable' | 'unverified' };

/**
 * Persistence interfaces.
 *
 * The app talks to these interfaces only. Today they are backed by
 * localStorage; a backend implementation can be swapped in without touching
 * any screen.
 */

export interface ReportStore {
  list(): FoliageReport[];
  add(report: FoliageReport): SaveResult;
  remove(id: string): SaveResult;
  clear(): void;
}

export interface FavoriteSnapshot {
  locationId: string;
  addedAt: string;
  /** Color percent when the user last looked at this spot on the watchlist. */
  lastSeenPercent: number;
  lastSeenAt: string;
}

export interface FavoriteStore {
  list(): FavoriteSnapshot[];
  add(snapshot: FavoriteSnapshot): void;
  remove(locationId: string): void;
  /** Update the "last seen" numbers used to show change since last visit. */
  markSeen(locationId: string, percent: number, at: string): void;
  clear(): void;
}

export interface KeyValueStore {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): SaveResult;
  remove(key: string): void;
}
