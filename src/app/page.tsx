'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Bell, Bot, Gauge, Layers, Send, Sparkles } from 'lucide-react';
import { PRODUCT_NAME, PRODUCT_SHORT } from './config/product';

type ActivityFilter = 'all' | 'research' | 'memory';

const quickActions = [
  'Research unusual spending patterns from the last 30 days.',
  'Analyze recurring subscriptions and rank cancellation opportunities.',
  'Create a weekly operator summary with risks and next steps.',
];

const recentActivity = [
  { title: 'Analyzed market trends', type: 'research' as const, time: '2m ago' },
  { title: 'Updated project memory', type: 'memory' as const, time: '15m ago' },
  { title: 'Generated weekly report', type: 'all' as const, time: '1h ago' },
];

const activeSystems = [
  { title: 'Research Agent', subtitle: 'Gathering latest information', icon: Bot },
  { title: 'Analysis Agent', subtitle: 'Processing your data', icon: Gauge },
  { title: 'Memory Agent', subtitle: 'Updating knowledge base', icon: Layers },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([
    'System: All agents are online and ready.',
    'Tip: Start with Analyze for a weekly optimization pass.',
  ]);
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');
  const [isTyping, setIsTyping] = useState(false);

  const canSend = prompt.trim().length > 0;

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'all') return recentActivity;
    return recentActivity.filter((item) => item.type === activityFilter || item.type === 'all');
  }, [activityFilter]);

  const sendPrompt = () => {
    const value = prompt.trim();
    if (!value) return;

    setMessages((prev) => [...prev, `You: ${value}`]);
    setPrompt('');
    setIsTyping(true);

    window.setTimeout(() => {
      setMessages((prev) => [...prev, `Agent: Working on "${value}" now.`]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card mb-5 border-black/[0.04] bg-white/90 px-5 py-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
              <Sparkles className="h-4 w-4 stroke-[1.9]" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-semibold tracking-tight text-slate-900">{PRODUCT_NAME}</p>
              <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-indigo-500">
                PRO
              </span>
            </div>
          </div>

          <Link href="/alerts" className="tap-feedback rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Alerts">
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="space-y-4 pb-6">
        <header className="space-y-1 px-1">
          <h1 className="text-[2rem] font-semibold tracking-tight text-slate-900">Good morning, {PRODUCT_SHORT} 👋</h1>
          <p className="text-base text-slate-500">Your AI agents are ready to help you today.</p>
        </header>

        <article className="surface-card p-4">
          <p className="mb-3 text-base text-slate-600">What would you like to accomplish today?</p>
          <div className="mb-3 grid grid-cols-1 gap-2">
            {quickActions.map((starter) => (
              <button key={starter} type="button" onClick={() => setPrompt(starter)} className="tap-feedback rounded-2xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-100">
                {starter}
              </button>
            ))}
          </div>
          <div className="rounded-2xl bg-slate-50 p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your next task for the agents..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-slate-700 placeholder:text-slate-400"
            />
            <div className="mt-2 flex justify-end">
              <button type="button" onClick={sendPrompt} disabled={!canSend} className="tap-feedback rounded-full bg-indigo-500 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300">
                <span className="inline-flex items-center gap-2"><Send className="h-4 w-4" />Send</span>
              </button>
            </div>
          </div>
        </article>

        <article className="surface-card p-4">
          <h2 className="mb-3 text-lg font-semibold">Recent Activity</h2>
          <div className="mb-3 flex gap-2">
            {(['all', 'research', 'memory'] as ActivityFilter[]).map((filter) => (
              <button key={filter} type="button" onClick={() => setActivityFilter(filter)} className={`tap-feedback rounded-full px-3 py-1 text-xs font-semibold capitalize ${activityFilter === filter ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {filter}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            {filteredActivity.map((item) => (
              <p key={item.title} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.title} · {item.time}</p>
            ))}
          </div>
        </article>

        <article className="surface-card p-4">
          <h3 className="mb-3 text-lg font-semibold">Active Agents</h3>
          <div className="space-y-3">
            {activeSystems.map(({ title, subtitle, icon: Icon }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="rounded-xl bg-indigo-50 p-2 text-indigo-500">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{title}</p>
                  <p className="text-xs text-slate-500">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="surface-card p-4">
          <h3 className="mb-3 text-base font-semibold text-slate-800">Conversation</h3>
          <div className="space-y-2">
            {messages.slice(-4).map((message, index) => (
              <p key={`${message}-${index}`} className="message-appear rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">{message}</p>
            ))}
            {isTyping ? (
              <p className="inline-flex items-center gap-2 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-600">
                <span className="agent-pulse inline-flex h-2 w-2 rounded-full bg-indigo-500" /> Agent is typing...
              </p>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
