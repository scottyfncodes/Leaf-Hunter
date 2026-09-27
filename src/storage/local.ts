import type { FoliageReport } from '@/domain/types';
import type { FavoriteSnapshot, FavoriteStore, KeyValueStore, ReportStore } from './store';

const PREFIX = 'leafhunter:';

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** localStorage may be unavailable (private mode, quota). Fall back to memory. */
class MemoryBackend implements Storage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

export function resolveStorage(): Storage {
  try {
    const s = globalThis.localStorage;
    const probe = `${PREFIX}probe`;
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return new MemoryBackend();
  }
}

export class LocalKeyValueStore implements KeyValueStore {
  constructor(private backend: Storage = resolveStorage()) {}
  get<T>(key: string): T | null {
    return safeParse<T>(this.backend.getItem(PREFIX + key));
  }
  set<T>(key: string, value: T): void {
    try {
      this.backend.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled: fail quietly, the UI stays usable.
    }
  }
  remove(key: string): void {
    this.backend.removeItem(PREFIX + key);
  }
}

const REPORTS_KEY = 'reports';
const FAVORITES_KEY = 'favorites';

export class LocalReportStore implements ReportStore {
  constructor(private kv: KeyValueStore = new LocalKeyValueStore()) {}
  list(): FoliageReport[] {
    const items = this.kv.get<FoliageReport[]>(REPORTS_KEY) ?? [];
    return Array.isArray(items) ? items : [];
  }
  add(report: FoliageReport): void {
    const items = this.list().filter((r) => r.id !== report.id);
    items.unshift({ ...report, source: 'local' });
    this.kv.set(REPORTS_KEY, items);
  }
  remove(id: string): void {
    this.kv.set(REPORTS_KEY, this.list().filter((r) => r.id !== id));
  }
  clear(): void {
    this.kv.remove(REPORTS_KEY);
  }
}

export class LocalFavoriteStore implements FavoriteStore {
  constructor(private kv: KeyValueStore = new LocalKeyValueStore()) {}
  list(): FavoriteSnapshot[] {
    const items = this.kv.get<FavoriteSnapshot[]>(FAVORITES_KEY) ?? [];
    return Array.isArray(items) ? items : [];
  }
  add(snapshot: FavoriteSnapshot): void {
    const items = this.list().filter((f) => f.locationId !== snapshot.locationId);
    items.push(snapshot);
    this.kv.set(FAVORITES_KEY, items);
  }
  remove(locationId: string): void {
    this.kv.set(FAVORITES_KEY, this.list().filter((f) => f.locationId !== locationId));
  }
  markSeen(locationId: string, percent: number, at: string): void {
    const items = this.list().map((f) => (f.locationId === locationId ? { ...f, lastSeenPercent: percent, lastSeenAt: at } : f));
    this.kv.set(FAVORITES_KEY, items);
  }
  clear(): void {
    this.kv.remove(FAVORITES_KEY);
  }
}

export function newId(prefix: string): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rand}`;
}
