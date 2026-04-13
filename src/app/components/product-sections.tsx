'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';

export function MetricGrid({ items }: { items: Array<{ label: string; value: string; detail: string }> }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <div key={item.label} className="rounded-[16px] border border-[#e7eaf0] bg-[#fbfbfc] p-3">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#7a818d]">{item.label}</p>
          <p className="mt-1 text-xl font-semibold text-[#111111]">{item.value}</p>
          <p className="text-[11px] text-[#7a818d]">{item.detail}</p>
        </div>
      ))}
    </div>
  );
}

export function ActionTile({
  title,
  description,
  icon: Icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap-feedback flex w-full items-start gap-3 rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left"
    >
      <span className="rounded-xl border border-[#eceff4] bg-[#f7f8fa] p-2 text-[#111111]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">
        <p className="text-sm font-semibold text-[#111111]">{title}</p>
        <p className="text-xs text-[#616773]">{description}</p>
      </span>
      <ArrowRight className="mt-1 h-4 w-4 text-[#9aa1ab]" />
    </button>
  );
}

export function EmptyIllustration({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#dfe3ea] bg-[#fafbfd] p-5 text-center">
      <div className="mx-auto mb-3 h-10 w-10 rounded-2xl bg-gradient-to-br from-[#f2f4f8] to-[#eceff6]" />
      <p className="text-sm font-semibold text-[#111111]">{title}</p>
      <p className="mt-1 text-xs text-[#737b88]">{message}</p>
    </div>
  );
}
