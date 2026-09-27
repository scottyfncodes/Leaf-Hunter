import { Link } from 'react-router-dom';
import type { ColorWave as WaveModel, BandSnapshot } from '@/domain/forecast';
import { STATUS_META } from '@/domain/foliage';
import { formatShortDate } from '@/domain/dates';

function BandRow({ b }: { b: BandSnapshot }) {
  const meta = STATUS_META[b.status];
  return (
    <li className="wave__band">
      <span className={`wave__glyph wave__glyph--${b.status}`} aria-hidden="true">{meta.glyph}</span>
      <span className="wave__label">
        {b.band.label}
        <span className="wave__sub">{meta.label} · ~{b.averagePercent}% · {b.band.range}</span>
      </span>
    </li>
  );
}

/** A tiny ridgeline colored by band status, top to bottom = high to low. */
function Ridge({ bands }: { bands: BandSnapshot[] }) {
  const colors: Record<string, string> = { early: 'var(--early)', turning: 'var(--turning)', peak: 'var(--peak)', past: 'var(--past)' };
  // Five stacked bands as horizontal strata under a mountain silhouette.
  const h = 84;
  const strata = bands.map((b, i) => ({ y: (i / bands.length) * h, hgt: h / bands.length, color: colors[b.status] ?? 'var(--early)' }));
  return (
    <svg className="wave__ridge" viewBox={`0 0 300 ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <clipPath id="ridge-clip">
          <path d={`M0 ${h} L0 70 L40 48 L70 62 L110 18 L140 40 L170 8 L200 36 L235 22 L265 50 L300 34 L300 ${h} Z`} />
        </clipPath>
      </defs>
      <g clipPath="url(#ridge-clip)">
        {strata.map((s, i) => (
          <rect key={i} x="0" y={s.y} width="300" height={s.hgt + 0.5} fill={s.color} opacity={0.9} />
        ))}
      </g>
    </svg>
  );
}

export function ColorWaveCard({ wave, compact, linkTo }: { wave: WaveModel; compact?: boolean; linkTo?: string }) {
  return (
    <section className="wave" aria-labelledby="wave-title">
      <div className="section__head" style={{ marginBottom: 0 }}>
        <h2 id="wave-title" className="eyebrow">The Color Wave</h2>
        {linkTo && <Link className="section__link" to={linkTo}>See the week →</Link>}
      </div>
      <p className="small muted" style={{ marginTop: 4 }}>How color is moving down Colorado&rsquo;s elevations. Estimated from typical timing and recent reports.</p>
      <Ridge bands={wave.now.bands} />
      {compact ? (
        <ul style={{ marginTop: 6 }}>
          {wave.now.bands.map((b) => <BandRow key={b.band.id} b={b} />)}
        </ul>
      ) : (
        <div className="wave__cols">
          <div>
            <div className="wave__col-head">Now · {formatShortDate(wave.now.date)}</div>
            <ul>{wave.now.bands.map((b) => <BandRow key={b.band.id} b={b} />)}</ul>
          </div>
          <div>
            <div className="wave__col-head">Next 7 days · by {formatShortDate(wave.next.date)}</div>
            <ul>{wave.next.bands.map((b) => <BandRow key={b.band.id} b={b} />)}</ul>
          </div>
        </div>
      )}
      <p className="wave__movement">{wave.movement}</p>
    </section>
  );
}
