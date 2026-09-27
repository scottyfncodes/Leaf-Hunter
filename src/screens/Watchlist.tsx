import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { LocationCard } from '@/components/LocationCard';
import { EmptyState } from '@/components/EmptyState';
import { IconHeart } from '@/components/Icons';
import { daysBetween, startOfDay } from '@/domain/dates';

export function WatchlistScreen() {
  const { favorites, viewFor, now } = useApp();
  const items = useMemo(
    () =>
      favorites
        .map((f) => ({ fav: f, view: viewFor(f.locationId) }))
        .filter((x): x is { fav: typeof x.fav; view: NonNullable<typeof x.view> } => Boolean(x.view))
        .sort((a, b) => {
          const tier = { peak: 0, turning: 1, early: 2, past: 3 } as const;
          return tier[a.view.condition.status] - tier[b.view.condition.status];
        }),
    [favorites, viewFor],
  );

  return (
    <div className="screen">
      <header className="brand">
        <div>
          <h1 className="brand__name" style={{ fontSize: 26 }}>WATCHLIST</h1>
          <p className="brand__tag">{items.length ? `${items.length} spot${items.length === 1 ? '' : 's'} on watch` : 'Spots worth chasing.'}</p>
        </div>
      </header>
      <div className="stack-l" style={{ paddingTop: 8, paddingBottom: 32 }}>
        {items.length === 0 ? (
          <EmptyState
            title="Nothing on watch."
            body="Add a spot when you find somewhere worth chasing."
            art={<IconHeart className="empty__art" />}
            action={<Link to="/" className="btn btn--soft btn--sm">Find the color</Link>}
          />
        ) : (
          <div className="spot-list spot-list--grid">
            {items.map(({ fav, view }) => {
              const delta = view.condition.colorPercent - fav.lastSeenPercent;
              const justAdded = daysBetween(startOfDay(new Date(fav.addedAt)), startOfDay(now)) === 0 && delta === 0;
              const note = justAdded
                ? 'Just added. Check back for movement.'
                : view.condition.status === 'past'
                  ? 'Color is fading.'
                  : delta >= 15
                    ? 'Color is accelerating.'
                    : delta > 0
                      ? 'Color is building.'
                      : delta < 0
                        ? 'Color has dropped.'
                        : 'No change since your last look.';
              const tone = delta > 0 ? ' watch-delta--up' : delta < 0 ? ' watch-delta--down' : '';
              return (
                <div key={fav.locationId}>
                  <div className="watch-row">
                    <span className={`watch-delta tnum${tone}`} aria-label={`Changed from ${fav.lastSeenPercent} to ${view.condition.colorPercent} percent`}>
                      <span aria-hidden="true">{fav.lastSeenPercent}% → {view.condition.colorPercent}%</span>
                    </span>
                    <span className="watch-delta__note">{note}</span>
                  </div>
                  <LocationCard view={view} />
                </div>
              );
            })}
            <p className="small muted">Change is measured since you last opened each spot. Stored on this device.</p>
          </div>
        )}
      </div>
    </div>
  );
}
