import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { STATUS_META, reportsForLocation, statusArrow } from '@/domain/foliage';
import { ACTIVITY_META } from '@/domain/filters';
import { formatDrive, formatElevation, formatMiles } from '@/domain/geo';
import { formatRange, formatRelative, formatShortDate, formatUntil } from '@/domain/dates';
import { appleMapsDirectionsUrl, googleMapsDirectionsUrl } from '@/domain/chase';
import { ColorMeter, ConfidenceLabel, SourcePill, StatusPill } from '@/components/Status';
import { LeafArt } from '@/components/LeafArt';
import { EmptyState } from '@/components/EmptyState';
import { IconBack, IconCamera, IconCheck, IconExternal, IconHeart } from '@/components/Icons';

const ACCESS_LABEL: Record<string, string> = {
  paved: 'Paved road',
  gravel: 'Graded dirt road',
  'high-clearance': 'High clearance advised',
  trail: 'Trail access',
  town: 'In town',
};

const KIND_LABEL: Record<string, string> = {
  pass: 'Mountain pass',
  grove: 'Aspen grove',
  drive: 'Scenic drive',
  hike: 'Hiking area',
  foothills: 'Foothills',
  town: 'Mountain town',
};

export function LocationDetailScreen() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const { viewFor, reports, now, isFavorite, toggleFavorite, markSeen, origin } = useApp();
  const view = viewFor(id);

  useEffect(() => {
    if (view && isFavorite(id)) markSeen(id);
    // Mark as seen once on open, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const spotReports = useMemo(() => reportsForLocation(reports, id), [reports, id]);

  if (!view) {
    return (
      <div className="screen" style={{ paddingTop: 40 }}>
        <EmptyState title="Spot not found" body="That location isn’t in this region yet." action={<Link to="/" className="btn btn--soft btn--sm">Back to Explore</Link>} />
      </div>
    );
  }

  const { location, condition, miles, driveMinutes } = view;
  const fav = isFavorite(id);
  const meta = STATUS_META[condition.status];
  const photos = spotReports.filter((r) => r.photo);

  const peakLine =
    condition.status === 'peak'
      ? `Now, through about ${formatShortDate(condition.estimatedPeakEnd)}`
      : condition.status === 'past'
        ? `Passed around ${formatShortDate(condition.estimatedPeakEnd)}`
        : `${formatShortDate(condition.estimatedPeakStart)} (${formatUntil(condition.estimatedPeakStart, now)})`;

  return (
    <div className="screen screen--flush">
      <div className="hero">
        <LeafArt seed={location.id} status={condition.status} title={`Illustration of ${location.name}`} />
        <div className="hero__shade" />
        <div className="hero__nav">
          <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><IconBack /></button>
          <button type="button" className="icon-btn" aria-pressed={fav} onClick={() => toggleFavorite(id)} aria-label={fav ? 'Stop watching this spot' : 'Watch this spot'}>
            <IconHeart filled={fav} />
          </button>
        </div>
        <div className="hero__text">
          <h1 className="hero__title">{location.name}</h1>
          <p className="hero__sub">{KIND_LABEL[location.kind]} · {location.area} · near {location.town}</p>
        </div>
      </div>

      <div style={{ padding: '0 var(--gutter)', maxWidth: 'var(--content-max)', margin: '0 auto' }} className="stack-l">
        <section className="card status-block" style={{ marginTop: 14 }} aria-label="Current status">
          <div>
            <div className="row row--wrap" style={{ gap: 8 }}>
              <StatusPill status={condition.status} large />
              <span className="spot__arrow">{statusArrow(condition)}</span>
            </div>
            <div style={{ marginTop: 10 }}>
              <ColorMeter percent={condition.colorPercent} status={condition.status} showValue={false} />
            </div>
            <p className="status-block__meta">
              <ConfidenceLabel condition={condition} />
              {condition.latestReport ? ` · updated ${formatRelative(new Date(condition.latestReport.observedAt), now)}` : ' · no reports in the last week'}
            </p>
          </div>
          <div className="status-block__pct tnum" aria-label={`${condition.colorPercent} percent color`}>
            {condition.colorPercent}<small>%</small>
          </div>
        </section>

        <div className="detail-actions">
          <Link to={`/report?spot=${location.id}`} className="btn btn--ember"><IconCamera width={18} height={18} /> Leaf check</Link>
          <button type="button" className={`btn ${fav ? 'btn--soft' : 'btn--ghost'}`} aria-pressed={fav} onClick={() => toggleFavorite(id)}>
            <IconHeart width={18} height={18} filled={fav} /> {fav ? 'Watching' : 'Watch'}
          </button>
        </div>

        <section className="section" aria-labelledby="facts">
          <h2 id="facts" className="eyebrow" style={{ marginBottom: 10 }}>Quick facts</h2>
          <div className="facts">
            <div className="fact"><div className="fact__label">Elevation</div><div className="fact__value">{formatElevation(location.elevationFt)}</div></div>
            <div className="fact"><div className="fact__label">Distance</div><div className="fact__value">{formatDrive(driveMinutes)}<small>{formatMiles(miles)} from {origin.name}</small></div></div>
            <div className="fact"><div className="fact__label">Region</div><div className="fact__value">{location.area}</div></div>
            <div className="fact"><div className="fact__label">Typical window</div><div className="fact__value">{formatRange(location.typical.peakStart, location.typical.peakEnd, now)}<small>estimate</small></div></div>
            <div className="fact"><div className="fact__label">Access</div><div className="fact__value">{ACCESS_LABEL[location.accessType]}</div></div>
            <div className="fact"><div className="fact__label">Estimated peak</div><div className="fact__value">{peakLine}</div></div>
          </div>
        </section>

        <section className="section" aria-labelledby="why">
          <h2 id="why" className="eyebrow" style={{ marginBottom: 10 }}>Why go</h2>
          <p className="prose" style={{ marginBottom: 12 }}>{location.summary}</p>
          <ul className="why">
            {location.whyGo.map((w) => (
              <li key={w} className="why__item"><IconCheck /><span>{w}</span></li>
            ))}
          </ul>
          <div className="chips" style={{ marginTop: 12 }} aria-label="Good for">
            {location.activities.map((a) => (
              <span key={a} className="pill pill--neutral"><span aria-hidden="true">{ACTIVITY_META[a].glyph}</span> {ACTIVITY_META[a].label}</span>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="reports">
          <div className="section__head">
            <h2 id="reports" className="eyebrow">Recent reports</h2>
            <Link className="section__link" to={`/report?spot=${location.id}`}>Add yours →</Link>
          </div>
          {spotReports.length ? (
            <div className="card">
              {spotReports.slice(0, 6).map((r) => (
                <article key={r.id} className="report-item">
                  <div className={`report-item__pct tnum`} style={{ color: `var(--${r.status}-text)` }}>
                    <span aria-hidden="true">{STATUS_META[r.status].glyph}</span> {r.colorPercent}%
                    <small>{formatShortDate(new Date(r.observedAt))}</small>
                  </div>
                  <div>
                    <div className="report-item__head">
                      <strong>{r.source === 'demo' ? 'Leaf Hunter report' : 'Your leaf check'}</strong>
                      <SourcePill source={r.source} />
                    </div>
                    {r.note && <p className="report-item__note">“{r.note}”</p>}
                    {r.photo && <img className="report-item__photo" src={r.photo} alt={`Photo from a ${meta.label.toLowerCase()} report at ${location.name}`} loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="You’re the scout." body="Be the first to report today’s color." action={<Link to={`/report?spot=${location.id}`} className="btn btn--ember btn--sm">Report conditions</Link>} />
          )}
          {spotReports.some((r) => r.source === 'demo') && (
            <p className="small muted" style={{ marginTop: 8 }}>Reports marked <strong>Demo</strong> are generated from typical timing to illustrate the app. They are not real observations.</p>
          )}
        </section>

        <section className="section" aria-labelledby="photos">
          <h2 id="photos" className="eyebrow" style={{ marginBottom: 10 }}>Photos</h2>
          <div className="gallery">
            {photos.slice(0, 5).map((r) => (
              <div key={r.id} className="gallery__item">
                <img src={r.photo} alt={`Leaf check photo, ${r.colorPercent}% color`} loading="lazy" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none'; }} />
                <span className="gallery__tag">{formatShortDate(new Date(r.observedAt))}</span>
              </div>
            ))}
            {['a', 'b', 'c'].slice(0, Math.max(1, 3 - photos.length)).map((k) => (
              <div key={k} className="gallery__item">
                <LeafArt seed={`${location.id}-${k}`} status={condition.status} />
                <span className="gallery__tag">Illustration</span>
              </div>
            ))}
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>Add a photo with your leaf check and it shows up here, stored on this device.</p>
        </section>

        <section className="section" aria-labelledby="go" style={{ paddingBottom: 32 }}>
          <h2 id="go" className="eyebrow" style={{ marginBottom: 10 }}>Go</h2>
          <div className="detail-actions">
            <a className="btn btn--ghost" href={appleMapsDirectionsUrl(origin, location, location.name)} target="_blank" rel="noopener noreferrer">
              Apple Maps <IconExternal width={16} height={16} />
            </a>
            <a className="btn btn--ghost" href={googleMapsDirectionsUrl(origin, [location])} target="_blank" rel="noopener noreferrer">
              Google Maps <IconExternal width={16} height={16} />
            </a>
          </div>
          <p className="small muted" style={{ marginTop: 8 }}>Drive time is a rough estimate from {origin.name}. Check road and pass conditions before you go.</p>
        </section>
      </div>
    </div>
  );
}
