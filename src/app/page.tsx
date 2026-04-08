'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Circle,
  Clock3,
  Compass,
  Ellipsis,
  Gauge,
  Home,
  Layers,
  Library,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  TriangleAlert,
  User,
  WandSparkles,
} from 'lucide-react';

type PromptAction = {
  label: 'Research' | 'Analyze' | 'Create' | 'Automate';
  icon: typeof Search;
  starter: string;
};

const quickActions: PromptAction[] = [
  { label: 'Research', icon: Search, starter: 'Research unusual spending patterns from the last 30 days.' },
  { label: 'Analyze', icon: Compass, starter: 'Analyze recurring subscriptions and rank cancellation opportunities.' },
  { label: 'Create', icon: Library, starter: 'Create a weekly operator summary with risks and next steps.' },
  { label: 'Automate', icon: WandSparkles, starter: 'Automate alert triage and memory updates for new billing emails.' },
];

const recentActivity = [
  {
    title: 'Analyzed market trends',
    time: '2 minutes ago',
    context: 'Research agent',
    icon: ChartNoAxesColumnIncreasing,
    status: 'bg-emerald-300/90',
  },
  {
    title: 'Updated project memory',
    time: '15 minutes ago',
    context: 'Memory core',
    icon: Library,
    status: 'bg-emerald-300/90',
  },
  {
    title: 'Generated weekly report',
    time: '1 hour ago',
    context: 'Action engine',
    icon: Sparkles,
    status: 'bg-indigo-400/90',
  },
];

