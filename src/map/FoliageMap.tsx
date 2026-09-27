import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { LocationView } from '@/domain/filters';
import type { LatLng, RegionMap } from '@/domain/types';
import { STATUS_META } from '@/domain/foliage';
import { blobPath, createProjection, pathFrom } from './projection';
import { IconFit, IconLocate, IconMinus, IconPlus } from '@/components/Icons';
import './map.css';

interface Transform {
  k: number;
  tx: number;
  ty: number;
}

const MIN_K = 1;
const MAX_K = 9;

export interface FoliageMapProps {
  map: RegionMap;
  views: LocationView[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  origin?: LatLng & { name: string };
  onLocate?: () => void;
  locating?: boolean;
  /** Ids to draw as a connected route, in order. */
  routeIds?: string[];
  className?: string;
}

/**
 * A self-contained, offline-friendly trailhead-style map. Terrain and roads
 * are SVG in map units; markers are HTML buttons positioned in screen space so
 * they keep a constant, tappable size at any zoom.
 */
export function FoliageMap({ map, views, selectedId, onSelect, origin, onLocate, locating, routeIds, className }: FoliageMapProps) {
  const proj = useMemo(() => createProjection(map), [map]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 360, h: 300 });
  const [t, setT] = useState<Transform>({ k: 1, tx: 0, ty: 0 });
  const drag = useRef<{ x: number; y: number; tx: number; ty: number; moved: boolean } | null>(null);
  const pinch = useRef<{ d: number; k: number; cx: number; cy: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    setSize({ w: el.clientWidth || 360, h: el.clientHeight || 300 });
    return () => ro.disconnect();
  }, []);

  // Base scale: fit map into the container (meet).
  const s = Math.min(size.w / proj.width, size.h / proj.height);
  const offX = (size.w - proj.width * s) / 2;
  const offY = (size.h - proj.height * s) / 2;

  const toScreen = useCallback(
    (u: number, v: number): [number, number] => [offX + (t.tx + t.k * u) * s, offY + (t.ty + t.k * v) * s],
    [offX, offY, s, t],
  );

  const clamp = useCallback(
    (nt: Transform): Transform => {
      const k = Math.min(MAX_K, Math.max(MIN_K, nt.k));
      // Keep at least 30% of the map in view on each axis.
      const wUnits = proj.width;
      const hUnits = proj.height;
      const minTx = -wUnits * k + wUnits * 0.3;
      const maxTx = wUnits * 0.7;
      const minTy = -hUnits * k + hUnits * 0.3;
      const maxTy = hUnits * 0.7;
      return { k, tx: Math.min(maxTx, Math.max(minTx, nt.tx)), ty: Math.min(maxTy, Math.max(minTy, nt.ty)) };
    },
    [proj],
  );

  const zoomAt = useCallback(
    (factor: number, px: number, py: number) => {
      setT((cur) => {
        const vx = (px - offX) / s;
        const vy = (py - offY) / s;
        const k = Math.min(MAX_K, Math.max(MIN_K, cur.k * factor));
        const f = k / cur.k;
        return clamp({ k, tx: vx - (vx - cur.tx) * f, ty: vy - (vy - cur.ty) * f });
      });
    },
    [offX, offY, s, clamp],
  );

  const zoomCenter = (factor: number) => {
    touched.current = true;
    zoomAt(factor, size.w / 2, size.h / 2);
  };

  /** Fit the view to the current markers (plus origin) with padding. */
  const fitAll = useCallback(() => {
    const pts = views.map((v) => proj.toXY(v.location.longitude, v.location.latitude));
    if (origin) pts.push(proj.toXY(origin.longitude, origin.latitude));
    if (!pts.length || !s) {
      setT({ k: 1, tx: 0, ty: 0 });
      return;
    }
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const pad = 60;
    const minX = Math.min(...xs) - pad;
    const maxX = Math.max(...xs) + pad;
    const minY = Math.min(...ys) - pad;
    const maxY = Math.max(...ys) + pad;
    const bw = Math.max(1, maxX - minX);
    const bh = Math.max(1, maxY - minY);
    const k = Math.min(4, Math.max(1, Math.min(size.w / (bw * s), size.h / (bh * s))));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const tx = (size.w / 2 - offX) / s - k * cx;
    const ty = (size.h / 2 - offY) / s - k * cy;
    setT(clamp({ k, tx, ty }));
  }, [views, origin, proj, s, size, offX, offY, clamp]);

  const touched = useRef(false);
  const fitKey = views.map((v) => v.location.id).join(',') + `|${size.w}x${size.h}`;
  useEffect(() => {
    if (!touched.current) fitAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  const reset = () => {
    touched.current = false;
    fitAll();
  };

  // Pointer handling: drag to pan, two-finger pinch to zoom, wheel to zoom.
  const onPointerDown = (e: React.PointerEvent) => {
    touched.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      drag.current = { x: e.clientX, y: e.clientY, tx: t.tx, ty: t.ty, moved: false };
    } else if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      if (a && b) {
        const rect = wrapRef.current?.getBoundingClientRect();
        pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: t.k, cx: (a.x + b.x) / 2 - (rect?.left ?? 0), cy: (a.y + b.y) / 2 - (rect?.top ?? 0) };
        drag.current = null;
      }
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = Array.from(pointers.current.values());
      if (a && b) {
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const targetK = Math.min(MAX_K, Math.max(MIN_K, (pinch.current.k * d) / pinch.current.d));
        const { cx, cy } = pinch.current;
        setT((cur) => {
          const vx = (cx - offX) / s;
          const vy = (cy - offY) / s;
          const f = targetK / cur.k;
          return clamp({ k: targetK, tx: vx - (vx - cur.tx) * f, ty: vy - (vy - cur.ty) * f });
        });
      }
      return;
    }
    if (drag.current) {
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.current.moved = true;
      const { tx, ty } = drag.current;
      setT((cur) => clamp({ k: cur.k, tx: tx + dx / s, ty: ty + dy / s }));
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) {
      if (drag.current && !drag.current.moved) onSelect(null);
      drag.current = null;
    }
  };
  const onWheel = (e: React.WheelEvent) => {
    touched.current = true;
    const rect = wrapRef.current?.getBoundingClientRect();
    const px = e.clientX - (rect?.left ?? 0);
    const py = e.clientY - (rect?.top ?? 0);
    zoomAt(e.deltaY < 0 ? 1.18 : 1 / 1.18, px, py);
  };

  const showLabels = t.k >= 2.4;
  const showTowns = t.k >= 1.6;
  const unitPerPx = 1 / (s * t.k);

  const outline = useMemo(() => pathFrom(map.outline, proj, true), [map, proj]);
  const ranges = useMemo(() => map.ranges.map((r) => ({ name: r.name, d: blobPath(r.points, proj) })), [map, proj]);
  const roads = useMemo(() => map.roads.map((r) => ({ ...r, d: pathFrom(r.points, proj) })), [map, proj]);

  const route = useMemo(() => {
    if (!routeIds?.length) return null;
    const pts: [number, number][] = [];
    if (origin) pts.push(proj.toXY(origin.longitude, origin.latitude));
    for (const id of routeIds) {
      const v = views.find((x) => x.location.id === id);
      if (v) pts.push(proj.toXY(v.location.longitude, v.location.latitude));
    }
    if (origin) pts.push(proj.toXY(origin.longitude, origin.latitude));
    return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  }, [routeIds, views, origin, proj]);

  const selected = views.find((v) => v.location.id === selectedId) ?? null;

  return (
    <div className={`fmap${className ? ` ${className}` : ''}`} ref={wrapRef}>
      <svg
        className="fmap__svg"
        viewBox={`0 0 ${proj.width} ${proj.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Map of foliage spots. ${views.length} spots shown. Use the list view for a full text description.`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
      >
        <defs>
          <pattern id="fmap-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M50 0H0V50" fill="none" stroke="var(--fmap-grid)" strokeWidth="0.6" />
          </pattern>
          <pattern id="fmap-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0v8" stroke="var(--fmap-hatch)" strokeWidth="1.2" />
          </pattern>
        </defs>
        <g transform={`translate(${t.tx} ${t.ty}) scale(${t.k})`}>
          <rect x={-proj.width} y={-proj.height} width={proj.width * 3} height={proj.height * 3} fill="var(--fmap-outer)" />
          <path d={outline} fill="var(--fmap-land)" />
          <path d={outline} fill="url(#fmap-grid)" opacity="0.7" />
          {ranges.map((r) => (
            <g key={r.name}>
              <path d={r.d} fill="var(--fmap-range)" />
              <path d={r.d} fill="url(#fmap-hatch)" opacity="0.55" />
            </g>
          ))}
          {roads.filter((r) => r.kind === 'highway').map((r) => (
            <path key={r.name} d={r.d} fill="none" stroke="var(--fmap-road)" strokeWidth={2.2 * unitPerPx} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {roads.filter((r) => r.kind === 'interstate').map((r) => (
            <g key={r.name}>
              <path d={r.d} fill="none" stroke="var(--fmap-interstate-edge)" strokeWidth={4.6 * unitPerPx} strokeLinecap="round" strokeLinejoin="round" />
              <path d={r.d} fill="none" stroke="var(--fmap-interstate)" strokeWidth={2.6 * unitPerPx} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          ))}
          {route && (
            <path d={route} fill="none" stroke="var(--fmap-route)" strokeWidth={3.4 * unitPerPx} strokeDasharray={`${9 * unitPerPx} ${7 * unitPerPx}`} strokeLinecap="round" strokeLinejoin="round" />
          )}
          <path d={outline} fill="none" stroke="var(--fmap-border)" strokeWidth={1.6 * unitPerPx} />
          {map.towns
            .filter((tw) => (tw.major || showTowns) && tw.name !== origin?.name)
            .map((tw) => {
              const [x, y] = proj.toXY(tw.longitude, tw.latitude);
              const fs = (tw.major ? 12 : 10.5) * unitPerPx;
              return (
                <g key={tw.name}>
                  <circle cx={x} cy={y} r={(tw.major ? 3.2 : 2.2) * unitPerPx} fill="var(--fmap-town)" />
                  <text x={x + 5 * unitPerPx} y={y - 4 * unitPerPx} fontSize={fs} fontWeight={tw.major ? 700 : 500} fill="var(--fmap-town-text)" fontFamily="var(--font-body)" paintOrder="stroke" stroke="var(--fmap-land)" strokeWidth={3 * unitPerPx} strokeLinejoin="round">
                    {tw.name}
                  </text>
                </g>
              );
            })}
          {ranges.map((r) => {
            const pts = map.ranges.find((x) => x.name === r.name)!.points;
            const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length;
            const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
            const [x, y] = proj.toXY(cx, cy);
            return (
              <text key={r.name} x={x} y={y} fontSize={9.5 * unitPerPx} textAnchor="middle" fill="var(--fmap-range-text)" fontFamily="var(--font-display)" fontWeight={700} letterSpacing={1.5 * unitPerPx} opacity={showTowns ? 0.75 : 0.5}>
                {r.name.toUpperCase()}
              </text>
            );
          })}
        </g>
      </svg>

      {/* Marker layer: HTML buttons in screen space. */}
      <div className="fmap__markers">
        {origin && (() => {
          const [u, v] = proj.toXY(origin.longitude, origin.latitude);
          const [x, y] = toScreen(u, v);
          return (
            <div className="fmap__origin" style={{ transform: `translate(${x}px, ${y}px)` }} aria-label={`Start: ${origin.name}`} role="img">
              <span className="fmap__origin-dot" />
              {showTowns && <span className="fmap__origin-label">{origin.name}</span>}
            </div>
          );
        })()}
        {views.map((v) => {
          const [u, w] = proj.toXY(v.location.longitude, v.location.latitude);
          const [x, y] = toScreen(u, w);
          if (x < -40 || y < -40 || x > size.w + 40 || y > size.h + 40) return null;
          const isSel = v.location.id === selectedId;
          const meta = STATUS_META[v.condition.status];
          const routeIndex = routeIds?.indexOf(v.location.id) ?? -1;
          return (
            <button
              key={v.location.id}
              type="button"
              className={`fmap__marker fmap__marker--${v.condition.status}${isSel ? ' fmap__marker--selected' : ''}${routeIndex >= 0 ? ' fmap__marker--route' : ''}`}
              style={{ transform: `translate(${x}px, ${y}px)`, zIndex: isSel ? 5 : Math.round(y) }}
              onClick={() => onSelect(isSel ? null : v.location.id)}
              aria-label={`${v.location.name}: ${meta.label}, ${v.condition.colorPercent}% color`}
              aria-pressed={isSel}
            >
              <span className="fmap__pin" aria-hidden="true">
                {routeIndex >= 0 ? <span className="fmap__pin-num">{routeIndex + 1}</span> : <span className="fmap__pin-glyph">{meta.glyph}</span>}
              </span>
              {(showLabels || isSel) && (
                <span className="fmap__label" aria-hidden="true">
                  {v.location.name}
                  <b> {v.condition.colorPercent}%</b>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="fmap__controls" role="group" aria-label="Map controls">
        <button type="button" className="fmap__ctl" onClick={() => zoomCenter(1.5)} aria-label="Zoom in"><IconPlus /></button>
        <button type="button" className="fmap__ctl" onClick={() => zoomCenter(1 / 1.5)} aria-label="Zoom out"><IconMinus /></button>
        <button type="button" className="fmap__ctl" onClick={reset} aria-label="Fit all spots"><IconFit /></button>
        {onLocate && (
          <button type="button" className="fmap__ctl" onClick={onLocate} aria-label="Use my location" aria-busy={locating}>
            <IconLocate />
          </button>
        )}
      </div>

      <div className="fmap__legend" aria-hidden="true">
        <span className="fmap__legend-item"><i className="fmap__legend-dot fmap__legend-dot--early" />Early</span>
        <span className="fmap__legend-item"><i className="fmap__legend-dot fmap__legend-dot--turning" />Turning</span>
        <span className="fmap__legend-item"><i className="fmap__legend-dot fmap__legend-dot--peak" />Peak</span>
        <span className="fmap__legend-item"><i className="fmap__legend-dot fmap__legend-dot--past" />Past</span>
      </div>

      {selected && <span className="sr-only" role="status">Selected {selected.location.name}</span>}
    </div>
  );
}
