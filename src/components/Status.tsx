import { STATUS_META, type Condition } from '@/domain/foliage';
import type { FoliageStatus } from '@/domain/types';

export function StatusPill({ status, large, label }: { status: FoliageStatus; large?: boolean; label?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={`pill pill--${status}${large ? ' pill--lg' : ''}`}>
      <span aria-hidden="true">{meta.glyph}</span>
      <span>{label ?? meta.label}</span>
    </span>
  );
}

export function ColorMeter({ percent, status, showValue = true, label }: { percent: number; status: FoliageStatus; showValue?: boolean; label?: string }) {
  return (
    <div className="meter" role="img" aria-label={label ?? `${percent}% color, ${STATUS_META[status].label}`}>
      <div className="meter__track">
        <div className={`meter__fill meter__fill--${status}`} style={{ width: `${percent}%` }} />
      </div>
      {showValue && <span className="meter__value tnum" aria-hidden="true">{percent}%</span>}
    </div>
  );
}

export function ConfidenceLabel({ condition }: { condition: Condition }) {
  const map = { high: 'High confidence', medium: 'Medium confidence', low: 'Estimate' } as const;
  return <span>{condition.basis === 'report' ? map[condition.confidence] : 'Estimate from typical timing'}</span>;
}

export function SourcePill({ source }: { source: 'demo' | 'local' | 'remote' }) {
  if (source === 'demo') return <span className="pill pill--demo">Demo</span>;
  if (source === 'local') return <span className="pill pill--local">Your report · on this device</span>;
  return <span className="pill pill--neutral">Community</span>;
}
