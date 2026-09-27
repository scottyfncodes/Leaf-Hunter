import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { hunt, TIME_BUDGET_META, type TimeBudget } from '@/domain/hunt';
import { ACTIVITY_META, toggleInList } from '@/domain/filters';
import type { Activity } from '@/domain/types';
import { Chip, Segmented } from '@/components/Chips';
import { LocationCard } from '@/components/LocationCard';
import { EmptyState } from '@/components/EmptyState';
import { IconLocate, IconRoute } from '@/components/Icons';
import { ChasePanel } from './Chase';

type Tab = 'hunt' | 'chase';

export function HuntScreen() {
  const { views, now, origin, useMyLocation, locating, season } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'hunt';
  const setTab = (t: Tab) => setParams((p) => { p.set('tab', t); return p; }, { replace: true });

  const [budget, setBudget] = useState<TimeBudget | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);

  const matches = useMemo(() => (budget ? hunt(views, { budget, activities, now }) : []), [views, budget, activities, now]);
  const budgets = Object.keys(TIME_BUDGET_META) as TimeBudget[];

  return (
    <div className="screen">
      <header className="brand" style={{ alignItems: 'center' }}>
        <div>
          <h1 className="brand__name" style={{ fontSize: 26 }}>{tab === 'hunt' ? 'HUNT' : 'LEAF CHASE'}</h1>
          <p className="brand__tag">{tab === 'hunt' ? 'Tell us your time. We’ll find the color.' : 'A day of foliage stops, in order.'}</p>
        </div>
        <Segmented<Tab> value={tab} onChange={setTab} label="Mode" options={[{ value: 'hunt', label: 'HUNT' }, { value: 'chase', label: 'CHASE' }]} />
      </header>

      {tab === 'chase' ? (
        <ChasePanel />
      ) : (
        <div className="stack-l" style={{ paddingBottom: 32 }}>
          <section className="section" aria-labelledby="have">
            <div className="section__head">
              <h2 id="have" className="eyebrow">I have…</h2>
              <button type="button" className="section__link" onClick={() => void useMyLocation()} aria-busy={locating}>
                <IconLocate width={16} height={16} style={{ marginRight: 6 }} />
                {origin.kind === 'gps' ? 'From your location' : `From ${origin.name}`}
              </button>
            </div>
            <div className="choice-grid" role="radiogroup" aria-label="Time available">
              {budgets.map((b) => (
                <button key={b} type="button" className="choice" role="radio" aria-checked={budget === b} aria-pressed={budget === b} onClick={() => setBudget(b)}>
                  <div className="choice__label">{TIME_BUDGET_META[b].label}</div>
                  <div className="choice__sub">{TIME_BUDGET_META[b].sub}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="section" aria-labelledby="want">
            <h2 id="want" className="eyebrow" style={{ marginBottom: 10 }}>I want… <span className="muted" style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>(optional)</span></h2>
            <div className="chips">
              {(Object.keys(ACTIVITY_META) as Activity[]).map((a) => (
                <Chip key={a} on={activities.includes(a)} onClick={() => setActivities((cur) => toggleInList(cur, a))}>
                  <span aria-hidden="true">{ACTIVITY_META[a].glyph}</span> {ACTIVITY_META[a].label}
                </Chip>
              ))}
            </div>
          </section>

          <section className="section" aria-live="polite" aria-labelledby="matches">
            <h2 id="matches" className="eyebrow" style={{ marginBottom: 10 }}>
              {budget ? `${matches.length} match${matches.length === 1 ? '' : 'es'} for ${TIME_BUDGET_META[budget].label.toLowerCase()}` : 'Your matches'}
            </h2>
            {!budget ? (
              <EmptyState title="Pick a time budget." body="We’ll pull a handful of spots whose color and drive time fit, and explain why each one made the cut." art={<IconRoute className="empty__art" />} />
            ) : matches.length === 0 ? (
              <EmptyState
                title="Nothing fits that window."
                body={season.phase === 'active' ? 'Try a bigger time budget or fewer preferences.' : 'It’s outside foliage season. Try a bigger window to scout, or build your watchlist for fall.'}
                action={<button type="button" className="btn btn--soft btn--sm" onClick={() => { setActivities([]); setBudget('full'); }}>Try a full day, no preferences</button>}
              />
            ) : (
              <div className="spot-list">
                {matches.map((m) => (
                  <article key={m.view.location.id} className="card match">
                    <LocationCardHeader name={m.view.location.name} id={m.view.location.id} />
                    <LocationCard view={m.view} compact />
                    <ul className="match__reasons" aria-label="Why it fits">
                      {m.reasons.map((r) => <li key={r} className="match__reason">{r}</li>)}
                    </ul>
                    <div className="match__actions">
                      <Link to={`/spot/${m.view.location.id}`} className="btn btn--soft btn--sm grow">Check conditions</Link>
                    </div>
                  </article>
                ))}
                <p className="small muted">Matches are explained, not ranked. Foliage timing is an estimate; a recent report beats any model.</p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function LocationCardHeader({ name, id }: { name: string; id: string }) {
  return <span className="sr-only" id={`match-${id}`}>{name}</span>;
}
