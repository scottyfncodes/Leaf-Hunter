import type { LocationView } from './filters';
import type { Activity, FoliageLocation, LatLng, StartPoint } from './types';
import { estimateDriveMinutes, haversineMiles } from './geo';

export type ChaseBudget = 'half' | 'full' | 'weekend';

export const CHASE_BUDGET_META: Record<ChaseBudget, { label: string; maxDriveMinutes: number; maxStops: number }> = {
  half: { label: 'Half a day', maxDriveMinutes: 240, maxStops: 2 },
  full: { label: '1 day', maxDriveMinutes: 480, maxStops: 4 },
  weekend: { label: 'A weekend', maxDriveMinutes: 900, maxStops: 5 },
};

export interface ChaseLeg {
  from: LatLng & { name: string };
  to: LocationView;
  driveMinutes: number;
  miles: number;
}

export interface ChasePlan {
  start: StartPoint;
  corridor: string;
  stops: LocationView[];
  legs: ChaseLeg[];
  returnMinutes: number;
  totalDriveMinutes: number;
  totalStopMinutes: number;
  /** Plain-language summary of why this route. */
  summary: string;
}

export interface ChaseInput {
  start: StartPoint;
  budget: ChaseBudget;
  activities: Activity[];
}

function colorScore(v: LocationView): number {
  const c = v.condition;
  if (c.status === 'peak') return 10;
  if (c.timing === 'peak-soon') return 7;
  if (c.status === 'turning') return 5;
  if (c.status === 'past' && c.timing === 'fading') return 2;
  return 1;
}

/** On a chase you keep stops short; long visits are trimmed to this. */
const MAX_CHASE_STOP_MINUTES = 90;

function stopMinutes(v: LocationView): number {
  return Math.min(MAX_CHASE_STOP_MINUTES, v.location.visitMinutes);
}

interface Itinerary {
  corridor: string;
  stops: LocationView[];
  legs: ChaseLeg[];
  returnMinutes: number;
  totalDrive: number;
  totalStop: number;
  score: number;
}

/**
 * Build a lightweight foliage road trip: for each road corridor, chain its
 * best-colored stops outward from the start, trim to the time budget, and
 * keep the itinerary that delivers the most color in the time available.
 */
export function planChase(views: LocationView[], input: ChaseInput): ChasePlan | null {
  const meta = CHASE_BUDGET_META[input.budget];
  const start = input.start;

  // Recompute distances from the chosen start (views may be relative to a different origin).
  const relative = views.map((v) => {
    const miles = haversineMiles(start, v.location);
    return { ...v, miles, driveMinutes: estimateDriveMinutes(miles) };
  });

  const candidates = relative.filter((v) => v.driveMinutes * 2 + stopMinutes(v) <= meta.maxDriveMinutes);
  if (!candidates.length) return null;

  const byCorridor = new Map<string, typeof candidates>();
  for (const v of candidates) {
    const list = byCorridor.get(v.location.corridor) ?? [];
    list.push(v);
    byCorridor.set(v.location.corridor, list);
  }

  const prefScore = (v: LocationView) =>
    input.activities.length ? input.activities.filter((a) => v.location.activities.includes(a)).length * 2 : 0;

  let best: Itinerary | null = null;
  for (const [corridor, list] of byCorridor) {
    const ranked = [...list].sort((a, b) => colorScore(b) + prefScore(b) - (colorScore(a) + prefScore(a)) || a.driveMinutes - b.driveMinutes);
    const picked = ranked.slice(0, meta.maxStops);
    const it = buildItinerary(corridor, start, orderStops(start, picked), meta.maxDriveMinutes);
    if (!it) continue;
    it.score = it.stops.reduce((sum, v) => sum + colorScore(v) + prefScore(v), 0) + (it.stops.length - 1) * 2 - it.totalDrive / 240;
    if (!best || it.score > best.score) best = it;
  }
  if (!best) return null;

  const peakCount = best.stops.filter((s) => s.condition.status === 'peak').length;
  const label = corridorLabel(best.corridor);
  const summary =
    best.stops.length === 1
      ? peakCount
        ? `${best.stops[0]!.location.name} is estimated at peak. Nothing else along ${label} fits the time, so make it a long stop.`
        : `${best.stops[0]!.location.name} is the strongest color that fits the time along ${label}.`
      : peakCount > 0
        ? `${peakCount} of ${best.stops.length} stops are estimated at peak along the ${label} corridor.`
        : `Color is building along the ${label} corridor — expect turning groves rather than full peak.`;

  return {
    start,
    corridor: best.corridor,
    stops: best.stops,
    legs: best.legs,
    returnMinutes: best.returnMinutes,
    totalDriveMinutes: best.totalDrive,
    totalStopMinutes: best.totalStop,
    summary,
  };
}

