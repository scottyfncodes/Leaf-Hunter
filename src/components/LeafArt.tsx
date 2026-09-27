import { hashString } from '@/data/demoReports';
import type { FoliageStatus } from '@/domain/types';

const STATUS_FOLIAGE: Record<FoliageStatus, [string, string, string]> = {
  early: ['#5c9a66', '#7fb783', '#a8cf9e'],
  turning: ['#7fa662', '#d9b64a', '#f0d36a'],
  peak: ['#e2b53b', '#e2782d', '#f4c85a'],
  past: ['#b8703a', '#8f4a2a', '#c9a071'],
};

/**
 * Generated placeholder art: a small mountain scene whose ridgelines vary by
 * location and whose aspen colors follow the current status. Used instead of
 * hotlinked photos for seeded locations.
 */
export function LeafArt({ seed, status, className, title }: { seed: string; status: FoliageStatus; className?: string; title?: string }) {
  const h = hashString(seed);
  const r = (i: number, range: number) => ((h >>> (i * 3)) % 1000) / 1000 * range;
  const [c1, c2, c3] = STATUS_FOLIAGE[status];
  const skyTop = '#e9eef0';
  const skyBottom = '#f6ecd7';
  const far = '#8fa3a8';
  const mid = '#5f7a72';
  const near = '#33503f';

  const ridge = (baseY: number, amp: number, seedOffset: number) => {
    const pts: string[] = ['0,100'];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const x = (i / n) * 160;
      const y = baseY - Math.abs(Math.sin(i * 1.7 + r(seedOffset, 3))) * amp - r(seedOffset + i, amp * 0.4);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    pts.push('160,100');
    return pts.join(' ');
  };

  const trees = Array.from({ length: 14 }, (_, i) => {
    const x = 6 + i * 11 + r(i + 20, 6);
    const hgt = 14 + r(i + 40, 12);
    const color = [c1, c2, c3][i % 3] ?? c1;
    return { x, hgt, color, i };
  });

  const gid = `la-${h % 100000}`;

  return (
    <svg viewBox="0 0 160 100" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={`url(#${gid})`} />
      <circle cx={120 + r(3, 20)} cy={22 + r(4, 8)} r="7" fill="#fff3c4" opacity="0.9" />
      <polygon points={ridge(62, 30, 1)} fill={far} opacity="0.7" />
      <polygon points={ridge(74, 22, 5)} fill={mid} opacity="0.9" />
      <polygon points={ridge(86, 14, 9)} fill={near} />
      {trees.map((t) => (
        <g key={t.i} transform={`translate(${t.x.toFixed(1)} ${100 - t.hgt})`}>
          <rect x="-0.8" y={t.hgt * 0.5} width="1.6" height={t.hgt * 0.5} fill="#e9e4d6" />
          <ellipse cx="0" cy={t.hgt * 0.42} rx={4 + (t.i % 2)} ry={t.hgt * 0.45} fill={t.color} />
        </g>
      ))}
    </svg>
  );
}
