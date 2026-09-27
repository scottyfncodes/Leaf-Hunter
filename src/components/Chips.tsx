import type { ReactNode } from 'react';

export function Chip({ on, onClick, children, tone, count, ariaLabel }: { on: boolean; onClick: () => void; children: ReactNode; tone?: string; count?: number; ariaLabel?: string }) {
  return (
    <button type="button" className={`chip${tone ? ` chip--${tone}` : ''}`} aria-pressed={on} onClick={onClick} aria-label={ariaLabel}>
      {children}
      {count !== undefined && <span className="chip__count">{count}</span>}
    </button>
  );
}

export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className="seg__btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
