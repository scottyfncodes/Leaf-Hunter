import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { datasetStats, headlineFor } from '@/domain/season';
import { colorWave } from '@/domain/forecast';
import { searchLocations } from '@/domain/search';
import {
  ACTIVITY_META,
  DISTANCE_LABEL,
  EMPTY_FILTERS,
  TIMING_FILTER_LABEL,
  activeFilterCount,
  applyFilters,
  sortForExplore,
  toggleInList,
  type DistanceFilter,
  type Filters,
  type TimingFilter,
} from '@/domain/filters';
import { STATUS_META, STATUS_ORDER } from '@/domain/foliage';
import type { Activity, FoliageStatus } from '@/domain/types';
import { HeadlineBanner } from '@/components/Headline';
import { ColorWaveCard } from '@/components/ColorWave';
import { SearchBar } from '@/components/SearchBar';
import { LocationCard } from '@/components/LocationCard';
import { Chip, Segmented } from '@/components/Chips';
import { Sheet } from '@/components/Sheet';
import { EmptyState } from '@/components/EmptyState';
import { FoliageMap } from '@/map/FoliageMap';
import { IconCamera, IconFilter, IconHome, IconLocate, LeafMark } from '@/components/Icons';
import { formatDrive } from '@/domain/geo';
import './explore.css';

type Mode = 'map' | 'list';

export function ExploreScreen() {
  const app = useApp();
  const { views, region, now, season, origin, useMyLocation, locating, locationError } = app;
  const [params, setParams] = useSearchParams();
  const mode = (params.get('view') as Mode) || 'list';
  const setMode = (m: Mode) => setParams((p) => { p.set('view', m); return p; }, { replace: true });

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats = useMemo(() => datasetStats(views.map((v) => v.condition)), [views]);
  const headline = useMemo(() => headlineFor(season, stats), [season, stats]);
  const wave = useMemo(() => colorWave(region.locations, app.reports, now), [region, app.reports, now]);

  const results = useMemo(() => {
    const found = searchLocations(region.locations, query);
    const ids = new Set(found.map((l) => l.id));
    const ordered = found.map((l) => views.find((v) => v.location.id === l.id)!).filter(Boolean);
    const filtered = applyFilters(ordered, filters);
    // Keep search relevance ordering when the user typed something; otherwise sort by status.
    return query.trim() ? filtered : sortForExplore(filtered.filter((v) => ids.has(v.location.id)));
  }, [region, query, views, filters]);

  useEffect(() => {
    if (selectedId && !results.some((v) => v.location.id === selectedId)) setSelectedId(null);
  }, [results, selectedId]);

  const nFilters = activeFilterCount(filters);
  const selected = results.find((v) => v.location.id === selectedId) ?? null;
  const activeSeason = season.phase === 'active';

  const countBy = (s: FoliageStatus) => views.filter((v) => v.condition.status === s).length;

  return (
    <div className="screen screen--wide explore">
      <header className="brand">
        <div>
          <h1 className="brand__name">LEAF HUNTER</h1>
          <p className="brand__tag">Chase the color.</p>
        </div>
        <LeafMark className="brand__mark" />
      </header>

      <div className="explore__grid">
        <div className="explore__side stack-l">
          <HeadlineBanner headline={headline} stats={stats} active={activeSeason} compact={mode === 'map'} />

          {season.phase !== 'active' && (
            <div className="notice">
              <IconHome />
              <span>
                {season.phase === 'preseason' || season.phase === 'offseason'
                  ? 'Foliage season has not started. Statuses below reflect typical timing, not live conditions. Build a watchlist so you are ready.'
                  : 'The season has wound down. Statuses reflect typical timing; most spots are past peak.'}
              </span>
            </div>
          )}

          <section className="section" aria-labelledby="find-title">
            <div className="section__head">
              <h2 id="find-title" className="eyebrow">Find the color</h2>
              <button type="button" className="section__link" onClick={() => (locating ? undefined : void useMyLocation())} aria-busy={locating}>
                <IconLocate width={16} height={16} style={{ marginRight: 6 }} />
                {origin.kind === 'gps' ? 'Near you' : `From ${origin.name}`}
              </button>
            </div>
            {locationError && <p className="small muted" role="status" style={{ marginBottom: 8 }}>{locationError}</p>}
            <div className="stack">
              <SearchBar value={query} onChange={setQuery} />
              <div className="row row--between">
                <Segmented<Mode> value={mode} onChange={setMode} label="View" options={[{ value: 'map', label: 'MAP' }, { value: 'list', label: 'LIST' }]} />
                <button type="button" className={`chip${nFilters ? ' chip--on' : ''}`} onClick={() => setSheetOpen(true)} aria-haspopup="dialog">
                  <IconFilter width={18} height={18} />
                  Filters{nFilters ? ` · ${nFilters}` : ''}
                </button>
              </div>
              {mode === 'list' && (
              <div className="chips chips--scroll" aria-label="Quick filters">
                {STATUS_ORDER.map((s) => (
                  <Chip key={s} tone={s} on={filters.statuses.includes(s)} count={countBy(s)} onClick={() => setFilters((f) => ({ ...f, statuses: toggleInList(f.statuses, s) }))}>
                    <span aria-hidden="true">{STATUS_META[s].glyph}</span> {STATUS_META[s].label}
                  </Chip>
                ))}
                <Chip on={filters.timing.includes('peak-soon')} onClick={() => setFilters((f) => ({ ...f, timing: toggleInList(f.timing, 'peak-soon') }))}>Peak soon</Chip>
                <Chip on={filters.distance === '2h'} onClick={() => setFilters((f) => ({ ...f, distance: f.distance === '2h' ? 'any' : '2h' }))}>Under 2 hr</Chip>
              </div>
              )}
            </div>
          </section>

          <div className="explore__wave-desktop">
            <ColorWaveCard wave={wave} compact linkTo="/wave" />
          </div>
        </div>

        <div className="explore__main">
          {mode === 'map' ? (
            <section className="explore__map card" aria-label="Foliage map">
              <FoliageMap
                map={region.map}
                views={results}
                selectedId={selectedId}
                onSelect={setSelectedId}
                origin={origin}
                onLocate={() => void useMyLocation()}
                locating={locating}
              />
              {selected && (
                <div className="explore__map-card">
                  <LocationCard view={selected} compact />
                </div>
              )}
              {!selected && results.length > 0 && (
                <p className="explore__map-hint small muted">Tap a pin for conditions · {results.length} spots · pinch to zoom</p>
              )}
            </section>
          ) : (
            <section className="section" aria-label="Foliage spots" style={{ paddingTop: 12 }}>
              <p className="small muted" style={{ marginBottom: 10 }}>
                {results.length} spot{results.length === 1 ? '' : 's'}
                {query ? ` matching “${query}”` : ''} · drive times from {origin.name}
              </p>
              {results.length ? (
                <div className="spot-list spot-list--grid">
                  {results.map((v) => <LocationCard key={v.location.id} view={v} />)}
                </div>
              ) : (
                <EmptyState
                  title={query ? 'No spot by that name' : 'The leaves aren’t here yet.'}
                  body={query ? 'Try a pass, a town, or a region like “San Juan”.' : 'Try widening your hunt radius or clearing a filter.'}
                  action={
                    <button type="button" className="btn btn--soft btn--sm" onClick={() => { setFilters(EMPTY_FILTERS); setQuery(''); }}>
                      Clear filters
                    </button>
                  }
                />
              )}
            </section>
          )}

          <div className="explore__wave-mobile section">
            <ColorWaveCard wave={wave} compact linkTo="/wave" />
          </div>

          <section className="section explore__hunt-cta">
            <Link to="/hunt" className="btn btn--block">Hunt this weekend →</Link>
            <p className="small muted" style={{ marginTop: 8, textAlign: 'center' }}>Tell us how much time you have. We&rsquo;ll match the color to it.</p>
          </section>
        </div>
      </div>

      {mode === 'list' && (
        <Link to="/report" className="fab" aria-label="Report conditions">
          <IconCamera width={20} height={20} />
          Leaf check
        </Link>
      )}

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters">
        <FilterGroups filters={filters} setFilters={setFilters} />
        <div className="row" style={{ marginTop: 20, gap: 10 }}>
          <button type="button" className="btn btn--ghost" onClick={() => setFilters(EMPTY_FILTERS)} disabled={!nFilters}>Clear</button>
          <button type="button" className="btn grow" onClick={() => setSheetOpen(false)}>Show {results.length} spot{results.length === 1 ? '' : 's'}</button>
        </div>
      </Sheet>
    </div>
  );
}

