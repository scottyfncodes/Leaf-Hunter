import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { colorWave } from '@/domain/forecast';
import { ColorWaveCard } from '@/components/ColorWave';
import { IconBack, IconInfo } from '@/components/Icons';
import { STATUS_META } from '@/domain/foliage';
import { LocationCard } from '@/components/LocationCard';

export function WaveScreen() {
  const { region, reports, now, views } = useApp();
  const nav = useNavigate();
  const wave = useMemo(() => colorWave(region.locations, reports, now), [region, reports, now]);

  // For each band, a representative spot (closest to peak) to make the wave tangible.
  const picks = wave.now.bands
    .map((b) => {
      const inBand = views.filter((v) => v.location.elevationFt >= b.band.minFt && v.location.elevationFt < b.band.maxFt);
      const best = [...inBand].sort((x, y) => Math.abs(90 - x.condition.colorPercent) - Math.abs(90 - y.condition.colorPercent))[0];
      return best ? { band: b, view: best } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="screen">
      <div className="topbar" style={{ margin: '0 calc(-1 * var(--gutter))' }}>
        <div className="topbar__inner">
          <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><IconBack /></button>
          <h1 className="topbar__title">The Color Wave</h1>
        </div>
      </div>
      <div className="stack-l" style={{ paddingTop: 8, paddingBottom: 24 }}>
        <ColorWaveCard wave={wave} />
        <div className="notice">
          <IconInfo />
          <span>
            Fall color in Colorado moves downhill over roughly a month. This view groups tracked spots by elevation and shows the typical status for each band now and a week out. Timing shifts with weather, so treat it as an expectation, not a promise.
          </span>
        </div>
        <section className="section" aria-labelledby="wave-picks">
          <h2 id="wave-picks" className="eyebrow">One spot per band</h2>
          <p className="small muted" style={{ marginBottom: 10 }}>Where each elevation band is showing its color right now.</p>
          <div className="spot-list">
            {picks.map(({ band, view }) => (
              <div key={band.band.id}>
                <div className="small muted" style={{ margin: '6px 0 6px 4px' }}>
                  <span aria-hidden="true">{STATUS_META[band.status].glyph}</span> {band.band.label} · {band.band.range}
                </div>
                <LocationCard view={view} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
