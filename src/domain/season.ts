import type { Condition } from './foliage';
import type { Region } from './types';
import { daysBetween, monthDayForSeason, startOfDay } from './dates';

export type SeasonPhase = 'offseason' | 'preseason' | 'active' | 'postseason';

export interface SeasonState {
  phase: SeasonPhase;
  /** Days until season start (preseason/offseason), or since season end (postseason). */
  days: number;
  seasonStart: Date;
  seasonEnd: Date;
}

/** Where today falls relative to the region's foliage season. */
export function seasonState(region: Region, now: Date): SeasonState {
  const today = startOfDay(now);
  const pre = startOfDay(monthDayForSeason(region.season.preseasonStart, today));
  const start = startOfDay(monthDayForSeason(region.season.seasonStart, today));
  const end = startOfDay(monthDayForSeason(region.season.seasonEnd, today));

  if (today < pre) return { phase: 'offseason', days: daysBetween(today, start), seasonStart: start, seasonEnd: end };
  if (today < start) return { phase: 'preseason', days: daysBetween(today, start), seasonStart: start, seasonEnd: end };
  if (today <= end) return { phase: 'active', days: daysBetween(today, end), seasonStart: start, seasonEnd: end };
  const daysSince = daysBetween(end, today);
  if (daysSince <= 45) return { phase: 'postseason', days: daysSince, seasonStart: start, seasonEnd: end };
  // Deep winter/spring: count down to next year's season.
  const nextStart = startOfDay(monthDayForSeason(region.season.seasonStart, new Date(today.getFullYear() + 1, 0, 15)));
  return { phase: 'offseason', days: daysBetween(today, nextStart), seasonStart: nextStart, seasonEnd: end };
}

export interface Headline {
  /** Uppercase, short, with a leading glyph. */
  title: string;
  glyph: string;
  /** One sentence of context. */
  detail: string;
  tone: 'green' | 'gold' | 'ember' | 'rust' | 'neutral';
}

export interface DatasetStats {
  total: number;
  early: number;
  turning: number;
  peak: number;
  past: number;
  peakSoon: number;
}

export function datasetStats(conditions: Condition[]): DatasetStats {
  const s: DatasetStats = { total: conditions.length, early: 0, turning: 0, peak: 0, past: 0, peakSoon: 0 };
  for (const c of conditions) {
    s[c.status] += 1;
    if (c.timing === 'peak-soon') s.peakSoon += 1;
  }
  return s;
}

/** Generate the home-screen headline from the dataset, never hardcoded. */
export function headlineFor(season: SeasonState, stats: DatasetStats): Headline {
  if (season.phase === 'offseason') {
    return {
      glyph: '🌲',
      title: 'THE LEAVES ARE RESTING',
      detail:
        season.days > 0
          ? `Colorado's color typically starts moving in about ${Math.round(season.days / 7)} weeks. Build your watchlist now.`
          : 'The season has wrapped. Build your watchlist for next fall.',
      tone: 'neutral',
    };
  }
  if (season.phase === 'preseason') {
    return {
      glyph: '🌿',
      title: 'COLOR IS COMING',
      detail: `Still mostly green. High country typically starts turning in about ${season.days} day${season.days === 1 ? '' : 's'}.`,
      tone: 'green',
    };
  }
  if (season.phase === 'postseason') {
    return {
      glyph: '🍁',
      title: 'THE SEASON HAS PASSED',
      detail: 'Most aspens are bare. A few low valleys and cottonwood corridors may still hold color.',
      tone: 'rust',
    };
  }

  const { total, peak, turning, past, peakSoon } = stats;
  if (total === 0) return { glyph: '🍂', title: 'NO SPOTS LOADED', detail: 'Add a region to get started.', tone: 'neutral' };

  const peakShare = peak / total;
  const pastShare = past / total;

  if (peakShare >= 0.3) {
    return {
      glyph: '🔥',
      title: 'PEAK COLOR IS HAPPENING',
      detail: `${peak} of ${total} tracked spots are estimated at peak. This is the weekend.`,
      tone: 'ember',
    };
  }
  if (pastShare >= 0.5) {
    return {
      glyph: '🍁',
      title: 'COLOR IS FADING',
      detail: `Most high spots are past peak. Lower elevations are where the color is now.`,
      tone: 'rust',
    };
  }
  if (peak > 0 || peakSoon >= 3) {
    return {
      glyph: '🍂',
      title: 'PEAK IN SIGHT',
      detail: `${peak} spot${peak === 1 ? '' : 's'} at peak and ${peakSoon} more expected within about ten days.`,
      tone: 'gold',
    };
  }
  if (turning > 0) {
    return {
      glyph: '🍂',
      title: 'COLOR IS MOVING',
      detail: `${turning} spot${turning === 1 ? '' : 's'} are turning. High elevations lead the way.`,
      tone: 'gold',
    };
  }
  return {
    glyph: '🌿',
    title: 'STILL MOSTLY GREEN',
    detail: 'Aspens are holding. Check back as September cools off.',
    tone: 'green',
  };
}
