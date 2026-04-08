'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { readHistoryEvents, restoreHistoryToChat, type HistoryEvent } from '../lib/history-store';

type GroupLabel = 'Today' | 'Yesterday' | 'Earlier';

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupLabel(createdAt: string): GroupLabel {
  const eventDay = toDayStart(new Date(createdAt));
  const now = new Date();
  const today = toDayStart(now);
  const yesterday = today - 24 * 60 * 60 * 1000;

  if (eventDay === today) return 'Today';
  if (eventDay === yesterday) return 'Yesterday';
  return 'Earlier';
}

function formatEventTime(createdAt: string) {
  return new Date(createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const router = useRouter();

  const groupedEvents = useMemo(() => {
    const events = readHistoryEvents().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groups: Record<GroupLabel, HistoryEvent[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    events.forEach((event) => {
      groups[groupLabel(event.createdAt)].push(event);
    });

    return groups;
  }, []);

  const openHistoryEvent = (event: HistoryEvent) => {
    restoreHistoryToChat(event);
    router.push('/chat');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-full bg-slate-100 p-2.5 text-slate-500">
          <Clock3 className="h-5 w-5" />
        </div>
      </div>

      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">
          History
        </h1>
        <p className="mt-2 text-[1rem] leading-relaxed text-slate-500">
          Review recent actions, runs, summaries, and saved outputs.
        </p>

        <div className="mt-6 space-y-5">
          {(['Today', 'Yesterday', 'Earlier'] as GroupLabel[]).map((label) => {
            const items = groupedEvents[label];
            if (!items.length) return null;

            return (
              <div key={label}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  {label}
                </h2>
                <div className="space-y-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openHistoryEvent(item)}
                      className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800">{item.title}</p>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.description}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatEventTime(item.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-indigo-500 transition hover:text-indigo-600"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
