import { Link } from 'react-router-dom';
import type { LocationView } from '@/domain/filters';
import { ACTIVITY_META } from '@/domain/filters';
import { STATUS_META, statusArrow } from '@/domain/foliage';
import { formatDrive, formatElevation, formatMiles } from '@/domain/geo';
import { formatRelative, formatShortDate, formatUntil } from '@/domain/dates';
import { useApp } from '@/state/AppState';
import { ColorMeter, StatusPill } from './Status';
import { IconHeart } from './Icons';

export function LocationCard({ view, compact, onClick }: { view: LocationView; compact?: boolean; onClick?: () => void }) {
  const { now, isFavorite, toggleFavorite } = useApp();
  const { location, condition, miles, driveMinutes } = view;
  const fav = isFavorite(location.id);
  const meta = STATUS_META[condition.status];

  const peakText =
    condition.status === 'peak'
      ? `Peak through ~${formatShortDate(condition.estimatedPeakEnd)}`
      : condition.status === 'past'
        ? 'Peak has passed'
        : `Peak est. ${formatUntil(condition.estimatedPeakStart, now)}`;

  const updated = condition.latestReport ? `Updated ${formatRelative(new Date(condition.latestReport.observedAt), now)}` : 'No recent reports';

  return (
    <article className={`card spot spot--${condition.status}${compact ? ' spot--compact' : ''}`}>
      <Link to={`/spot/${location.id}`} className="spot__title" onClick={onClick} aria-label={`${location.name}. ${meta.label}, ${condition.colorPercent}% color. ${formatDrive(driveMinutes)} away.`}>
        {location.name}
      </Link>
      <div className="spot__sub">{location.area} · {location.town}</div>
      <div className="spot__status">
        <StatusPill status={condition.status} />
        <span className="spot__arrow">{statusArrow(condition)}</span>
      </div>
      <div className="spot__meter">
        <ColorMeter percent={condition.colorPercent} status={condition.status} />
      </div>
      <div className="spot__facts">
        <span><strong>{formatElevation(location.elevationFt)}</strong></span>
        <span>{updated}</span>
        <span>{peakText}</span>
        <span className="spot__acts" role="img" aria-label={`Good for ${location.activities.map((a) => ACTIVITY_META[a].label).join(', ')}`}>
          {location.activities.slice(0, 5).map((a) => (
            <span key={a} title={ACTIVITY_META[a].label} aria-hidden="true">{ACTIVITY_META[a].glyph}</span>
          ))}
        </span>
      </div>
      <div className="spot__side">
        <div className="spot__dist tnum">
          {formatDrive(driveMinutes)}
          <small>{formatMiles(miles)} away</small>
        </div>
        <button
        type="button"
        className="spot__watch"
        aria-pressed={fav}
        aria-label={fav ? `Stop watching ${location.name}` : `Watch ${location.name}`}
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(location.id);
        }}
      >
        <IconHeart filled={fav} />
      </button>
      </div>
    </article>
  );
}
