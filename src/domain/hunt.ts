import type { LocationView } from './filters';
import { ACTIVITY_META } from './filters';
import type { Activity } from './types';
import { formatDrive } from './geo';
import { formatUntil } from './dates';

export type TimeBudget = '2h' | 'half' | 'full' | 'weekend';

export const TIME_BUDGET_META: Record<TimeBudget, { label: string; sub: string; phrase: string; maxOneWayMinutes: number }> = {
  '2h': { label: '2 hours', sub: 'A quick escape', phrase: '2-hour window', maxOneWayMinutes: 45 },
  half: { label: 'Half a day', sub: 'Morning or afternoon', phrase: 'half day', maxOneWayMinutes: 95 },
  full: { label: 'A full day', sub: 'Sunrise to sunset', phrase: 'full day', maxOneWayMinutes: 200 },
  weekend: { label: 'A weekend', sub: 'Go far', phrase: 'weekend', maxOneWayMinutes: Infinity },
};

export interface HuntMatch {
  view: LocationView;
  /** Plain-language reasons this destination fits the constraints. */
  reasons: string[];
  /** Internal relevance used to pick a small set. Not a "best" ranking. */
  fit: number;
}

export interface HuntInput {
  budget: TimeBudget;
  activities: Activity[];
  now: Date;
  limit?: number;
}

/**
 * Produce a small set of destinations that fit the time budget and preferences,
 * with a plain-language explanation of why each fits. Locations past peak or
 * still fully green are de-emphasized but not hidden if nothing else fits.
 */
export function hunt(views: LocationView[], input: HuntInput): HuntMatch[] {
  const budget = TIME_BUDGET_META[input.budget];
  const limit = input.limit ?? 5;
  const withinTime = views.filter((v) => v.driveMinutes <= budget.maxOneWayMinutes);

  const scored: HuntMatch[] = withinTime.map((view) => {
    const reasons: string[] = [];
    let fit = 0;
    const c = view.condition;

    // Color state.
    if (c.status === 'peak') {
      fit += 40;
      reasons.push(c.basis === 'report' ? 'A recent report puts it at peak color.' : 'Typical timing puts it at peak color right now.');
    } else if (c.timing === 'peak-soon') {
      fit += 30;
      reasons.push(`Peak conditions are estimated to arrive ${formatUntil(c.estimatedPeakStart, input.now)}.`);
    } else if (c.status === 'turning') {
      fit += 18;
      reasons.push(`Color is building — about ${c.colorPercent}% turned by the latest estimate.`);
    } else if (c.status === 'past' && c.timing === 'fading') {
      fit += 6;
      reasons.push('Past peak, but some color is still holding on.');
    } else if (c.status === 'early') {
      fit += 4;
      reasons.push('Still mostly green. Better as a scouting trip.');
    }

    // Time fit.
    const oneWay = view.driveMinutes;
    if (input.budget === 'weekend') {
      reasons.push(`About ${formatDrive(oneWay)} each way — an easy overnight.`);
      fit += 5;
    } else {
      const slack = budget.maxOneWayMinutes - oneWay;
      fit += Math.max(0, Math.min(15, slack / 6));
      const stop = view.location.visitMinutes;
      const total = oneWay * 2 + stop;
      reasons.push(
        `Fits your ${budget.phrase}: about ${formatDrive(oneWay)} each way plus ${formatDrive(stop)} on the ground (${formatDrive(total)} total).`,
      );
    }

    // Activities.
    if (input.activities.length) {
      const matched = input.activities.filter((a) => view.location.activities.includes(a));
      const missing = input.activities.filter((a) => !view.location.activities.includes(a));
      fit += matched.length * 8 - missing.length * 12;
      if (matched.length) {
        reasons.push(`Matches ${listify(matched.map((a) => ACTIVITY_META[a].label.toLowerCase()))}.`);
      }
      if (missing.length) {
        reasons.push(`Heads up: not known for ${listify(missing.map((a) => ACTIVITY_META[a].label.toLowerCase()))}.`);
      }
    }

    // Fresh reports add confidence.
    if (c.basis === 'report') fit += c.confidence === 'high' ? 6 : 3;

    return { view, reasons, fit };
  });

  // Prefer full activity matches when any activities were chosen.
  const fullMatches = input.activities.length
    ? scored.filter((m) => input.activities.every((a) => m.view.location.activities.includes(a)))
    : scored;
  const pool = fullMatches.length >= Math.min(3, scored.length) ? fullMatches : scored;

  return pool
    .sort((a, b) => b.fit - a.fit || a.view.driveMinutes - b.view.driveMinutes)
    .slice(0, limit);
}

export function listify(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
