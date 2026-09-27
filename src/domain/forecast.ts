import type { Condition } from './foliage';
import { STATUS_ORDER, deriveCondition } from './foliage';
import type { FoliageLocation, FoliageReport, FoliageStatus } from './types';
import { addDays } from './dates';

/**
 * THE COLOR WAVE
 *
 * Fall color in Colorado moves downhill: high elevations turn first, then
 * mountain passes and valleys, then the foothills, and finally the Front Range
 * cottonwoods. We summarize the dataset into elevation bands, now and in a
 * week, using the same deterministic model as the rest of the app.
 */

export interface ElevationBand {
  id: string;
  label: string;
  /** e.g. "Above 10,500 ft" */
  range: string;
  minFt: number;
  maxFt: number;
}

export const ELEVATION_BANDS: ElevationBand[] = [
  { id: 'alpine', label: 'High elevations', range: 'Above 10,500 ft', minFt: 10_500, maxFt: Infinity },
  { id: 'passes', label: 'Mountain passes', range: '9,500–10,500 ft', minFt: 9_500, maxFt: 10_500 },
  { id: 'valleys', label: 'Mountain towns & valleys', range: '8,000–9,500 ft', minFt: 8_000, maxFt: 9_500 },
  { id: 'foothills', label: 'Foothills', range: '6,000–8,000 ft', minFt: 6_000, maxFt: 8_000 },
  { id: 'front-range', label: 'Front Range & plains', range: 'Below 6,000 ft', minFt: -Infinity, maxFt: 6_000 },
];

export interface BandSnapshot {
  band: ElevationBand;
  status: FoliageStatus;
  averagePercent: number;
  count: number;
  /** Count by status for the band. */
  counts: Record<FoliageStatus, number>;
}

export interface WaveSnapshot {
  date: Date;
  bands: BandSnapshot[];
}

export interface ColorWave {
  now: WaveSnapshot;
  next: WaveSnapshot;
  /** Plain-language headline for the movement. */
  movement: string;
}

export function bandFor(elevationFt: number): ElevationBand {
  return ELEVATION_BANDS.find((b) => elevationFt >= b.minFt && elevationFt < b.maxFt) ?? ELEVATION_BANDS[ELEVATION_BANDS.length - 1]!;
}

function dominantStatus(conditions: Condition[]): { status: FoliageStatus; counts: Record<FoliageStatus, number> } {
  const counts: Record<FoliageStatus, number> = { early: 0, turning: 0, peak: 0, past: 0 };
  for (const c of conditions) counts[c.status] += 1;
  if (!conditions.length) return { status: 'early', counts };
  // Use the median position along the status order so one outlier doesn't flip a band.
  const ordered = conditions.map((c) => STATUS_ORDER.indexOf(c.status)).sort((a, b) => a - b);
  const mid = ordered[Math.floor(ordered.length / 2)] ?? 0;
  return { status: STATUS_ORDER[mid] ?? 'early', counts };
}

export function snapshotAt(locations: FoliageLocation[], reports: FoliageReport[], date: Date): WaveSnapshot {
  const conditions = locations.map((l) => deriveCondition(l, reports, date));
  const bands = ELEVATION_BANDS.map((band) => {
    const inBand = conditions.filter((_c, i) => {
      const loc = locations[i]!;
      return loc.elevationFt >= band.minFt && loc.elevationFt < band.maxFt;
    });
    const { status, counts } = dominantStatus(inBand);
    const averagePercent = inBand.length ? Math.round(inBand.reduce((s, c) => s + c.colorPercent, 0) / inBand.length) : 0;
    return { band, status, averagePercent, count: inBand.length, counts };
  });
  return { date, bands };
}

export function colorWave(locations: FoliageLocation[], reports: FoliageReport[], now: Date): ColorWave {
  const current = snapshotAt(locations, reports, now);
  // Reports only inform the present; the week-ahead view uses typical timing.
  const next = snapshotAt(locations, [], addDays(now, 7));
  return { now: current, next, movement: describeMovement(current, next) };
}

function describeMovement(now: WaveSnapshot, next: WaveSnapshot): string {
  const changes: string[] = [];
  now.bands.forEach((b, i) => {
    const n = next.bands[i];
    if (!n || !b.count) return;
    if (b.status !== n.status) {
      changes.push(`${b.band.label.toLowerCase()} move from ${b.status === 'past' ? 'past peak' : b.status} to ${n.status === 'past' ? 'past peak' : n.status}`);
    }
  });
  if (!changes.length) {
    const peakBands = now.bands.filter((b) => b.status === 'peak' && b.count);
    if (peakBands.length) return `Expected to hold: ${peakBands.map((b) => b.band.label.toLowerCase()).join(' and ')} stay near peak through the week.`;
    return 'Expected to hold steady over the next week, based on typical timing.';
  }
  const first = changes[0]!;
  const sentence = first.charAt(0).toUpperCase() + first.slice(1);
  return changes.length === 1 ? `Expected: ${sentence}.` : `Expected: ${sentence}; ${changes.slice(1).join('; ')}.`;
}
