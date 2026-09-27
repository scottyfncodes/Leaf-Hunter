import type { RegionMap } from '@/domain/types';

export const MAP_W = 1000;

export interface Projection {
  width: number;
  height: number;
  toXY: (lng: number, lat: number) => [number, number];
}

/**
 * Simple equirectangular projection scaled by the cosine of the mid-latitude
 * so Colorado keeps roughly correct proportions. Good enough for a stylized
 * state-scale map.
 */
export function createProjection(map: RegionMap): Projection {
  const { west, east, south, north } = map.bounds;
  const midLat = ((south + north) / 2) * (Math.PI / 180);
  const lngSpan = east - west;
  const latSpan = north - south;
  const height = (MAP_W * latSpan) / (lngSpan * Math.cos(midLat));
  return {
    width: MAP_W,
    height,
    toXY: (lng, lat) => [((lng - west) / lngSpan) * MAP_W, ((north - lat) / latSpan) * height],
  };
}

export function pathFrom(points: [number, number][], proj: Projection, close = false): string {
  const d = points
    .map(([lng, lat], i) => {
      const [x, y] = proj.toXY(lng, lat);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return close ? `${d} Z` : d;
}

/** Smooth a polygon into a soft blob using quadratic curves through midpoints. */
export function blobPath(points: [number, number][], proj: Projection): string {
  const pts = points.map(([lng, lat]) => proj.toXY(lng, lat));
  if (pts.length < 3) return pathFrom(points, proj, true);
  const mid = (a: [number, number], b: [number, number]): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  let d = `M${mid(last, first).map((v) => v.toFixed(1)).join(' ')}`;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!;
    const n = pts[(i + 1) % pts.length]!;
    const m = mid(p, n);
    d += ` Q${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return `${d} Z`;
}