const activeSystems = [
  {
    title: 'Research Agent',
    subtitle: 'Gathering latest information',
    icon: Bot,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Analysis Agent',
    subtitle: 'Processing your data',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Updating knowledge base',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

const tabs = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Chat', href: '/chat', icon: MessageSquare },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'History', href: '/history', icon: Clock3 },
];

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<string[]>([
    'System: All agents are online and ready.',
    'Tip: Start with Analyze for a weekly optimization pass.',
  ]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'research' | 'memory'>('all');
  const [systemExpanded, setSystemExpanded] = useState(true);

  const canSend = prompt.trim().length > 0;

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'research') return recentActivity.filter((item) => item.context.includes('Research'));
    if (activityFilter === 'memory') return recentActivity.filter((item) => item.context.includes('Memory'));
    return recentActivity;
  }, [activityFilter]);

  const sendPrompt = () => {
    if (!canSend) return;
    setMessages((prev) => [...prev, `You: ${prompt.trim()}`, `Agent: Working on "${prompt.trim()}" now.`]);
    setPrompt('');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-slate-50/75 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
      <section className="border-b border-black/[0.04] px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
              <Sparkles className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[1.8rem] font-semibold tracking-tight text-slate-900">MiroAI</p>
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">PRO</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/alerts" className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </Link>
            <button
              type="button"
              onClick={() => setMessages((prev) => [...prev, 'System: Profile panel opened.'])}
              className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
              aria-label="Open profile actions"
            >
              <User className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-6 py-7 pb-28">
        <header className="space-y-2.5">
          <h1 className="text-[2.6rem] font-semibold tracking-tight text-slate-900">Good morning, Operator 👋</h1>
          <p className="text-[1.3rem] leading-relaxed font-normal text-slate-500">Your AI agents are ready to help you today.</p>
        </header>

        <article className="overflow-hidden rounded-[20px] border border-black/[0.04] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="space-y-5 p-6">
            <label htmlFor="operator-prompt" className="text-[1.72rem] leading-[1.35] text-slate-500">
              What would you like to accomplish today?
            </label>
            <textarea
              id="operator-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={3}
              placeholder="Type your request for the agent system..."
              className="w-full resize-none rounded-2xl border border-black/[0.05] bg-slate-50 px-4 py-3 text-[15px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white"
            />
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map(({ label, icon: Icon, starter }) => (
                <button
                  key={label}
                  onClick={() => setPrompt(starter)}
                  className="flex items-center justify-center gap-2 rounded-full border border-black/[0.04] bg-slate-50 px-4 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  <Icon className="h-4 w-4 stroke-[1.75]" />
                  {label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={sendPrompt}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.25)] transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
              Send to agents
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-black/[0.04] px-6 py-4 text-base leading-relaxed text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Try:</span>
              <button type="button" onClick={() => setPrompt('Analyze my weekly productivity and summarize recent news updates.')} className="text-left hover:text-slate-700">
                Analyze my weekly productivity
              </button>
              <span>·</span>
              <button type="button" onClick={() => setPrompt('Summarize recent finance and operations news for this week.')} className="text-left hover:text-slate-700">
                Summarize recent news
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMessages((prev) => [...prev, 'System: Showing next recommendation set.'])}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Show more suggestions"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <Link href="/history" className="inline-flex items-center gap-1 text-lg font-medium text-slate-400 transition hover:text-slate-600">
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mb-4 flex gap-2">
            <button onClick={() => setActivityFilter('all')} className={`rounded-full px-3 py-1 text-xs ${activityFilter === 'all' ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
              All
            </button>
            <button onClick={() => setActivityFilter('research')} className={`rounded-full px-3 py-1 text-xs ${activityFilter === 'research' ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
              Research
            </button>
            <button onClick={() => setActivityFilter('memory')} className={`rounded-full px-3 py-1 text-xs ${activityFilter === 'memory' ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
              Memory
            </button>
          </div>
          <div className="space-y-5">
            {filteredActivity.map(({ title, time, context, icon: Icon, status }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50/60 p-3 text-indigo-500">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.75rem] font-medium leading-tight tracking-tight text-slate-800">{title}</p>
                  <p className="text-base leading-relaxed font-normal text-slate-400">{time} · {context}</p>
                </div>
                <span className={`mt-2 h-2.5 w-2.5 rounded-full ${status}`} />
              </div>
            ))}
          </div>
        </article>

        <section className="grid grid-cols-5 gap-3">
          <article className="col-span-3 rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">Active Agents</h3>
              <button
                type="button"
                onClick={() => setSystemExpanded((prev) => !prev)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100"
                aria-label="Toggle agents details"
              >
                <Ellipsis className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {activeSystems.map(({ title, subtitle, icon: Icon, accent }) => (
                <div key={title} className="flex gap-3">
                  <div className={`rounded-2xl p-2.5 ${accent}`}>
                    <Icon className="h-5 w-5 stroke-[1.8]" />
                  </div>
                  <div>
                    <p className="text-2xl font-medium tracking-tight text-slate-800">{title}</p>
                    {systemExpanded ? <p className="text-sm leading-relaxed font-normal text-slate-400">{subtitle}</p> : null}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <div className="col-span-2 space-y-3">
            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="mb-3 flex items-center gap-2 text-indigo-500">
                <div className="rounded-xl bg-indigo-50 p-2">
                  <Library className="h-4 w-4 stroke-[1.8]" />
                </div>
                <span className="text-xl font-semibold tracking-tight text-slate-900">Memory Usage</span>
              </div>
              <p className="text-base leading-relaxed font-normal text-slate-400">2.2 GB / 5 GB</p>
              <div className="mt-4 h-2 rounded-full bg-slate-100">
                <div className="h-2 w-[44%] rounded-full bg-indigo-400" />
              </div>
            </article>

            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Alerts</p>
                  <p className="text-sm leading-relaxed font-normal text-slate-400">3 pending items</p>
                </div>
                <Link href="/alerts" className="rounded-full bg-amber-50 p-2 text-amber-400 hover:bg-amber-100">
                  <TriangleAlert className="h-5 w-5" />
                </Link>
              </div>
            </article>

            <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Conversation</p>
                  <p className="text-sm leading-relaxed font-normal text-slate-400">{messages.length} updates</p>
                </div>
                <Circle className="h-5 w-5 fill-emerald-300 text-emerald-300" />
              </div>
            </article>
          </div>
        </section>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <h3 className="mb-3 text-lg font-semibold text-slate-800">Conversation</h3>
          <div className="space-y-2">
            {messages.slice(-5).map((message, index) => (
              <p key={`${message}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">
                {message}
              </p>
            ))}
          </div>
        </article>
      </section>

      <nav className="fixed bottom-0 left-1/2 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 py-3 backdrop-blur">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = href === '/';
          return (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-1.5 rounded-xl py-1.5 text-xs font-medium transition ${
                active ? 'text-indigo-500' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-[18px] w-[18px] stroke-[1.8]" />
              {label}
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
