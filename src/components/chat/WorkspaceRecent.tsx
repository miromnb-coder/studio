'use client';

import {
  CalendarDays,
  ChevronRight,
  Mail,
  Sparkles,
  Wallet,
} from 'lucide-react';

type RecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';

type WorkspaceRecentProps = {
  onSelect: (id: RecentId) => void;
};

const items = [
  {
    id: 'gmail-sync' as const,
    label: 'Gmail sync',
    meta: '2 min ago',
    detail: 'Inbox updates processed',
    icon: Mail,
  },
  {
    id: 'subscription-scan' as const,
    label: 'Subscription scan',
    meta: '1h ago',
    detail: 'Detected recurring changes',
    icon: Wallet,
  },
  {
    id: 'weekly-planner' as const,
    label: 'Weekly planner',
    meta: 'Yesterday',
    detail: 'Plan updated for this week',
    icon: CalendarDays,
  },
  {
    id: 'weekly-planner' as const,
    label: 'Agent recap',
    meta: 'Last night',
    detail: 'Summary generated automatically',
    icon: Sparkles,
  },
];

export function WorkspaceRecent({ onSelect }: WorkspaceRecentProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">
          Recent
        </h3>
        <span className="text-[12px] text-[#9aa3b2]">Latest activity</span>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex min-h-[68px] w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f5f7fb] active:scale-[0.995] ${
                index !== items.length - 1
                  ? 'border-b border-[#e8ecf2]'
                  : ''
              }`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#e2e7ef] bg-white text-[#596171] shadow-[0_3px_8px_rgba(60,68,82,0.06)]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>

                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-[#2f3744]">
                    {item.label}
                  </span>
                  <span className="block truncate text-[12px] text-[#8b93a1]">
                    {item.detail}
                  </span>
                </span>
              </span>

              <span className="ml-3 flex shrink-0 items-center gap-2">
                <span className="text-[11px] text-[#9aa2af]">{item.meta}</span>
                <ChevronRight className="h-4 w-4 text-[#9aa2af]" />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
