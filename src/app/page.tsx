'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Bot, ChartNoAxesColumnIncreasing, Ellipsis, Gauge, Layers, Library, Search, Send, Sparkles, WandSparkles } from 'lucide-react';
import { BottomNav } from './components/bottom-nav';
import { CHAT_DRAFT_KEY, makeMessage, readChatMessages, writeChatMessages } from './lib/chat-store';
import { monthlySavingsEstimate, subscriptions } from './lib/money-data';

const quickActions = [
  { label: 'Research', icon: Search, starter: 'Research unusual subscription increases over the last 30 days.' },
  { label: 'Analyze', icon: Gauge, starter: 'Analyze my monthly spend and identify the top avoidable costs.' },
  { label: 'Create', icon: Library, starter: 'Create a weekly money and productivity briefing with action steps.' },
  { label: 'Automate', icon: WandSparkles, starter: 'Automate triage for billing and renewal alerts in my inbox.' },
] as const;

const suggestionPool = [
  'Analyze my weekly productivity',
  'Summarize recent billing anomalies',
  'Find duplicate tools and subscriptions',
  'Create a cancellation action plan',
  'Review pending renewals for next 14 days',
];

const recentActivity = [
  { title: 'Analyzed market trends', time: '2 minutes ago', context: 'Research Agent', icon: ChartNoAxesColumnIncreasing, prompt: 'Continue the market trend analysis and summarize opportunities.' },
  { title: 'Updated project memory', time: '15 minutes ago', context: 'Memory Agent', icon: Library, prompt: 'Show the latest memory updates and unresolved action items.' },
  { title: 'Generated weekly report', time: '1 hour ago', context: 'Analysis Agent', icon: Sparkles, prompt: 'Open the weekly report and highlight the most important risks.' },
] as const;

