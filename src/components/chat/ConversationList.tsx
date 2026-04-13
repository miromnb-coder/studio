'use client';

import { Bookmark, Bot, Clock3, MessageSquare } from 'lucide-react';

export type ConversationRow = {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
  badge?: 'Agent' | 'Completed' | 'Running' | 'Needs Input' | 'Saved';
  isUnread?: boolean;
  isSaved?: boolean;
};

export function ConversationList({
  title,
  rows,
  empty,
  onOpen,
  onToggleSaved,
}: {
  title: string;
  rows: ConversationRow[];
  empty: string;
  onOpen: (id: string) => void;
  onToggleSaved: (id: string) => void;
}) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#8a93a1]">{title}</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="rounded-2xl border border-[#dbe1ea] bg-white p-3 shadow-[0_8px_18px_rgba(68,74,88,0.05)]">
            <div className="flex items-start gap-2.5">
              <button type="button" onClick={() => onOpen(row.id)} className="flex min-w-0 flex-1 items-start gap-2.5 text-left">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#e0e5ec] bg-[#f4f6fa] text-[#6a7382]">
                  {row.badge === 'Agent' || row.badge === 'Running' || row.badge === 'Completed' ? <Bot className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-1 block text-sm font-medium text-[#2d3441]">{row.title}</span>
                  <span className="line-clamp-1 block text-xs text-[#7d8796]">{row.preview || 'No messages yet'}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#98a1af]"><Clock3 className="h-3 w-3" />{row.timestamp}</span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-1">
                {row.badge ? <span className="rounded-full border border-[#d4dae3] bg-[#f5f7fb] px-2 py-1 text-[10px] font-medium text-[#5e6776]">{row.badge}</span> : null}
                <button
                  type="button"
                  onClick={() => onToggleSaved(row.id)}
                  aria-label={row.isSaved ? 'Unsave thread' : 'Save thread'}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border ${row.isSaved ? 'border-[#cad1dc] bg-[#eef2f7] text-[#404957]' : 'border-[#e0e5ec] bg-white text-[#a1a9b5]'}`}
                >
                  <Bookmark className={`h-3.5 w-3.5 ${row.isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rows.length === 0 ? <div className="rounded-2xl border border-dashed border-[#d8dee8] bg-white/70 px-3 py-4 text-xs text-[#8a93a1]">{empty}</div> : null}
      </div>
    </section>
  );
}
