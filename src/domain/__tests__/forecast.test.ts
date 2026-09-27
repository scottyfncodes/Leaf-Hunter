import { describe, expect, it } from 'vitest';
import { ELEVATION_BANDS, bandFor, colorWave, snapshotAt } from '../forecast';
import { STATUS_ORDER } from '../foliage';
import { COLORADO } from '@/data/regions/colorado';

const d = (m: number, day: number) => new Date(2026, m - 1, day, 12);

describe('color wave', () => {
  it('assigns elevation bands', () => {
    expect(bandFor(12000).id).toBe('alpine');
    expect(bandFor(10000).id).toBe('passes');
    expect(bandFor(8500).id).toBe('valleys');
    expect(bandFor(7000).id).toBe('foothills');
    expect(bandFor(5500).id).toBe('front-range');
  });
  it('covers every band with at least one seeded location', () => {
    const snap = snapshotAt(COLORADO.locations, [], d(9, 27));
    for (const b of snap.bands) expect(b.count).toBeGreaterThan(0);
    expect(snap.bands).toHaveLength(ELEVATION_BANDS.length);
  });
  it('moves downhill: higher bands are at or beyond lower bands', () => {
    const snap = snapshotAt(COLORADO.locations, [], d(9, 27));
    const idx = snap.bands.map((b) => STATUS_ORDER.indexOf(b.status));
    for (let i = 1; i < idx.length; i++) expect(idx[i - 1]!).toBeGreaterThanOrEqual(idx[i]!);
  });
  it('projects a week ahead and describes the movement', () => {
    const wave = colorWave(COLORADO.locations, [], d(9, 20));
    expect(wave.next.date.getTime()).toBeGreaterThan(wave.now.date.getTime());
    expect(wave.movement).toMatch(/Expected/);
    const nowTotal = wave.now.bands.reduce((s, b) => s + b.averagePercent, 0);
    const nextTotal = wave.next.bands.reduce((s, b) => s + b.averagePercent, 0);
    expect(nextTotal).toBeGreaterThan(nowTotal);
  });
  it('is all green in summer', () => {
    const snap = snapshotAt(COLORADO.locations, [], d(7, 1));
    expect(snap.bands.every((b) => b.status === 'early')).toBe(true);
  });
});