const activeAgents = [
  { title: 'Research Agent', subtitle: 'Gathering latest information', icon: Bot, accent: 'bg-indigo-50 text-indigo-500' },
  { title: 'Analysis Agent', subtitle: 'Processing your data', icon: Gauge, accent: 'bg-sky-50 text-sky-500' },
  { title: 'Memory Agent', subtitle: 'Updating knowledge base', icon: Layers, accent: 'bg-amber-50 text-amber-500' },
  { title: 'Money Agent', subtitle: 'Scanning subscriptions and leakage', icon: Library, accent: 'bg-emerald-50 text-emerald-500' },
] as const;

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [suggestionIndex, setSuggestionIndex] = useState(0);

  useEffect(() => {
    const usage = readChatMessages().length;
    setSuggestionIndex(usage % suggestionPool.length);
  }, []);

  const suggestions = useMemo(
    () => [suggestionPool[suggestionIndex], suggestionPool[(suggestionIndex + 1) % suggestionPool.length]],
    [suggestionIndex],
  );

  const monthlySavings = useMemo(() => monthlySavingsEstimate(), []);
  const wasteCount = useMemo(() => subscriptions.filter((item) => item.waste).length, []);

  const sendToChat = (value: string, sourcePrompt?: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const messages = readChatMessages();
    const updated = [...messages, makeMessage('user', trimmed, sourcePrompt ? 'money' : 'home')];
    writeChatMessages(updated);
    window.localStorage.setItem(CHAT_DRAFT_KEY, trimmed);
    setPrompt('');
    router.push('/chat');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] pb-28 shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <section className="border-b border-black/[0.04] px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500"><Sparkles className="h-4 w-4 stroke-[1.75]" /></div>
            <div className="flex items-center gap-2">
              <p className="text-[1.7rem] font-semibold tracking-tight text-slate-900">Operator</p>
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">PRO</span>
            </div>
          </div>
          <button type="button" onClick={() => router.push('/money')} className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </button>
        </div>
      </section>

      <section className="space-y-6 px-6 py-7">
        <header className="space-y-2">
          <h1 className="text-[2.45rem] font-semibold tracking-tight text-slate-900">Good morning 👋</h1>
          <p className="text-[1.24rem] leading-relaxed text-slate-500">Your AI agents are ready to help today.</p>
        </header>

        <article className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="space-y-5 p-6">
            <p className="text-[1.64rem] leading-[1.35] text-slate-500">What would you like to accomplish today?</p>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} placeholder="Ask Operator to analyze, summarize, or automate…" className="w-full resize-none rounded-2xl border border-black/[0.05] bg-slate-50 px-4 py-3 text-[15px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white" />
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, icon: Icon, starter }) => (
                <button key={label} onClick={() => setPrompt(starter)} className="flex items-center justify-center gap-2 rounded-full border border-black/[0.04] bg-slate-50 px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-100">
                  <Icon className="h-4 w-4 stroke-[1.75]" />{label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => sendToChat(prompt)} disabled={!prompt.trim()} className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:bg-slate-300">
              <Send className="h-4 w-4" />Send
            </button>
          </div>
          <div className="flex items-center gap-2 border-t border-black/[0.04] px-6 py-4 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Try:</span>
            <button type="button" onClick={() => setPrompt(suggestions[0])} className="hover:text-slate-700">{suggestions[0]}</button>
            <span>·</span>
            <button type="button" onClick={() => setPrompt(suggestions[1])} className="hover:text-slate-700">{suggestions[1]}</button>
          </div>
        </article>

        <article className="rounded-[20px] border border-emerald-100 bg-emerald-50/70 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">AI Insight</p>
          <p className="mt-2 text-2xl font-semibold leading-snug text-emerald-900">€{monthlySavings.toFixed(0)} / month potential savings</p>
          <p className="mt-1 text-sm text-emerald-800">Detected from {wasteCount} flagged subscriptions.</p>
          <button type="button" onClick={() => sendToChat(`Show me the cancellation steps for the ${wasteCount} waste subscriptions.`, 'money')} className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700">Open in chat</button>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <button type="button" onClick={() => router.push('/history')} className="text-lg font-medium text-slate-400">View all</button>
          </div>
          <div className="space-y-5">
            {recentActivity.map(({ title, time, context, icon: Icon, prompt: activityPrompt }) => (
              <button key={title} onClick={() => sendToChat(activityPrompt)} className="flex w-full items-start gap-3 text-left transition hover:opacity-95">
                <div className="rounded-2xl bg-indigo-50/70 p-3 text-indigo-500"><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.65rem] font-medium leading-tight text-slate-800">{title}</p>
                  <p className="text-sm leading-relaxed text-slate-400">{time} · {context}</p>
                </div>
                <span className="mt-2 h-2.5 w-2.5 rounded-full bg-emerald-300" />
              </button>
            ))}
          </div>
        </article>

        <section className="grid grid-cols-5 gap-3">
          <article className="col-span-3 rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.8rem] font-semibold tracking-tight text-slate-900">Active Agents</h3>
              <button type="button" onClick={() => setExpanded((prev) => !prev)} className="rounded-full p-1 text-slate-400 hover:bg-slate-100"><Ellipsis className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              {activeAgents.map(({ title, subtitle, icon: Icon, accent }) => (
                <div key={title} className="flex gap-3">
                  <div className={`rounded-2xl p-2.5 ${accent}`}><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                  <div>
                    <p className="text-2xl font-medium text-slate-800">{title}</p>
                    {expanded && <p className="text-sm text-slate-400">{subtitle}</p>}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="col-span-2 space-y-3">
            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-xl font-semibold tracking-tight text-slate-900">Memory Usage</p>
              <p className="text-base text-slate-400">2.2 GB / 5 GB</p>
            </article>
            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-xl font-semibold tracking-tight text-slate-900">Money Risk</p>
              <p className="text-base text-slate-400">{wasteCount} active leaks</p>
            </article>
          </div>
        </section>
      </section>
      <BottomNav />
    </main>
  );
}
