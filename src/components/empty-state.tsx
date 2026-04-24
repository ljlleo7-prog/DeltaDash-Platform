import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <section className="dd-panel">
      <div className="max-w-3xl">
        <h3 className="font-[var(--font-heading)] text-xl uppercase tracking-[0.08em] text-[var(--accent-highlight)]">{title}</h3>
        <p className="dd-copy mt-3 text-sm">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </section>
  );
}
