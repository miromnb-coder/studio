'use client';

import type { ComponentType } from 'react';
import { ChevronRight } from 'lucide-react';

export type MenuRow = {
  label: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  href?: string;
  action?: string;
  badge?: string;
};

type MenuSectionProps = {
  title?: string;
  rows: MenuRow[];
  onClick: (row: MenuRow) => void;
};

export function MenuSection({ title, rows, onClick }: MenuSectionProps) {
  return (
    <section>
      {title ? <p className="mb-2 mt-5 px-2 text-[13px] font-normal text-[#8b919f]">{title}</p> : null}
      <div className="overflow-hidden rounded-[18px] border border-[#d7dbe2] bg-[#f5f6f9] shadow-[0_8px_16px_rgba(66,72,88,0.05)]">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <button
              key={row.label}
              type="button"
              onClick={() => onClick(row)}
              className="flex h-[56px] w-full items-center gap-3 border-b border-[#e2e5eb] px-4 text-left last:border-b-0"
            >
              <Icon className="h-5 w-5 text-[#7d8492]" strokeWidth={1.8} />
              <span className="flex-1 text-[16px] font-normal text-[#59606d]">{row.label}</span>

              {row.badge ? (
                <span className="rounded-full bg-[#e8ebf1] px-2 py-0.5 text-[11px] font-medium text-[#9097a4]">
                  {row.badge}
                </span>
              ) : null}

              <ChevronRight className="h-5 w-5 text-[#a3a9b5]" strokeWidth={1.8} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
