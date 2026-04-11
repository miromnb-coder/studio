import { Sparkles } from 'lucide-react';

type DashboardHeroProps = {
  monthlySavings: number;
  monthlyCost: number;
  activeSubscriptions: number;
  loading: boolean;
};

export function DashboardHero({ monthlySavings, monthlyCost, activeSubscriptions, loading }: DashboardHeroProps) {
  return (
    <section className="card-elevated dashboard-reveal dashboard-hero-glow relative overflow-hidden p-5">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/30 blur-2xl" aria-hidden />
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.12em] text-secondary">
        <Sparkles className="h-3.5 w-3.5" />
        Financial control center
      </div>
      <p className="text-xs font-medium text-secondary">Potential monthly savings</p>
      <p className="mt-1 text-[2.3rem] font-semibold tracking-tight text-primary">
        {loading ? '…' : `$${Math.round(monthlySavings)}`}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-secondary">Current monthly cost</p>
          <p className="mt-1 text-lg font-semibold text-primary">{loading ? '…' : `$${Math.round(monthlyCost)}`}</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-secondary">Active subscriptions</p>
          <p className="mt-1 text-lg font-semibold text-primary">{loading ? '…' : activeSubscriptions}</p>
        </div>
      </div>
    </section>
  );
}