export function FilterGroups({ filters, setFilters }: { filters: Filters; setFilters: (f: (prev: Filters) => Filters) => void }) {
  const distances: DistanceFilter[] = ['nearby', '1h', '2h', '3h', 'any'];
  const timings: TimingFilter[] = ['peak-now', 'peak-soon', 'later'];
  const activities = Object.keys(ACTIVITY_META) as Activity[];
  return (
    <div>
      <div className="fgroup">
        <div className="eyebrow eyebrow--muted fgroup__label">Foliage</div>
        <div className="chips">
          {STATUS_ORDER.map((s) => (
            <Chip key={s} tone={s} on={filters.statuses.includes(s)} onClick={() => setFilters((f) => ({ ...f, statuses: toggleInList(f.statuses, s) }))}>
              <span aria-hidden="true">{STATUS_META[s].glyph}</span> {STATUS_META[s].label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <div className="eyebrow eyebrow--muted fgroup__label">Experience</div>
        <div className="chips">
          {activities.map((a) => (
            <Chip key={a} on={filters.activities.includes(a)} onClick={() => setFilters((f) => ({ ...f, activities: toggleInList(f.activities, a) }))}>
              <span aria-hidden="true">{ACTIVITY_META[a].glyph}</span> {ACTIVITY_META[a].label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <div className="eyebrow eyebrow--muted fgroup__label">Distance</div>
        <div className="chips" role="radiogroup" aria-label="Drive time">
          {distances.map((d) => (
            <Chip key={d} on={filters.distance === d} onClick={() => setFilters((f) => ({ ...f, distance: d }))}>
              {DISTANCE_LABEL[d]}{d === 'nearby' ? ` (${formatDrive(45)})` : ''}
            </Chip>
          ))}
        </div>
      </div>
      <div className="fgroup">
        <div className="eyebrow eyebrow--muted fgroup__label">Timing</div>
        <div className="chips">
          {timings.map((t) => (
            <Chip key={t} on={filters.timing.includes(t)} onClick={() => setFilters((f) => ({ ...f, timing: toggleInList(f.timing, t) }))}>
              {TIMING_FILTER_LABEL[t]}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
