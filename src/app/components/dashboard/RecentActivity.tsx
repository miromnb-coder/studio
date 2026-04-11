import type { RecentActivityItem } from './types';

type RecentActivityProps = {
  actions: RecentActivityItem[];
};

const formatDate = (iso: string) => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export function RecentActivity({ actions }: RecentActivityProps) {
  return (
    <section className="card-surface dashboard-reveal p-4">
      <h2 className="mb-2 text-base font-semibold text-primary">Recent activity</h2>
      <div className="space-y-2">
        {actions.map((action) => (
          <article key={`${action.title}-${action.date}`} className="rounded-2xl bg-white/[0.04] px-3 py-2.5">
            <p className="text-sm font-medium text-primary">{action.title}</p>
            {action.summary ? <p className="text-xs text-secondary">{action.summary}</p> : null}
            <p className="mt-1 text-[11px] text-secondary">{formatDate(action.date)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
