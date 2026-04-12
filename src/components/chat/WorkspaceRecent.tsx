'use client';

import { CalendarDays, ChevronRight, Mail, Wallet } from 'lucide-react';

type RecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';

type WorkspaceRecentProps = {
  onSelect: (id: RecentId) => void;
};

const items = [
  { id: 'gmail-sync' as const, label: 'Gmail sync', meta: '2 min ago', icon: Mail },
  { id: 'subscription-scan' as const, label: 'Subscription scan', meta: '1h ago', icon: Wallet },
  { id: 'weekly-planner' as const, label: 'Weekly planner', meta: 'Yesterday', icon: CalendarDays },
];

export function WorkspaceRecent({ onSelect }: WorkspaceRecentProps) {
  return (
    <section>
      <h3 className="mb-3 text-[17px] font-semibold text-[#4a5160]">Recent</h3>
      <div className="overflow-hidden rounded-[22px] border border-[#e0e4ea] bg-[#fbfcfe] shadow-[0_6px_18px_rgba(80,87,101,0.05)]">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-center justify-between px-3 py-3 text-left ${index !== items.length - 1 ? 'border-b border-[#e7e9ee]' : ''}`}
            >
              <span className="inline-flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e1e5eb] bg-[#f2f5fa] text-[#5f6675]">
                  <Icon className="h-[17px] w-[17px]" />
                </span>
                <span>
                  <span className="block text-[16px] text-[#2f3642]">{item.label}</span>
                  <span className="text-xs text-[#8a919d]">{item.meta}</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-[#89909c]" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
