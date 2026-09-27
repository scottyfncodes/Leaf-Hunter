import { describe, expect, it } from 'vitest';
import { COLORADO } from './regions/colorado';
import { buildDemoReports } from './demoReports';
import { ELEVATION_BANDS } from '@/domain/forecast';

describe('Colorado dataset', () => {
  it('has unique ids and sane coordinates', () => {
    const ids = new Set(COLORADO.locations.map((l) => l.id));
    expect(ids.size).toBe(COLORADO.locations.length);
    for (const l of COLORADO.locations) {
      expect(l.latitude).toBeGreaterThan(36.9);
      expect(l.latitude).toBeLessThan(41.1);
      expect(l.longitude).toBeGreaterThan(-109.1);
      expect(l.longitude).toBeLessThan(-102);
      expect(l.elevationFt).toBeGreaterThan(4000);
      expect(l.activities.length).toBeGreaterThan(0);
      expect(l.whyGo.length).toBeGreaterThan(0);
      expect(l.visitMinutes).toBeGreaterThan(0);
    }
  });
  it('includes a mix of location kinds', () => {
    const kinds = new Set(COLORADO.locations.map((l) => l.kind));
    for (const k of ['pass', 'grove', 'drive', 'hike', 'foothills', 'town'].filter((k) => k !== 'foothills')) expect(kinds.has(k as never)).toBe(true);
    expect(COLORADO.locations.some((l) => l.area.toLowerCase().includes('foothills'))).toBe(true);
  });
  it('has locations in every elevation band', () => {
    for (const b of ELEVATION_BANDS) {
      expect(COLORADO.locations.some((l) => l.elevationFt >= b.minFt && l.elevationFt < b.maxFt)).toBe(true);
    }
  });
});

describe('demo reports', () => {
  it('are deterministic, labelled demo, and consistent with the model', () => {
    const now = new Date(2026, 8, 27, 12);
    const a = buildDemoReports(COLORADO.locations, now);
    const b = buildDemoReports(COLORADO.locations, now);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(10);
    for (const r of a) {
      expect(r.source).toBe('demo');
      expect(r.colorPercent).toBeGreaterThanOrEqual(0);
      expect(r.colorPercent).toBeLessThanOrEqual(100);
      expect(new Date(r.observedAt).getTime()).toBeLessThanOrEqual(now.getTime());
    }
  });
  it('produces no demo reports in mid-summer', () => {
    expect(buildDemoReports(COLORADO.locations, new Date(2026, 5, 15, 12))).toHaveLength(0);
  });
});
