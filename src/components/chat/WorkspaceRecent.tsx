'use client';

import { CalendarDays, ChevronRight, Mail, Wallet, Sparkles } from 'lucide-react';

type RecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';

type WorkspaceRecentProps = {
  onSelect: (id: RecentId) => void;
};

const items = [
  { id: 'gmail-sync' as const, label: 'Gmail sync', meta: '2 min ago', icon: Mail },
  { id: 'subscription-scan' as const, label: 'Subscription scan', meta: '1h ago', icon: Wallet },
  { id: 'weekly-planner' as const, label: 'Weekly planner', meta: 'Yesterday', icon: CalendarDays },
  { id: 'weekly-planner' as const, label: 'Agent recap', meta: 'Last night', icon: Sparkles },
];

export function WorkspaceRecent({ onSelect }: WorkspaceRecentProps) {
  return (
    <section>
      <h3 className="mb-3 text-[15px] font-semibold uppercase tracking-[0.08em] text-[#6f7786]">Recent</h3>
      <div className="overflow-hidden rounded-[24px] border border-[#dee3ec] bg-[#fafcff] shadow-[0_12px_28px_rgba(72,80,96,0.08)]">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={`${item.label}-${index}`}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex min-h-[64px] w-full items-center justify-between px-4 py-3 text-left ${index !== items.length - 1 ? 'border-b border-[#e8ecf2]' : ''}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e1e6ef] bg-white text-[#5e6674] shadow-[0_2px_8px_rgba(75,84,99,0.08)]">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span>
                  <span className="block text-[15px] font-medium text-[#313847]">{item.label}</span>
                  <span className="text-xs text-[#8c95a5]">{item.meta}</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#9099a7]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
