'use client';

import { useMemo, useState } from 'react';
import { BottomNav } from '../components/bottom-nav';
import { readChatMessages } from '../lib/chat-store';

const filters = ['All', 'Chat', 'Money', 'Agents'] as const;

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const messages = readChatMessages();

  const timeline = useMemo(() => {
    return messages.filter((message) => {
      if (activeFilter === 'All') return true;
      return message.source === activeFilter.toLowerCase();
    });
  }, [activeFilter, messages]);

  const today = timeline.filter((item) => new Date(item.createdAt).toDateString() === new Date().toDateString());
  const yesterday = timeline.filter((item) => new Date(item.createdAt).toDateString() !== new Date().toDateString());

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">History</h1>
        <p className="text-sm text-slate-500">Timeline of agent actions and conversation events.</p>
      </header>

      <section className="px-5 py-5">
        <div className="mb-4 flex gap-2">
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-xs font-semibold ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Today</h2>
            <div className="space-y-2">
              {today.map((item) => (
                <article key={item.id} className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">{item.content.slice(0, 90)}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.source} · {new Date(item.createdAt).toLocaleTimeString()}</p>
                </article>
              ))}
              {today.length === 0 ? <p className="text-sm text-slate-400">No items today.</p> : null}
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Yesterday</h2>
            <div className="space-y-2">
              {yesterday.map((item) => (
                <article key={item.id} className="rounded-2xl border border-black/[0.04] bg-white px-4 py-3">
                  <p className="text-sm font-medium text-slate-800">{item.content.slice(0, 90)}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.source} · {new Date(item.createdAt).toLocaleTimeString()}</p>
                </article>
              ))}
              {yesterday.length === 0 ? <p className="text-sm text-slate-400">No older items.</p> : null}
            </div>
          </section>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
