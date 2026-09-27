import type { Headline as HeadlineModel } from '@/domain/season';
import type { DatasetStats } from '@/domain/season';

export function HeadlineBanner({ headline, stats, active, compact }: { headline: HeadlineModel; stats: DatasetStats; active: boolean; compact?: boolean }) {
  return (
    <section className={`headline headline--${headline.tone}${compact ? ' headline--compact' : ''}`} aria-labelledby="headline-title">
      <div className="headline__glyph" aria-hidden="true">{headline.glyph}</div>
      <h2 id="headline-title" className="headline__title">{headline.title}</h2>
      <p className="headline__detail">{headline.detail}</p>
      {active && (
        <div className="headline__meta" aria-label="Spots by status">
          {stats.peak > 0 && <span className="headline__stat">🟠 {stats.peak} at peak</span>}
          {!compact && stats.turning > 0 && <span className="headline__stat">🟡 {stats.turning} turning</span>}
          {compact && stats.peak === 0 && stats.turning > 0 && <span className="headline__stat">🟡 {stats.turning} turning</span>}
          {!compact && stats.early > 0 && <span className="headline__stat">🌿 {stats.early} early</span>}
          {!compact && stats.past > 0 && <span className="headline__stat">🔴 {stats.past} past</span>}
        </div>
      )}
      <svg className="headline__art" viewBox="0 0 190 120" aria-hidden="true">
        <path d="M0 120 40 60l25 30 30-50 35 45 30-35 30 50v20Z" fill="#fff" />
        <path d="M60 120 90 85l25 20 25-40 30 40 20 15Z" fill="#fff" opacity="0.6" />
      </svg>
    </section>
  );
}
