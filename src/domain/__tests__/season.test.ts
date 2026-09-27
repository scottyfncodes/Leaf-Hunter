import { describe, expect, it } from 'vitest';
import { datasetStats, headlineFor, seasonState } from '../season';
import { deriveCondition } from '../foliage';
import { COLORADO } from '@/data/regions/colorado';

const d = (m: number, day: number, y = 2026) => new Date(y, m - 1, day, 12);

describe('seasonState', () => {
  it('detects offseason, preseason, active and postseason', () => {
    expect(seasonState(COLORADO, d(6, 1)).phase).toBe('offseason');
    expect(seasonState(COLORADO, d(8, 20)).phase).toBe('preseason');
    expect(seasonState(COLORADO, d(9, 27)).phase).toBe('active');
    expect(seasonState(COLORADO, d(10, 31)).phase).toBe('active');
    expect(seasonState(COLORADO, d(11, 15)).phase).toBe('postseason');
    expect(seasonState(COLORADO, d(1, 15)).phase).toBe('offseason');
  });
  it('counts down to next season in the deep offseason', () => {
    const s = seasonState(COLORADO, d(1, 15));
    expect(s.days).toBeGreaterThan(200);
    expect(s.seasonStart.getFullYear()).toBe(2026);
  });
});

describe('headlineFor', () => {
  const conditionsAt = (date: Date) => COLORADO.locations.map((l) => deriveCondition(l, [], date));

  it('declares peak when a large share of spots are at peak', () => {
    const now = d(9, 27);
    const h = headlineFor(seasonState(COLORADO, now), datasetStats(conditionsAt(now)));
    expect(h.title).toBe('PEAK COLOR IS HAPPENING');
  });
  it('says color is moving early in the season', () => {
    const now = d(9, 8);
    const h = headlineFor(seasonState(COLORADO, now), datasetStats(conditionsAt(now)));
    expect(['COLOR IS MOVING', 'PEAK IN SIGHT']).toContain(h.title);
  });
  it('gives fading messaging late in the season', () => {
    const now = d(10, 20);
    const h = headlineFor(seasonState(COLORADO, now), datasetStats(conditionsAt(now)));
    expect(h.title).toBe('COLOR IS FADING');
  });
  it('never claims peak outside of the season', () => {
    for (const date of [d(6, 1), d(8, 20), d(11, 20), d(2, 1)]) {
      const h = headlineFor(seasonState(COLORADO, date), datasetStats(conditionsAt(date)));
      expect(h.title).not.toContain('PEAK');
    }
  });
});
