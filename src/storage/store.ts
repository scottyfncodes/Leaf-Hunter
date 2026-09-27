import type { FoliageReport } from '@/domain/types';

/**
 * Persistence interfaces.
 *
 * The app talks to these interfaces only. Today they are backed by
 * localStorage; a backend implementation can be swapped in without touching
 * any screen.
 */

export interface ReportStore {
  list(): FoliageReport[];
  add(report: FoliageReport): void;
  remove(id: string): void;
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
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
