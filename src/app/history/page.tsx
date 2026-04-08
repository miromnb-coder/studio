'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, CircleDollarSign, Clock3, MessageSquare } from 'lucide-react';
import { BottomNav } from '../components/bottom-nav';
import { CHAT_DRAFT_KEY, ChatMessage, readChatMessages } from '../lib/chat-store';

const filters = ['All', 'Chat', 'Money', 'Agents'] as const;

function sourceIcon(source: ChatMessage['source']) {
  if (source === 'money') return <CircleDollarSign className="h-3.5 w-3.5" />;
  if (source === 'agents') return <Bot className="h-3.5 w-3.5" />;
  return <MessageSquare className="h-3.5 w-3.5" />;
}

export default function HistoryPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('All');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setMessages(readChatMessages());
  }, []);

  const timeline = useMemo(() => messages.filter((message) => (activeFilter === 'All' ? true : message.source === activeFilter.toLowerCase())), [activeFilter, messages]);

  const now = new Date();
  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);

  const today = timeline.filter((item) => isSameDay(new Date(item.createdAt), now));
  const yesterday = timeline.filter((item) => isSameDay(new Date(item.createdAt), yesterdayDate));
  const older = timeline.filter((item) => !isSameDay(new Date(item.createdAt), now) && !isSameDay(new Date(item.createdAt), yesterdayDate));

  const openItem = (item: ChatMessage) => {
    window.localStorage.setItem(CHAT_DRAFT_KEY, item.content);
    router.push('/chat');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <header className="border-b border-black/[0.04] px-6 pt-8 pb-4">
        <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">History</h1>
        <p className="text-sm text-slate-500">Timeline of agent actions and conversation events.</p>
      </header>

      <section className="px-5 py-5">
        <div className="mb-4 flex gap-2">
          {filters.map((filter) => (
            <button key={filter} onClick={() => setActiveFilter(filter)} className={`rounded-full px-3 py-1 text-xs font-semibold transition ${activeFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              {filter}
            </button>
          ))}
        </div>

        {timeline.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-400">
            <Clock3 className="mx-auto mb-2 h-5 w-5" />
            No history entries yet.
          </div>
        ) : null}

        <div className="space-y-4">
          {[
            { label: 'Today', items: today },
            { label: 'Yesterday', items: yesterday },
            { label: 'Older', items: older },
          ].map((group) => (
            <section key={group.label}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{group.label}</h2>
              <div className="space-y-2">
                {group.items.map((item) => (
                  <button key={item.id} onClick={() => openItem(item)} className="flex w-full items-center gap-3 rounded-2xl border border-black/[0.04] bg-white px-4 py-3 text-left transition hover:bg-slate-50">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-slate-500">{sourceIcon(item.source)}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.content.slice(0, 90)}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.source} · {new Date(item.createdAt).toLocaleTimeString()}</p>
                    </div>
                  </button>
                ))}
                {group.items.length === 0 ? <p className="text-sm text-slate-400">No items.</p> : null}
              </div>
            </section>
          ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
