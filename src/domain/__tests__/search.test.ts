import { describe, expect, it } from 'vitest';
import { editDistance, normalize, searchLocations } from '../search';
import { COLORADO } from '@/data/regions/colorado';

const L = COLORADO.locations;

describe('searchLocations', () => {
  it('returns everything for an empty query', () => {
    expect(searchLocations(L, '')).toHaveLength(L.length);
  });
  it('finds by name', () => {
    expect(searchLocations(L, 'Kenosha Pass')[0]?.id).toBe('kenosha-pass');
  });
  it('finds by town', () => {
    const ids = searchLocations(L, 'Nederland').map((l) => l.id);
    expect(ids).toContain('peak-to-peak');
  });
  it('finds by area / region', () => {
    const ids = searchLocations(L, 'San Juan').map((l) => l.id);
    expect(ids).toContain('dallas-divide');
    expect(ids).toContain('million-dollar-highway');
  });
  it('is forgiving about case, punctuation and prefixes', () => {
    expect(searchLocations(L, 'guanella')[0]?.id).toBe('guanella-pass');
    expect(searchLocations(L, 'GUAN')[0]?.id).toBe('guanella-pass');
    expect(searchLocations(L, "lair o the bear")[0]?.id).toBe('lair-o-the-bear');
  });
  it('tolerates a typo', () => {
    expect(searchLocations(L, 'Kenosha').map((l) => l.id)).toContain('kenosha-pass');
    expect(searchLocations(L, 'Kenoshа'.replace('а', 'a'))[0]?.id).toBe('kenosha-pass');
    expect(searchLocations(L, 'Guanela').map((l) => l.id)).toContain('guanella-pass');
  });
  it('matches aliases such as Mount Evans and RMNP', () => {
    expect(searchLocations(L, 'Mount Evans')[0]?.id).toBe('mount-blue-sky');
    expect(searchLocations(L, 'RMNP').map((l) => l.id)).toContain('bear-lake-rmnp');
  });
  it('puts Aspen the town and Aspen spots up top for "Aspen"', () => {
    const ids = searchLocations(L, 'Aspen').slice(0, 5).map((l) => l.id);
    expect(ids).toContain('aspen-town');
    expect(ids).toContain('maroon-bells');
  });
  it('returns nothing for nonsense', () => {
    expect(searchLocations(L, 'zzqx')).toHaveLength(0);
  });
});

describe('utils', () => {
  it('normalizes strings', () => {
    expect(normalize("Lair o' the Bear!")).toBe('lair o the bear');
  });
  it('computes edit distance', () => {
    expect(editDistance('kenosha', 'kenosha')).toBe(0);
    expect(editDistance('kenosha', 'kenoshe')).toBe(1);
    expect(editDistance('', 'abc')).toBe(3);
  });
});
