'use client';

import { Bot, Bookmark, CalendarDays, CheckSquare, MessageSquare, SunMedium } from 'lucide-react';
import type { Tab } from '../types';

const tabs = [
  ['Today', SunMedium],
  ['Agents', Bot],
  ['Work', CheckSquare],
  ['Time', CalendarDays],
  ['Chats', MessageSquare],
  ['Saved', Bookmark],
] as const;

export function LibraryTabs({
  activeTab,
  onChange,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <section className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max min-w-full gap-[8px] pb-1">
        {tabs.map(([id, Icon]) => {
          const active = activeTab === id;

          return (
            <button
              key={id}
              onClick={() => onChange(id as Tab)}
              className={[
                'flex shrink-0 items-center gap-1.5 rounded-full border px-[14px] py-[8px] text-[13px] font-semibold transition',
                active
                  ? 'border-[#161616] bg-[#161616] text-white'
                  : 'border-black/[0.075] bg-white text-[#5F6369]',
              ].join(' ')}
            >
              <Icon className="h-[15px] w-[15px]" />
              {id}
            </button>
          );
        })}
      </div>
    </section>
  );
}