function buildItinerary(corridor: string, start: StartPoint, ordered: LocationView[], maxMinutes: number): Itinerary | null {
  const legs: ChaseLeg[] = [];
  let cursor: LatLng & { name: string } = { ...start };
  let totalDrive = 0;
  let totalStop = 0;
  const stops: LocationView[] = [];
  for (const stop of ordered) {
    const miles = haversineMiles(cursor, stop.location);
    const drive = estimateDriveMinutes(miles);
    const back = estimateDriveMinutes(haversineMiles(stop.location, start));
    const visit = stopMinutes(stop);
    if (stops.length > 0 && totalDrive + drive + back + totalStop + visit > maxMinutes) continue;
    legs.push({ from: cursor, to: stop, driveMinutes: drive, miles });
    totalDrive += drive;
    totalStop += visit;
    stops.push(stop);
    cursor = { name: stop.location.name, latitude: stop.location.latitude, longitude: stop.location.longitude };
  }
  if (!stops.length) return null;
  const last = stops[stops.length - 1]!;
  const returnMinutes = estimateDriveMinutes(haversineMiles(last.location, start));
  return { corridor, stops, legs, returnMinutes, totalDrive: totalDrive + returnMinutes, totalStop, score: 0 };
}

function orderStops<T extends { location: FoliageLocation }>(start: LatLng, stops: T[]): T[] {
  const remaining = [...stops];
  const out: T[] = [];
  let cursor: LatLng = start;
  while (remaining.length) {
    let bestIdx = 0;
    let bestD = Infinity;
    remaining.forEach((s, i) => {
      const d = haversineMiles(cursor, s.location);
      if (d < bestD) {
        bestD = d;
        bestIdx = i;
      }
    });
    const [next] = remaining.splice(bestIdx, 1);
    if (next) {
      out.push(next);
      cursor = next.location;
    }
  }
  return out;
}

export const CORRIDOR_LABELS: Record<string, string> = {
  'us-285': 'US 285 / South Park',
  'i-70': 'I-70 / Summit County',
  'peak-to-peak': 'Peak to Peak',
  'rmnp': 'Rocky Mountain National Park',
  'guanella': 'Guanella Pass',
  'mt-blue-sky': 'Mount Blue Sky',
  'aspen': 'Aspen / Roaring Fork',
  'gunnison': 'Crested Butte / Gunnison',
  'san-juans': 'San Juan Skyway',
  'grand-mesa': 'Grand Mesa',
  'pikes-peak': 'Pikes Peak region',
  'foothills': 'Front Range foothills',
  'steamboat': 'Steamboat / Rabbit Ears',
  'poudre': 'Poudre Canyon',
  'south': 'Southern Colorado',
  'buena-vista': 'Buena Vista / Arkansas Valley',
};

export function corridorLabel(id: string): string {
  return CORRIDOR_LABELS[id] ?? id;
}

/** Build maps deep links. Google Maps directions URLs open the app on iOS/Android or the web elsewhere. */
export function googleMapsDirectionsUrl(start: LatLng, stops: LatLng[]): string {
  const fmt = (p: LatLng) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
  const dest = stops[stops.length - 1];
  if (!dest) return `https://www.google.com/maps/search/?api=1&query=${fmt(start)}`;
  const waypoints = stops.slice(0, -1).map(fmt).join('|');
  const params = new URLSearchParams({ api: '1', origin: fmt(start), destination: fmt(dest), travelmode: 'driving' });
  if (waypoints) params.set('waypoints', waypoints);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function appleMapsDirectionsUrl(start: LatLng, dest: LatLng, name?: string): string {
  const fmt = (p: LatLng) => `${p.latitude.toFixed(5)},${p.longitude.toFixed(5)}`;
  const params = new URLSearchParams({ saddr: fmt(start), daddr: fmt(dest), dirflg: 'd' });
  if (name) params.set('q', name);
  return `https://maps.apple.com/?${params.toString()}`;
}

export function mapsSearchUrl(point: LatLng, name: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}&query_place_id=&center=${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`;
}
