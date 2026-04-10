import { ArrowUpRight } from 'lucide-react';
import type { DashboardInsight } from './types';

type ProactiveInsightsProps = {
  insights: DashboardInsight[];
  onOpenInsight: (insight: DashboardInsight) => void;
};

export function ProactiveInsights({ insights, onOpenInsight }: ProactiveInsightsProps) {
  return (
    <section className="dashboard-reveal space-y-2">
      <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-secondary">Proactive insights</h2>
      {insights.map((insight) => (
        <button
          key={insight.id}
          type="button"
          onClick={() => onOpenInsight(insight)}
          className="card-interactive w-full rounded-2xl bg-[#f7f7f7] p-4 text-left"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">{insight.title}</p>
              <p className="mt-1 text-xs text-secondary">{insight.detail}</p>
            </div>
            <ArrowUpRight className="mt-0.5 h-4 w-4 text-secondary" />
          </div>
        </button>
      ))}
    </section>
  );
}
