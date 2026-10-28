import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocalFavoriteStore, LocalKeyValueStore, LocalReportStore, isQuotaError, newId } from '../local';
import { requestPersistentStorage, resetPersistRequestForTests } from '../persist';
import type { FoliageReport } from '@/domain/types';

const report = (id: string): FoliageReport => ({
  id, locationId: 'kenosha-pass', observedAt: new Date().toISOString(), colorPercent: 70, status: 'peak', source: 'local', note: 'hi',
});

describe('LocalReportStore', () => {
  it('persists reports across instances', () => {
    const a = new LocalReportStore();
    a.add(report('r1'));
    const b = new LocalReportStore();
    expect(b.list()).toHaveLength(1);
    expect(b.list()[0]?.id).toBe('r1');
  });
  it('forces the local source and newest first', () => {
    const s = new LocalReportStore();
    s.add({ ...report('r1'), source: 'demo' });
    s.add(report('r2'));
    expect(s.list()[0]?.id).toBe('r2');
    expect(s.list().every((r) => r.source === 'local')).toBe(true);
  });
  it('removes and clears', () => {
    const s = new LocalReportStore();
    s.add(report('r1'));
    s.add(report('r2'));
    s.remove('r1');
    expect(s.list().map((r) => r.id)).toEqual(['r2']);
    s.clear();
    expect(s.list()).toEqual([]);
  });
  it('survives corrupt storage', () => {
    window.localStorage.setItem('leafhunter:reports', '{not json');
    expect(new LocalReportStore().list()).toEqual([]);
  });
});

describe('LocalFavoriteStore', () => {
  it('adds, dedupes, marks seen and removes', () => {
    const s = new LocalFavoriteStore();
    const at = new Date().toISOString();
    s.add({ locationId: 'a', addedAt: at, lastSeenPercent: 40, lastSeenAt: at });
    s.add({ locationId: 'a', addedAt: at, lastSeenPercent: 45, lastSeenAt: at });
    expect(s.list()).toHaveLength(1);
    s.markSeen('a', 78, at);
    expect(s.list()[0]?.lastSeenPercent).toBe(78);
    s.remove('a');
    expect(s.list()).toEqual([]);
  });
});

describe('LocalKeyValueStore', () => {
  it('round-trips values and returns null for missing keys', () => {
    const kv = new LocalKeyValueStore();
    kv.set('x', { a: 1 });
    expect(kv.get<{ a: number }>('x')).toEqual({ a: 1 });
    expect(kv.get('nope')).toBeNull();
    kv.remove('x');
    expect(kv.get('x')).toBeNull();
  });
});

describe('newId', () => {
  it('produces unique prefixed ids', () => {
    const a = newId('rep');
    const b = newId('rep');
    expect(a).not.toBe(b);
    expect(a.startsWith('rep-')).toBe(true);
  });
});

function quotaError(): DOMException {
  return new DOMException('The quota has been exceeded.', 'QuotaExceededError');
}

describe('save results', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reports ok only after the write reads back', () => {
    const s = new LocalReportStore();
    expect(s.add(report('r1'))).toEqual({ ok: true });
    expect(JSON.parse(window.localStorage.getItem('leafhunter:reports')!)[0].id).toBe('r1');
  });

  it('surfaces a quota error instead of swallowing it', () => {
    const s = new LocalReportStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quotaError();
    });
    expect(s.add(report('r1'))).toEqual({ ok: false, reason: 'quota' });
  });

  it('leaves existing reports untouched when a save fails', () => {
    const s = new LocalReportStore();
    s.add(report('r1'));
    s.add(report('r2'));
    const before = window.localStorage.getItem('leafhunter:reports');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quotaError();
    });
    expect(s.add({ ...report('r3'), photo: 'data:image/jpeg;base64,AAAA' }).ok).toBe(false);
    vi.restoreAllMocks();
    expect(window.localStorage.getItem('leafhunter:reports')).toBe(before);
    expect(new LocalReportStore().list().map((r) => r.id)).toEqual(['r2', 'r1']);
  });

  it('treats other write errors as unavailable', () => {
    const kv = new LocalKeyValueStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    expect(kv.set('x', 1)).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('flags a write that does not read back', () => {
    const kv = new LocalKeyValueStore();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    expect(kv.set('x', 1)).toEqual({ ok: false, reason: 'unverified' });
  });

  it('recognises quota errors across engines', () => {
    expect(isQuotaError(quotaError())).toBe(true);
    expect(isQuotaError({ name: 'NS_ERROR_DOM_QUOTA_REACHED' })).toBe(true);
    expect(isQuotaError({ code: 22 })).toBe(true);
    expect(isQuotaError(new Error('nope'))).toBe(false);
  });
});

describe('requestPersistentStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetPersistRequestForTests();
  });

  it('asks once, and skips the prompt when already persisted', async () => {
    const persist = vi.fn().mockResolvedValue(true);
    const persisted = vi.fn().mockResolvedValue(false);
    vi.stubGlobal('navigator', { storage: { persist, persisted } });
    expect(await requestPersistentStorage()).toBe(true);
    expect(await requestPersistentStorage()).toBe(false);
    expect(persist).toHaveBeenCalledTimes(1);

    resetPersistRequestForTests();
    persisted.mockResolvedValue(true);
    expect(await requestPersistentStorage()).toBe(true);
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('is a no-op without the Storage API', async () => {
    vi.stubGlobal('navigator', {});
    expect(await requestPersistentStorage()).toBe(false);
  });
});
