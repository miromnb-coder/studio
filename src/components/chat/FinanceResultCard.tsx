'use client';

import { useMemo, useState } from 'react';

type Confidence = 'low' | 'medium' | 'high';
type LeakPeriod = 'monthly' | 'yearly' | 'one-time' | 'unknown';
type LeakType =
  | 'subscription'
  | 'duplicate'
  | 'fee'
  | 'trial'
  | 'price_increase'
  | 'waste'
  | 'unknown';
type LeakAction = 'cancel' | 'review' | 'downgrade' | 'consolidate' | 'monitor';
type Urgency = 'low' | 'medium' | 'high';

export type FinanceLeak = {
  merchant: string;
  amount: number | null;
  currency?: string | null;
  period: LeakPeriod;
  type: LeakType;
  reason: string;
  action: LeakAction;
  urgency?: Urgency;
};

export type FinanceStructuredData = {
  summary?: string;
  estimatedMonthlySavings?: number | null;
  currency?: string | null;
  confidence?: Confidence;
  leaks?: FinanceLeak[];
  recommendations?: string[];
};

type FinanceResultCardProps = {
  data: FinanceStructuredData;
  className?: string;
};

function formatMoney(amount: number | null | undefined, currency?: string | null) {
  if (amount == null || Number.isNaN(amount)) return 'Unknown';

  const normalizedCurrency = currency?.trim() || 'EUR';

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${normalizedCurrency}`;
  }
}

function formatPeriod(period: LeakPeriod) {
  switch (period) {
    case 'monthly':
      return '/mo';
    case 'yearly':
      return '/yr';
    case 'one-time':
      return 'one-time';
    default:
      return 'unknown';
  }
}

function labelForType(type: LeakType) {
  switch (type) {
    case 'subscription':
      return 'Subscription';
    case 'duplicate':
      return 'Duplicate';
    case 'fee':
      return 'Fee';
    case 'trial':
      return 'Trial';
    case 'price_increase':
      return 'Price increase';
    case 'waste':
      return 'Waste';
    default:
      return 'Unknown';
  }
}

function labelForAction(action: LeakAction) {
  switch (action) {
    case 'cancel':
      return 'Cancel';
    case 'review':
      return 'Review';
    case 'downgrade':
      return 'Downgrade';
    case 'consolidate':
      return 'Consolidate';
    case 'monitor':
      return 'Monitor';
    default:
      return action;
  }
}

function labelForConfidence(confidence?: Confidence) {
  switch (confidence) {
    case 'high':
      return 'High confidence';
    case 'medium':
      return 'Medium confidence';
    case 'low':
      return 'Low confidence';
    default:
      return 'Confidence unknown';
  }
}

function labelForUrgency(urgency?: Urgency) {
  switch (urgency) {
    case 'high':
      return 'High urgency';
    case 'medium':
      return 'Medium urgency';
    case 'low':
      return 'Low urgency';
    default:
      return null;
  }
}

function badgeClasses(kind: 'neutral' | 'success' | 'warning' | 'danger') {
  switch (kind) {
    case 'success':
      return 'border-emerald-200/80 bg-emerald-50/80 text-emerald-700';
    case 'warning':
      return 'border-amber-200/80 bg-amber-50/80 text-amber-700';
    case 'danger':
      return 'border-rose-200/80 bg-rose-50/80 text-rose-700';
    default:
      return 'border-slate-200/80 bg-white/70 text-slate-600';
  }
}

function typeBadgeKind(type: LeakType): 'neutral' | 'success' | 'warning' | 'danger' {
  switch (type) {
    case 'duplicate':
    case 'price_increase':
      return 'danger';
    case 'trial':
    case 'fee':
      return 'warning';
    case 'waste':
    case 'subscription':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function urgencyBadgeKind(urgency?: Urgency): 'neutral' | 'success' | 'warning' | 'danger' {
  switch (urgency) {
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'success';
    default:
      return 'neutral';
  }
}

function confidenceBadgeKind(confidence?: Confidence): 'neutral' | 'success' | 'warning' | 'danger' {
  switch (confidence) {
    case 'high':
      return 'success';
    case 'medium':
      return 'warning';
    case 'low':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function getEstimatedMonthlySavings(data: FinanceStructuredData) {
  if (typeof data.estimatedMonthlySavings === 'number') {
    return data.estimatedMonthlySavings;
  }

  const leaks = data.leaks || [];
  return leaks.reduce((sum, leak) => {
    if (typeof leak.amount !== 'number') return sum;
    if (leak.period === 'monthly') return sum + leak.amount;
    if (leak.period === 'yearly') return sum + leak.amount / 12;
    return sum;
  }, 0);
}

function sortLeaks(leaks: FinanceLeak[]) {
  const urgencyScore = (urgency?: Urgency) => {
    if (urgency === 'high') return 3;
    if (urgency === 'medium') return 2;
    if (urgency === 'low') return 1;
    return 0;
  };

  return [...leaks].sort((a, b) => {
    const urgencyDiff = urgencyScore(b.urgency) - urgencyScore(a.urgency);
    if (urgencyDiff !== 0) return urgencyDiff;

    const amountA = typeof a.amount === 'number' ? a.amount : 0;
    const amountB = typeof b.amount === 'number' ? b.amount : 0;
    return amountB - amountA;
  });
}

export default function FinanceResultCard({
  data,
  className = '',
}: FinanceResultCardProps) {
  const [expanded, setExpanded] = useState(false);

  const leaks = useMemo(() => sortLeaks(data.leaks || []), [data.leaks]);
  const leakCount = leaks.length;
  const currency = data.currency || leaks.find((item) => item.currency)?.currency || 'EUR';
  const estimatedMonthlySavings = getEstimatedMonthlySavings(data);
  const displayedLeaks = expanded ? leaks : leaks.slice(0, 3);

  return (
    <section
      className={[
        'overflow-hidden rounded-[24px] border border-white/60 bg-white/75 shadow-[0_12px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl',
        className,
      ].join(' ')}
    >
      <div className="border-b border-slate-200/70 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.95),_rgba(244,247,251,0.88)_55%,_rgba(238,243,249,0.84))] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Financial Opportunities
            </p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">
              Potential savings surfaced by the agent
            </h3>
            {data.summary ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {data.summary}
              </p>
            ) : null}
          </div>

          <span
            className={[
              'shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium',
              badgeClasses(confidenceBadgeKind(data.confidence)),
            ].join(' ')}
          >
            {labelForConfidence(data.confidence)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Estimated monthly savings</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {formatMoney(estimatedMonthlySavings, currency)}
              <span className="ml-1 text-sm font-medium text-slate-500">/mo</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Leaks detected</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
              {leakCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">Next best move</p>
            <p className="mt-2 text-sm font-medium leading-6 text-slate-800">
              {leaks[0] ? `${labelForAction(leaks[0].action)} ${leaks[0].merchant}` : 'Review findings'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-sm font-semibold text-slate-900">Top findings</h4>
          {leakCount > 3 ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {expanded ? 'Show less' : `Show all (${leakCount})`}
            </button>
          ) : null}
        </div>

        {displayedLeaks.length > 0 ? (
          <div className="mt-3 space-y-3">
            {displayedLeaks.map((leak, index) => (
              <article
                key={`${leak.merchant}-${leak.type}-${index}`}
                className="rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.86))] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h5 className="truncate text-sm font-semibold text-slate-900">
                        {leak.merchant || 'Unknown merchant'}
                      </h5>

                      <span
                        className={[
                          'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          badgeClasses(typeBadgeKind(leak.type)),
                        ].join(' ')}
                      >
                        {labelForType(leak.type)}
                      </span>

                      <span className="rounded-full border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                        {formatPeriod(leak.period)}
                      </span>

                      {labelForUrgency(leak.urgency) ? (
                        <span
                          className={[
                            'rounded-full border px-2 py-0.5 text-[10px] font-medium',
                            badgeClasses(urgencyBadgeKind(leak.urgency)),
                          ].join(' ')}
                        >
                          {labelForUrgency(leak.urgency)}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {leak.reason}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-950">
                      {formatMoney(leak.amount, leak.currency || currency)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatPeriod(leak.period)}</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">
                    Recommended action
                  </span>
                  <span className="rounded-full border border-sky-200/80 bg-sky-50/80 px-2.5 py-1 text-xs font-medium text-sky-700">
                    {labelForAction(leak.action)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-500">
            No clear financial leaks were detected in this run.
          </div>
        )}

        {data.recommendations && data.recommendations.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white/70 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-slate-900">Recommended next steps</h4>
            <ul className="mt-3 space-y-2">
              {data.recommendations.slice(0, 4).map((recommendation, index) => (
                <li key={`${recommendation}-${index}`} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-[6px] h-1.5 w-1.5 rounded-full bg-slate-400" />
                  <span className="leading-6">{recommendation}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
