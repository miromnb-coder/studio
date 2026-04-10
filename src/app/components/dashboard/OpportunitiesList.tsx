import { ArrowUpRight } from 'lucide-react';
import type { OpportunityItem } from './types';

type OpportunitiesListProps = {
  opportunities: OpportunityItem[];
  onOpenOpportunity: (item: OpportunityItem) => void;
};

export function OpportunitiesList({ opportunities, onOpenOpportunity }: OpportunitiesListProps) {
  return (
    <section className="card-surface dashboard-reveal p-4">
      <h2 className="mb-2 text-base font-semibold text-primary">Top opportunities</h2>
      <div className="space-y-2">
        {opportunities.map((item) => (
          <article key={item.id} className="rounded-2xl bg-[#f2f2f2] px-3 py-3">
            <p className="text-sm font-semibold text-primary">{item.title}</p>
            <p className="mt-1 text-xs text-secondary">{item.detail}</p>
            <button
              onClick={() => onOpenOpportunity(item)}
              type="button"
              className="btn-primary mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs"
            >
              Open in chat <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
