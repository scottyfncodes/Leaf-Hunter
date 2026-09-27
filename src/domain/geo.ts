import type { LatLng } from './types';

const EARTH_RADIUS_MI = 3958.8;

export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const la1 = toRad(a.latitude);
  const la2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Rough drive-time estimate for mountain roads: straight-line distance with a
 * winding factor at ~44 mph average, plus a few minutes to get out of town.
 * This is deliberately approximate.
 */
export function estimateDriveMinutes(miles: number): number {
  if (miles < 3) return 10;
  const roadMiles = miles * 1.35;
  return Math.round(roadMiles / 44 * 60 + 8);
}

export function formatMiles(miles: number): string {
  if (miles < 10) return `${miles.toFixed(0)} mi`;
  return `${Math.round(miles)} mi`;
}

export function formatDrive(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m < 8) return `${h} hr`;
  if (m > 52) return `${h + 1} hr`;
  return `${h} hr ${m} min`;
}

export function formatElevation(ft: number): string {
  return `${ft.toLocaleString('en-US')} ft`;
}
