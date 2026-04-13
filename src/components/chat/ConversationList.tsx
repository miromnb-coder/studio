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

type ConversationListProps = {
  title: string;
  rows: ConversationRow[];
  empty: string;
  onOpen: (id: string) => void;
  onToggleSaved: (id: string) => void;
};

export function ConversationList({
  title,
  rows,
  empty,
  onOpen,
  onToggleSaved,
}: ConversationListProps) {
  const getBadgeStyles = (badge: ConversationRow['badge']) => {
    switch (badge) {
      case 'Running':
        return 'border-[#d9e2ff] bg-[#eef2ff] text-[#5363a8]';
      case 'Needs Input':
        return 'border-[#e6ddcc] bg-[#faf5ea] text-[#8a6f3d]';
      case 'Completed':
        return 'border-[#d7e7dc] bg-[#eef7f1] text-[#587764]';
      case 'Agent':
        return 'border-[#dfe3eb] bg-[#f4f6fa] text-[#5f6977]';
      case 'Saved':
        return 'border-[#dddce8] bg-[#f4f2fb] text-[#625f86]';
      default:
        return 'border-[#d4dae3] bg-[#f5f7fb] text-[#5e6776]';
    }
  };

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-[-0.01em] text-[#4b5563]">
          {title}
        </h3>
        {rows.length > 0 ? (
          <span className="text-[11px] text-[#9aa2af]">{rows.length}</span>
        ) : null}
      </div>

      <div className="space-y-2.5">
        {rows.map((row) => {
          const showAgentIcon =
            row.badge === 'Agent' ||
            row.badge === 'Running' ||
            row.badge === 'Completed';

          return (
            <div
              key={row.id}
              className="rounded-[22px] border border-[#dde2ea] bg-white px-3.5 py-3.5 shadow-[0_8px_18px_rgba(64,72,88,0.05)] transition hover:shadow-[0_10px_22px_rgba(64,72,88,0.07)]"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onOpen(row.id)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#e2e7ef] bg-[#f6f8fb] text-[#66707e] shadow-[0_2px_8px_rgba(60,68,82,0.05)]">
                    {showAgentIcon ? (
                      <Bot className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    ) : (
                      <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="line-clamp-1 block text-[15px] font-semibold tracking-[-0.01em] text-[#2f3744]">
                        {row.title}
                      </span>

                      {row.isUnread ? (
                        <span className="inline-flex h-2 w-2 shrink-0 rounded-full bg-[#90a0ff]" />
                      ) : null}
                    </span>

                    <span className="mt-0.5 line-clamp-1 block text-[12px] leading-snug text-[#8b93a1]">
                      {row.preview || 'No messages yet'}
                    </span>

                    <span className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-[#9aa2af]">
                      <Clock3 className="h-3 w-3" strokeWidth={1.9} />
                      {row.timestamp}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-start gap-1.5">
                  {row.badge ? (
                    <span
                      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${getBadgeStyles(
                        row.badge,
                      )}`}
                    >
                      {row.badge}
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => onToggleSaved(row.id)}
                    aria-label={row.isSaved ? 'Unsave thread' : 'Save thread'}
                    className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-[0.97] ${
                      row.isSaved
                        ? 'border-[#d2d8e2] bg-[#eef2f7] text-[#48515e]'
                        : 'border-[#e2e7ef] bg-white text-[#a0a8b4] hover:bg-[#f7f9fc]'
                    }`}
                  >
                    <Bookmark
                      className={`h-4 w-4 ${row.isSaved ? 'fill-current' : ''}`}
                      strokeWidth={1.9}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {rows.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-[#dbe1ea] bg-white/78 px-4 py-5 text-[12px] text-[#8c94a2]">
            {empty}
          </div>
        ) : null}
      </div>
    </section>
  );
}
