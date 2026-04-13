'use client';

import { ArrowUpRight, PlayCircle } from 'lucide-react';
import type { ConversationRow } from './ConversationList';

export function ContinueCard({ item, onResume }: { item: ConversationRow | null; onResume: (id: string) => void }) {
  if (!item) return null;

  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a93a1]">Continue Where You Left Off</h3>
      <div className="rounded-3xl border border-[#d3d9e3] bg-gradient-to-b from-white to-[#f3f6fb] p-4 shadow-[0_18px_30px_rgba(58,64,78,0.10)]">
        <p className="text-base font-semibold tracking-[-0.015em] text-[#232934]">{item.title}</p>
        <p className="mt-1 line-clamp-2 text-sm text-[#697282]">{item.preview || 'Continue this thread with the latest context.'}</p>
        <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-[#d6dce6] bg-white/80 px-2.5 py-1 text-[11px] text-[#5f6877]">
          <ArrowUpRight className="h-3 w-3" />
          {item.badge ?? 'Needs Input'} · {item.timestamp}
        </div>
        <button
          type="button"
          onClick={() => onResume(item.id)}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#c7ced9] bg-[#e6ebf3] px-3 py-2.5 text-sm font-medium text-[#2f3745] shadow-[0_10px_18px_rgba(59,66,79,0.1)]"
        >
          <PlayCircle className="h-4 w-4" /> Resume
        </button>
      </div>
    </section>
  );
}
