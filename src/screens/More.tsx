import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { STATUS_META, STATUS_ORDER } from '@/domain/foliage';
import { StatusPill } from '@/components/Status';
import { IconCamera, IconHome, IconInfo, IconTrash, IconWave, LeafMark } from '@/components/Icons';
import { Sheet } from '@/components/Sheet';
import { useToast } from '@/components/Toast';
import { formatShortDate } from '@/domain/dates';

export function MoreScreen() {
  const { region, origin, setHomeBase, localReports, favorites, clearLocalData, now, season } = useApp();
  const [confirm, setConfirm] = useState(false);
  const toast = useToast();

  return (
    <div className="screen">
      <header className="brand">
        <div>
          <h1 className="brand__name" style={{ fontSize: 26 }}>MORE</h1>
          <p className="brand__tag">Settings, data, and how this works.</p>
        </div>
        <LeafMark className="brand__mark" />
      </header>

      <div className="stack-l" style={{ paddingTop: 8, paddingBottom: 32 }}>
        <section className="section" aria-labelledby="home-base">
          <h2 id="home-base" className="eyebrow" style={{ marginBottom: 10 }}>Home base</h2>
          <label className="field">
            <span className="field__label">Distances and drive times are measured from</span>
            <div className="select-wrap">
              <select
                className="select"
                value={origin.kind === 'gps' ? '' : region.startPoints.find((s) => s.name === origin.name)?.id ?? ''}
                onChange={(e) => {
                  const s = region.startPoints.find((x) => x.id === e.target.value);
                  if (s) { setHomeBase(s); toast(`Home base set to ${s.name}`); }
                }}
              >
                {origin.kind === 'gps' && <option value="">My location (GPS)</option>}
                {region.startPoints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <span className="field__hint">Or tap the locate button on the map to use GPS for this session.</span>
          </label>
        </section>

        <section className="section">
          <div className="menu">
            <Link to="/wave" className="menu__item"><IconWave /><div><div className="menu__label">The Color Wave</div><div className="menu__sub">This week’s expected movement</div></div></Link>
            <Link to="/report" className="menu__item"><IconCamera /><div><div className="menu__label">Report conditions</div><div className="menu__sub">A 20-second leaf check</div></div></Link>
            <Link to="/watch" className="menu__item"><IconHome /><div><div className="menu__label">Watchlist</div><div className="menu__sub">{favorites.length} spot{favorites.length === 1 ? '' : 's'} on watch</div></div></Link>
          </div>
        </section>

        <section className="section" aria-labelledby="legend">
          <h2 id="legend" className="eyebrow" style={{ marginBottom: 10 }}>Status legend</h2>
          <div className="card legend" style={{ padding: 14 }}>
            {STATUS_ORDER.map((s) => (
              <div key={s} className="legend__row">
                <StatusPill status={s} />
                <span>{STATUS_META[s].description}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="section" aria-labelledby="about">
          <h2 id="about" className="eyebrow" style={{ marginBottom: 10 }}>How Leaf Hunter works</h2>
          <div className="card prose" style={{ padding: 16 }}>
            <p>Leaf Hunter has one job: help you figure out where the fall color is and whether it is worth going right now.</p>
            <p>Each spot has a typical peak window based on elevation and latitude. Between reports, the app estimates color from that window. When someone files a leaf check, the report takes over and nudges the estimated peak earlier or later.</p>
            <p>None of this is scientific forecasting. Weather, moisture, and early frost move the season by a week or more in either direction. Treat every date as an estimate and every fresh report as gold.</p>
            <p><strong>Demo data.</strong> This first version has no backend. Reports marked <em>Demo</em> are generated from typical timing so the app feels alive. Your own leaf checks and watchlist are stored only on this device.</p>
          </div>
        </section>

        <section className="section" aria-labelledby="data">
          <h2 id="data" className="eyebrow" style={{ marginBottom: 10 }}>Your data on this device</h2>
          <div className="card" style={{ padding: 14 }}>
            <div className="row row--between">
              <div>
                <div style={{ fontWeight: 700 }}>{localReports.length} leaf check{localReports.length === 1 ? '' : 's'} · {favorites.length} watched</div>
                <div className="small muted">Stored in this browser only. Nothing is uploaded.</div>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirm(true)} disabled={!localReports.length && !favorites.length}>
                <IconTrash width={16} height={16} /> Clear
              </button>
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="season-info">
          <div className="notice">
            <IconInfo />
            <span>
              Today is {formatShortDate(now)}. {region.name} season: {season.phase === 'active' ? 'active' : season.phase}. Add <code>?today=YYYY-MM-DD</code> to the URL to preview another date.
            </span>
          </div>
          <p className="small muted" style={{ marginTop: 12 }}>Leaf Hunter v0.1 · Colorado · Built for the Home Screen: share → Add to Home Screen.</p>
        </section>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Clear local data?">
        <p className="prose">This removes your leaf checks, photos, watchlist, and home base from this device. Demo data stays.</p>
        <div className="row" style={{ marginTop: 20, gap: 10 }}>
          <button type="button" className="btn btn--ghost grow" onClick={() => setConfirm(false)}>Keep it</button>
          <button type="button" className="btn btn--ember grow" onClick={() => { clearLocalData(); setConfirm(false); toast('Local data cleared'); }}>Clear</button>
        </div>
      </Sheet>
    </div>
  );
}
