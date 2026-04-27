'use client';

import { ChevronRight, Gift, Sparkles } from 'lucide-react';
import type { ProPlanData } from '@/app/profile/types';

type ProCardProps = {
  data: ProPlanData;
  onUpgrade: () => void;
  onViewDetails: () => void;
};

function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 44;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative h-[96px] w-[96px]">
      <svg className="h-[96px] w-[96px] -rotate-90" viewBox={`0 0 ${radius * 2} ${radius * 2}`} role="img" aria-label={`${percentage}% credits used`}>
        <circle stroke="#ece8e5" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
        <circle
          stroke="url(#pro-gradient)"
          fill="transparent"
          strokeLinecap="round"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <defs>
          <linearGradient id="pro-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffb569" />
            <stop offset="100%" stopColor="#a96d50" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[16px] font-semibold tracking-[-0.03em] text-[#161616]">
        {percentage}%
      </span>
    </div>
  );
}

export function ProCard({ data, onUpgrade, onViewDetails }: ProCardProps) {
  const usagePercent = Math.round((data.creditsUsed / data.creditsLimit) * 100);
  const remaining = Math.max(data.creditsLimit - data.creditsUsed, 0);

  return (
    <section className="overflow-hidden rounded-[26px] border border-[#f1e8e2] bg-[linear-gradient(160deg,#fffdfc_0%,#faf6f2_100%)] shadow-[0_18px_36px_rgba(37,23,14,0.08)]">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[41px] font-semibold tracking-[-0.04em] text-[#191919] md:text-[32px]"><span aria-hidden>♕</span>{data.title}</p>
            <p className="mt-1 text-[15px] text-[#313131]">Renews on {data.renewsOn}</p>
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            className="inline-flex items-center gap-2 rounded-full bg-[radial-gradient(circle_at_10%_20%,#232936,#0f1219_66%)] px-5 py-2.5 text-[15px] font-semibold text-white shadow-[0_10px_20px_rgba(15,18,25,0.28)] transition active:scale-95"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2} />
            Upgrade
          </button>
        </div>

        <div className="mt-5 flex items-center gap-4">
          <CircularProgress percentage={usagePercent} />
          <div className="min-w-0 flex-1">
            <p className="text-[17px] font-semibold tracking-[-0.03em] text-[#191919]">Credits</p>
            <p className="mt-1 text-[37px] font-semibold leading-none tracking-[-0.04em] text-[#111827] md:text-[28px]">
              {data.creditsUsed}
              <span className="text-[17px] font-medium text-[#7b7b7a]"> / {data.creditsLimit.toLocaleString()}</span>
            </p>
            <div className="mt-3 h-2 rounded-full bg-[#ddd9d6]">
              <div className="h-full rounded-full bg-[#111827]" style={{ width: `${usagePercent}%` }} />
            </div>
            <p className="mt-2 text-[15px] text-[#737373]">{remaining} credits remaining</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onViewDetails}
        className="flex w-full items-center justify-between border-t border-black/[0.06] bg-white/60 px-5 py-4 text-left transition active:bg-black/[0.02]"
      >
        <span className="inline-flex items-center gap-3 text-[17px] font-medium text-[#1e1e1e]"><Gift className="h-5 w-5" />View plan details</span>
        <ChevronRight className="h-5 w-5 text-[#7c7c7c]" />
      </button>
    </section>
  );
}
