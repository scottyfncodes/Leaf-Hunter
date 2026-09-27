import { describe, expect, it } from 'vitest';
import { LocalFavoriteStore, LocalKeyValueStore, LocalReportStore, newId } from '../local';
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
