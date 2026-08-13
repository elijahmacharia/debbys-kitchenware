import type { ReactNode } from 'react';

/**
 * Every empty state carries a next action. "No products found" on its own is a
 * dead end; "No products found — clear filters" is a way forward.
 */
export function EmptyState({
  icon, title, description, action,
}: { icon?: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-surface shadow-soft px-6 py-14 text-center">
      {icon ? <div className="mb-3 text-subtle">{icon}</div> : null}
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div> : null}
    </div>
  );
}
