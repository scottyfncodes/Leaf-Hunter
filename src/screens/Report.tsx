import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@/state/AppState';
import { STATUS_META, STATUS_ORDER, clampPercent, statusFromPercent } from '@/domain/foliage';
import type { FoliageStatus } from '@/domain/types';
import { searchLocations } from '@/domain/search';
import { sortByDistance } from '@/domain/filters';
import { newId } from '@/storage/local';
import { Chip } from '@/components/Chips';
import { SearchBar } from '@/components/SearchBar';
import { useToast } from '@/components/Toast';
import { IconBack, IconCamera, IconInfo } from '@/components/Icons';
import { formatDrive } from '@/domain/geo';

/** Downscale a photo so it fits comfortably in local storage. */
export async function shrinkImage(file: File, maxSide = 900, quality = 0.8): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not read image'));
      i.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No canvas');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ReportScreen() {
  const { views, addReport, now } = useApp();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const [spotId, setSpotId] = useState<string>(params.get('spot') ?? '');
  const [query, setQuery] = useState('');
  const [percent, setPercent] = useState(60);
  const [statusOverride, setStatusOverride] = useState<FoliageStatus | null>(null);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status: FoliageStatus = statusOverride ?? statusFromPercent(percent);

  const candidates = useMemo(() => {
    const nearest = sortByDistance(views);
    if (!query.trim()) return nearest.slice(0, 6);
    const ids = new Set(searchLocations(views.map((v) => v.location), query).map((l) => l.id));
    return nearest.filter((v) => ids.has(v.location.id)).slice(0, 8);
  }, [views, query]);

  const spot = views.find((v) => v.location.id === spotId);

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    setPhotoBusy(true);
    setError(null);
    try {
      const dataUrl = await shrinkImage(file);
      if (dataUrl.length > 1_500_000) {
        setError('That photo is too large to keep on the device. Try a smaller one.');
      } else {
        setPhoto(dataUrl);
      }
    } catch {
      setError('Could not read that photo.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!spot) {
      setError('Pick a spot first.');
      return;
    }
    addReport({
      id: newId('report'),
      locationId: spot.location.id,
      observedAt: now.toISOString(),
      colorPercent: clampPercent(percent),
      status,
      note: note.trim() || undefined,
      photo,
      source: 'local',
    });
    toast(`Leaf check saved for ${spot.location.name}`);
    nav(`/spot/${spot.location.id}`, { replace: true });
  };

  return (
    <div className="screen">
      <div className="topbar" style={{ margin: '0 calc(-1 * var(--gutter))' }}>
        <div className="topbar__inner">
          <button type="button" className="icon-btn" onClick={() => nav(-1)} aria-label="Back"><IconBack /></button>
          <h1 className="topbar__title">Leaf check</h1>
        </div>
      </div>

      <form className="stack-l" style={{ paddingTop: 8, paddingBottom: 32 }} onSubmit={submit} noValidate>
        <section className="section" aria-labelledby="where" style={{ paddingTop: 8 }}>
          <h2 id="where" className="eyebrow" style={{ marginBottom: 10 }}>1 · Where are you?</h2>
          {spot ? (
            <div className="card row row--between" style={{ padding: '12px 14px' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{spot.location.name}</div>
                <div className="small muted">{spot.location.area} · {formatDrive(spot.driveMinutes)} away</div>
              </div>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSpotId('')}>Change</button>
            </div>
          ) : (
            <div className="stack">
              <SearchBar value={query} onChange={setQuery} placeholder="Search a spot" />
              <div className="small muted">{query ? 'Matches' : 'Nearest to you'}</div>
              <div className="menu" role="listbox" aria-label="Choose a spot">
                {candidates.map((v) => (
                  <button key={v.location.id} type="button" role="option" aria-selected={false} className="menu__item" onClick={() => setSpotId(v.location.id)}>
                    <div className="grow">
                      <div className="menu__label">{v.location.name}</div>
                      <div className="menu__sub">{v.location.area} · {formatDrive(v.driveMinutes)}</div>
                    </div>
                    <span className="pill pill--neutral">{v.condition.colorPercent}%</span>
                  </button>
                ))}
                {!candidates.length && <div className="menu__item"><span className="muted">No spot matches that.</span></div>}
              </div>
            </div>
          )}
        </section>

        <section className="section" aria-labelledby="how-much">
          <h2 id="how-much" className="eyebrow" style={{ marginBottom: 10 }}>2 · How much color?</h2>
          <div className="card" style={{ padding: '14px 16px 8px' }}>
            <div className="pct-display">
              <span className="pct-display__num tnum" aria-hidden="true">{percent}%</span>
              <span className={`pill pill--${status} pill--lg`}><span aria-hidden="true">{STATUS_META[status].glyph}</span> {STATUS_META[status].label}</span>
            </div>
            <label className="field">
              <span className="sr-only">Percent of trees showing color</span>
              <input type="range" className="range" min={0} max={100} step={5} value={percent} onChange={(e) => { setPercent(Number(e.target.value)); setStatusOverride(null); }} aria-valuetext={`${percent} percent color, ${STATUS_META[status].label}`} />
            </label>
            <div className="chips" style={{ paddingBottom: 6 }} aria-label="Status">
              {STATUS_ORDER.map((s) => (
                <Chip key={s} tone={s} on={status === s} onClick={() => {
                  setStatusOverride(s);
                  if (s === 'early' && percent >= 25) setPercent(15);
                  if (s === 'turning' && (percent < 25 || percent >= 70)) setPercent(50);
                  if (s === 'peak' && percent < 70) setPercent(90);
                }}>
                  <span aria-hidden="true">{STATUS_META[s].glyph}</span> {STATUS_META[s].label}
                </Chip>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="extras">
          <h2 id="extras" className="eyebrow" style={{ marginBottom: 10 }}>3 · Anything else? <span className="muted" style={{ fontWeight: 500, letterSpacing: 0, textTransform: 'none' }}>(optional)</span></h2>
          <div className="stack">
            <label className="field">
              <span className="field__label">Note</span>
              <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value.slice(0, 240))} placeholder="Most aspens are turning above the trailhead…" rows={2} maxLength={240} />
            </label>
            <div className="photo-pick">
              {photo ? <img className="photo-pick__thumb" src={photo} alt="Your selected photo" /> : <div className="photo-pick__thumb" aria-hidden="true" />}
              <label className="btn btn--ghost btn--sm file-btn" aria-busy={photoBusy}>
                <IconCamera width={18} height={18} /> {photo ? 'Replace photo' : photoBusy ? 'Reading…' : 'Add photo'}
                <input type="file" accept="image/*" capture="environment" onChange={(e) => void onPhoto(e.target.files?.[0])} aria-label="Add a photo" />
              </label>
              {photo && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setPhoto(undefined)}>Remove</button>}
            </div>
          </div>
        </section>

        {error && <p className="notice notice--warn" role="alert">{error}</p>}

        <button type="submit" className="btn btn--ember btn--block" disabled={!spot}>Save leaf check</button>
        <div className="notice">
          <IconInfo />
          <span>Leaf checks are saved on this device only. No account, no upload. A future version can sync them to a shared feed.</span>
        </div>
      </form>
    </div>
  );
}
