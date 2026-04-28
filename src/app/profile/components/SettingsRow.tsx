'use client';

import { ChevronRight } from 'lucide-react';
import type { SettingsItem } from '@/app/profile/types';
import { haptic } from '@/lib/haptics';

type SettingsRowProps = {
  item: SettingsItem;
  onPress: (route: string) => void;
  isLast: boolean;
};

export function SettingsRow({ item, onPress, isLast }: SettingsRowProps) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => {
        haptic.light();
        onPress(item.route);
      }}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-black/[0.03] ${!isLast ? 'border-b border-black/[0.06]' : ''}`}
    >
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f8f8f7] text-[#1f1f1f]">
        <Icon className="h-5 w-5" strokeWidth={1.9} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[18px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#171717]">{item.title}</span>
        <span className="block truncate pt-1 text-[14px] text-[#717171]">{item.subtitle}</span>
      </span>

      <span className="flex items-center gap-2">
        {item.value ? <span className="text-[14px] text-[#7a7a79]">{item.value}</span> : null}
        <ChevronRight className="h-5 w-5 shrink-0 text-[#8f8f8f]" strokeWidth={2} />
      </span>
    </button>
  );
}
