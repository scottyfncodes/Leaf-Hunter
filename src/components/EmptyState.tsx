import type { ReactNode } from 'react';

export function EmptyState({ title, body, action, art }: { title: string; body: string; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className="empty" role="status">
      {art ?? (
        <svg className="empty__art" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M32 8c12 6 20 16 20 28 0 8-4 14-8 18-8-6-12-14-12-22 0-9 0-16 0-24Z" />
          <path d="M32 8c-12 6-20 16-20 28 0 8 4 14 8 18 8-6 12-14 12-22 0-9 0-16 0-24Z" />
          <path d="M32 14v40" />
        </svg>
      )}
      <div className="empty__title">{title}</div>
      <p className="empty__body">{body}</p>
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}
