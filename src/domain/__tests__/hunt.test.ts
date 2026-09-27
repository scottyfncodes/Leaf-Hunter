import { describe, expect, it } from 'vitest';
import { hunt, TIME_BUDGET_META, listify } from '../hunt';
import { planChase, googleMapsDirectionsUrl, appleMapsDirectionsUrl } from '../chase';
import { deriveCondition } from '../foliage';
import type { LocationView } from '../filters';
import { COLORADO } from '@/data/regions/colorado';
import { estimateDriveMinutes, haversineMiles } from '../geo';

const now = new Date(2026, 8, 27, 12);
const views: LocationView[] = COLORADO.locations.map((location) => {
  const miles = haversineMiles(COLORADO.defaultStart, location);
  return { location, condition: deriveCondition(location, [], now), miles, driveMinutes: estimateDriveMinutes(miles) };
});

describe('hunt', () => {
  it('respects the time budget', () => {
    for (const budget of ['2h', 'half', 'full'] as const) {
      const out = hunt(views, { budget, activities: [], now });
      expect(out.length).toBeGreaterThan(0);
      expect(out.every((m) => m.view.driveMinutes <= TIME_BUDGET_META[budget].maxOneWayMinutes)).toBe(true);
    }
  });
  it('returns a small set with reasons', () => {
    const out = hunt(views, { budget: 'full', activities: [], now });
    expect(out.length).toBeLessThanOrEqual(5);
    for (const m of out) expect(m.reasons.length).toBeGreaterThanOrEqual(2);
  });
  it('prefers full activity matches and explains them', () => {
    const out = hunt(views, { budget: 'full', activities: ['hike', 'dog'], now });
    expect(out.every((m) => m.view.location.activities.includes('hike') && m.view.location.activities.includes('dog'))).toBe(true);
    expect(out[0]?.reasons.some((r) => r.toLowerCase().includes('hiking'))).toBe(true);
  });
  it('mentions the time fit in plain language', () => {
    const out = hunt(views, { budget: '2h', activities: [], now });
    expect(out[0]?.reasons.some((r) => r.includes('Fits your 2-hour window'))).toBe(true);
  });
  it('lets a weekend reach far away spots', () => {
    const out = hunt(views, { budget: 'weekend', activities: ['drive'], now, limit: 40 });
    expect(out.some((m) => m.view.driveMinutes > 240)).toBe(true);
  });
});

describe('planChase', () => {
  it('builds a route from Denver within a day', () => {
    const plan = planChase(views, { start: COLORADO.defaultStart, budget: 'full', activities: [] });
    expect(plan).not.toBeNull();
    expect(plan!.stops.length).toBeGreaterThanOrEqual(1);
    expect(plan!.legs).toHaveLength(plan!.stops.length);
    expect(plan!.totalDriveMinutes + plan!.totalStopMinutes).toBeLessThanOrEqual(480 + 60);
    // All stops share the chosen corridor.
    expect(plan!.stops.every((s) => s.location.corridor === plan!.corridor)).toBe(true);
  });
  it('chains several stops on a full day from Denver', () => {
    const plan = planChase(views, { start: COLORADO.defaultStart, budget: 'full', activities: [] });
    expect(plan!.stops.length).toBeGreaterThanOrEqual(2);
  });
  it('keeps half-day plans short', () => {
    const plan = planChase(views, { start: COLORADO.defaultStart, budget: 'half', activities: [] });
    expect(plan).not.toBeNull();
    expect(plan!.stops.length).toBeLessThanOrEqual(2);
    expect(plan!.totalDriveMinutes).toBeLessThanOrEqual(240);
  });
  it('recomputes from a different start point', () => {
    const durango = COLORADO.startPoints.find((s) => s.id === 'durango')!;
    const plan = planChase(views, { start: durango, budget: 'half', activities: [] });
    expect(plan).not.toBeNull();
    expect(plan!.legs[0]!.from.name).toBe('Durango');
    expect(['san-juans', 'south']).toContain(plan!.corridor);
  });
  it('builds maps links', () => {
    const start = COLORADO.defaultStart;
    const stops = views.slice(0, 2).map((v) => v.location);
    const g = googleMapsDirectionsUrl(start, stops);
    expect(g).toContain('https://www.google.com/maps/dir/?');
    expect(g).toContain('origin=39.73920');
    expect(g).toContain('waypoints=');
    const a = appleMapsDirectionsUrl(start, stops[0]!, 'Test');
    expect(a).toContain('https://maps.apple.com/?');
    expect(a).toContain('daddr=');
  });
});

describe('listify', () => {
  it('joins with commas and "and"', () => {
    expect(listify([])).toBe('');
    expect(listify(['a'])).toBe('a');
    expect(listify(['a', 'b'])).toBe('a and b');
    expect(listify(['a', 'b', 'c'])).toBe('a, b, and c');
  });
});
