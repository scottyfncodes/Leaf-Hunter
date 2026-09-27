import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS, activeFilterCount, applyFilters, sortForExplore, toggleInList, type LocationView } from '../filters';
import { deriveCondition } from '../foliage';
import { COLORADO } from '@/data/regions/colorado';
import { estimateDriveMinutes, haversineMiles } from '../geo';

const now = new Date(2026, 8, 27, 12);
const views: LocationView[] = COLORADO.locations.map((location) => {
  const miles = haversineMiles(COLORADO.defaultStart, location);
  return { location, condition: deriveCondition(location, [], now), miles, driveMinutes: estimateDriveMinutes(miles) };
});

describe('applyFilters', () => {
  it('returns everything with empty filters', () => {
    expect(applyFilters(views, EMPTY_FILTERS)).toHaveLength(views.length);
  });
  it('filters by status', () => {
    const out = applyFilters(views, { ...EMPTY_FILTERS, statuses: ['peak'] });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((v) => v.condition.status === 'peak')).toBe(true);
  });
  it('requires all selected activities', () => {
    const out = applyFilters(views, { ...EMPTY_FILTERS, activities: ['dog', 'accessible'] });
    expect(out.every((v) => v.location.activities.includes('dog') && v.location.activities.includes('accessible'))).toBe(true);
  });
  it('filters by drive time', () => {
    const out = applyFilters(views, { ...EMPTY_FILTERS, distance: '1h' });
    expect(out.every((v) => v.driveMinutes <= 60)).toBe(true);
    expect(out.length).toBeLessThan(views.length);
  });
  it('filters by timing', () => {
    const out = applyFilters(views, { ...EMPTY_FILTERS, timing: ['peak-now'] });
    expect(out.every((v) => v.condition.timing === 'peak-now')).toBe(true);
  });
});

describe('helpers', () => {
  it('toggles list membership', () => {
    expect(toggleInList(['a'], 'a')).toEqual([]);
    expect(toggleInList(['a'], 'b')).toEqual(['a', 'b']);
  });
  it('counts active filters', () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount({ statuses: ['peak'], activities: ['dog'], distance: '2h', timing: [] })).toBe(3);
  });
  it('sorts peak spots first, nearest first within a tier', () => {
    const sorted = sortForExplore(views);
    const firstNonPeak = sorted.findIndex((v) => v.condition.status !== 'peak');
    expect(sorted.slice(0, firstNonPeak).every((v) => v.condition.status === 'peak')).toBe(true);
    for (let i = 1; i < firstNonPeak; i++) {
      expect(sorted[i]!.driveMinutes).toBeGreaterThanOrEqual(sorted[i - 1]!.driveMinutes);
    }
  });
});
