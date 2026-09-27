import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { CHASE_BUDGET_META, appleMapsDirectionsUrl, corridorLabel, googleMapsDirectionsUrl, planChase, type ChaseBudget } from '@/domain/chase';
import { ACTIVITY_META, toggleInList } from '@/domain/filters';
import type { Activity, StartPoint } from '@/domain/types';
import { formatDrive, formatMiles } from '@/domain/geo';
import { Chip } from '@/components/Chips';
import { StatusPill } from '@/components/Status';
import { EmptyState } from '@/components/EmptyState';
import { FoliageMap } from '@/map/FoliageMap';
import { IconExternal } from '@/components/Icons';

export function ChasePanel() {
  const { views, region, origin } = useApp();
  const [startId, setStartId] = useState<string>(origin.kind === 'gps' ? 'gps' : (region.startPoints.find((s) => s.name === origin.name)?.id ?? region.defaultStart.id));
  const [budget, setBudget] = useState<ChaseBudget>('full');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const start: StartPoint = useMemo(() => {
    if (startId === 'gps' && origin.kind === 'gps') return { id: 'gps', name: 'My location', latitude: origin.latitude, longitude: origin.longitude };
    return region.startPoints.find((s) => s.id === startId) ?? region.defaultStart;
  }, [startId, origin, region]);

  const plan = useMemo(() => planChase(views, { start, budget, activities }), [views, start, budget, activities]);
  const routeIds = plan?.stops.map((s) => s.location.id) ?? [];
  const routeViews = plan ? views.filter((v) => routeIds.includes(v.location.id)) : [];

  return (
    <div className="stack-l" style={{ paddingBottom: 32 }}>
      <section className="section" aria-labelledby="chase-start">
        <h2 id="chase-start" className="eyebrow" style={{ marginBottom: 10 }}>Start</h2>
        <label className="field">
          <span className="sr-only">Starting point</span>
          <div className="select-wrap">
            <select className="select" value={startId} onChange={(e) => setStartId(e.target.value)}>
              {origin.kind === 'gps' && <option value="gps">My location</option>}
              {region.startPoints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </label>
      </section>

      <section className="section" aria-labelledby="chase-time">
        <h2 id="chase-time" className="eyebrow" style={{ marginBottom: 10 }}>Time available</h2>
        <div className="chips" role="radiogroup" aria-label="Time available">
          {(Object.keys(CHASE_BUDGET_META) as ChaseBudget[]).map((b) => (
            <Chip key={b} on={budget === b} onClick={() => setBudget(b)}>{CHASE_BUDGET_META[b].label}</Chip>
          ))}
        </div>
        <div className="chips" style={{ marginTop: 10 }} aria-label="Preferences">
          {(['drive', 'hike', 'photo', 'dog'] as Activity[]).map((a) => (
            <Chip key={a} on={activities.includes(a)} onClick={() => setActivities((cur) => toggleInList(cur, a))}>
              <span aria-hidden="true">{ACTIVITY_META[a].glyph}</span> {ACTIVITY_META[a].label}
            </Chip>
          ))}
        </div>
      </section>

      <section className="section" aria-live="polite" aria-labelledby="chase-plan">
        <h2 id="chase-plan" className="eyebrow" style={{ marginBottom: 10 }}>Leaf chase</h2>
        {!plan ? (
          <EmptyState title="Too far for that window." body="Give it more time or pick a start closer to the mountains." />
        ) : (
          <div className="stack">
            <div className="card" style={{ height: 260, borderRadius: 'var(--radius-l)', overflow: 'hidden' }}>
              <FoliageMap map={region.map} views={routeViews} selectedId={selectedId} onSelect={setSelectedId} origin={start} routeIds={routeIds} />
            </div>
            <p className="prose">{plan.summary}</p>
            <div className="route__summary">
              <div className="fact"><div className="fact__label">Driving</div><div className="fact__value">{formatDrive(plan.totalDriveMinutes)}</div></div>
              <div className="fact"><div className="fact__label">On the ground</div><div className="fact__value">{formatDrive(plan.totalStopMinutes)}</div></div>
              <div className="fact"><div className="fact__label">Corridor</div><div className="fact__value" style={{ fontSize: 13 }}>{corridorLabel(plan.corridor)}</div></div>
            </div>
            <ol className="route card" style={{ padding: '10px 14px 10px 44px' }}>
              <li className="route__stop">
                <span className="route__dot route__dot--start" aria-hidden="true">●</span>
                <div className="route__name">{plan.start.name}</div>
                <div className="route__leg">Start</div>
              </li>
              {plan.legs.map((leg, i) => (
                <li key={leg.to.location.id} className="route__stop">
                  <span className="route__dot" aria-hidden="true">{i + 1}</span>
                  <div className="route__leg">↓ {formatDrive(leg.driveMinutes)} · {formatMiles(leg.miles)}</div>
                  <Link to={`/spot/${leg.to.location.id}`} className="route__name" style={{ textDecoration: 'none', display: 'block' }}>{leg.to.location.name}</Link>
                  <div className="row row--wrap" style={{ marginTop: 4, gap: 6 }}>
                    <StatusPill status={leg.to.condition.status} />
                    <span className="small muted">{leg.to.condition.colorPercent}% color · ~{formatDrive(Math.min(90, leg.to.location.visitMinutes))} stop</span>
                  </div>
                </li>
              ))}
              <li className="route__stop">
                <span className="route__dot route__dot--end" aria-hidden="true">●</span>
                <div className="route__leg">↓ {formatDrive(plan.returnMinutes)} scenic return</div>
                <div className="route__name">{plan.start.name}</div>
              </li>
            </ol>
            <div className="eyebrow eyebrow--muted" style={{ marginTop: 4 }}>Open in your maps app</div>
            <div className="detail-actions">
              <a className="btn btn--ghost" href={appleMapsDirectionsUrl(start, plan.stops[0]!.location, plan.stops[0]!.location.name)} target="_blank" rel="noopener noreferrer" aria-label="Open the first stop in Apple Maps">
                Apple Maps <IconExternal width={16} height={16} />
              </a>
              <a className="btn" href={googleMapsDirectionsUrl(start, plan.stops.map((s) => s.location))} target="_blank" rel="noopener noreferrer" aria-label="Open the full route in Google Maps">
                Google Maps <IconExternal width={16} height={16} />
              </a>
            </div>
            <p className="small muted" style={{ marginTop: -4 }}>Apple Maps opens the first stop; Google Maps takes the whole route with stops in order.</p>
            <p className="small muted">Drive times are rough estimates. Mountain passes close for weather; check conditions before leaving.</p>
          </div>
        )}
      </section>
    </div>
  );
}
