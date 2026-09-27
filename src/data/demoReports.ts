import type { FoliageLocation, FoliageReport, FoliageStatus } from '@/domain/types';
import { estimateFromTypical, statusFromPercent, clampPercent } from '@/domain/foliage';
import { addDays } from '@/domain/dates';

/**
 * Demo reports.
 *
 * These are NOT real observations. They are generated deterministically from
 * the typical-timing model so the app feels alive on any date, and they are
 * always labelled "Demo" in the UI. A real backend would replace this module
 * with remote reports.
 */

const NOTES: Record<FoliageStatus, string[]> = {
  early: [
    'Still mostly green with a few yellow crowns on the sunny side.',
    'Hints of gold at the top of the grove. Give it another week or two.',
    'Green overall. A couple of early trees are turning near the creek.',
    'Not much yet, but the willows are starting to go.',
  ],
  turning: [
    'Most aspens are turning above the trailhead. Lower stands still green.',
    'Good mix of green and gold. Probably a week from peak.',
    'Color is moving fast — noticeably more than a few days ago.',
    'Upper slopes are bright. The valley floor is still catching up.',
    'Patchy but building. South-facing groves are ahead.',
  ],
  peak: [
    'Wall-to-wall gold. This is the week.',
    'Peak. Some orange mixed in with the yellow. Windy afternoons will start knocking leaves down.',
    'Everything is lit up. Arrive early — the pull-offs fill by mid-morning.',
    'Best color I have seen here. A few trees already dropping at the very top.',
    'Full peak from the trailhead to the ridge.',
  ],
  past: [
    'Past peak. Upper groves are bare, lower stands still holding some gold.',
    'Leaves are coming down fast. Still pretty along the creek.',
    'Mostly down up high. Worth it for the lower valley only.',
    'Faded and thinning. Ground is covered in gold instead.',
  ],
};

/** Small deterministic hash for repeatable jitter. */
export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

/** Roughly 60% of locations carry demo reports so some read as "unreported". */
function hasDemoReports(loc: FoliageLocation): boolean {
  return hashString(loc.id) % 10 < 6;
}

export function buildDemoReports(locations: FoliageLocation[], now: Date): FoliageReport[] {
  const out: FoliageReport[] = [];
  for (const loc of locations) {
    if (!hasDemoReports(loc)) continue;
    const h = hashString(loc.id);
    const count = 1 + (h % 3); // 1–3 reports
    for (let i = 0; i < count; i++) {
      const daysAgo = i === 0 ? (h >>> 3) % 4 : 3 + i * 3 + ((h >>> (4 + i)) % 3);
      // Always strictly in the past: back off by whole days plus a few hours.
      const observed = new Date(addDays(now, -daysAgo).getTime() - (1 + ((h >>> (6 + i)) % 6)) * 3_600_000 - ((h >>> (9 + i)) % 60) * 60_000);
      const est = estimateFromTypical(loc.typical, observed);
      // Skip reports that would fall outside of any visible color window.
      if (est.colorPercent < 3 && est.status === 'early' && est.daysToPeak > 40) continue;
      const jitter = (((h >>> (10 + i)) % 13) - 6);
      const pct = clampPercent(est.colorPercent + jitter);
      const status: FoliageStatus = est.status === 'past' ? 'past' : statusFromPercent(pct);
      const notes = NOTES[status];
      const note = notes[(h >>> (2 + i)) % notes.length];
      out.push({
        id: `demo-${loc.id}-${i}`,
        locationId: loc.id,
        observedAt: observed.toISOString(),
        colorPercent: pct,
        status,
        note,
        source: 'demo',
      });
    }
  }
  return out;
}
