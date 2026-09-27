import type { FoliageLocation } from './types';

/** Lowercase, strip accents/punctuation, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(s: string): string[] {
  return normalize(s).split(' ').filter(Boolean);
}

/** Levenshtein distance, small strings only. */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min((prev[j] ?? 0) + 1, (cur[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    prev = cur;
  }
  return prev[b.length] ?? 0;
}

function tokenScore(queryToken: string, fieldTokens: string[]): number {
  let best = 0;
  for (const ft of fieldTokens) {
    if (ft === queryToken) best = Math.max(best, 1);
    else if (ft.startsWith(queryToken)) best = Math.max(best, 0.85);
    else if (queryToken.length >= 4 && ft.includes(queryToken)) best = Math.max(best, 0.6);
    else if (queryToken.length >= 4) {
      const d = editDistance(queryToken, ft.slice(0, queryToken.length + 1));
      if (d <= 1) best = Math.max(best, 0.55);
      else if (queryToken.length >= 6 && d <= 2) best = Max(best, 0.4);
    }
  }
  return best;
}

function Max(a: number, b: number): number {
  return a > b ? a : b;
}

export interface SearchHit<T> {
  item: T;
  score: number;
}

/**
 * Forgiving search over name, town, area and aliases. Every query token must
 * match somewhere; name matches weigh more than town/area matches.
 */
export function searchLocations(locations: FoliageLocation[], query: string): FoliageLocation[] {
  const q = tokens(query);
  if (!q.length) return locations;
  const hits: SearchHit<FoliageLocation>[] = [];
  for (const loc of locations) {
    const nameT = tokens(loc.name);
    const townT = tokens(loc.town);
    const areaT = tokens(loc.area);
    const aliasT = (loc.aliases ?? []).flatMap(tokens);
    let total = 0;
    let ok = true;
    for (const qt of q) {
      const s = Math.max(
        tokenScore(qt, nameT) * 1.0,
        tokenScore(qt, aliasT) * 0.9,
        tokenScore(qt, townT) * 0.8,
        tokenScore(qt, areaT) * 0.7,
      );
      if (s === 0) {
        ok = false;
        break;
      }
      total += s;
    }
    if (ok) hits.push({ item: loc, score: total / q.length });
  }
  hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return hits.map((h) => h.item);
}
