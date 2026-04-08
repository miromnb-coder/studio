'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  Bell,
  Bot,
  ChartNoAxesColumnIncreasing,
  ChevronLeft,
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

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

const quickActions: PromptAction[] = [
  { label: 'Research', icon: Search, starter: 'Research unusual spending patterns from the last 30 days.' },
  { label: 'Analyze', icon: Compass, starter: 'Analyze recurring subscriptions and suggest savings opportunities.' },
  { label: 'Create', icon: Library, starter: 'Create a clean weekly summary with next best actions.' },
  { label: 'Automate', icon: WandSparkles, starter: 'Automate alert triage and memory updates for incoming billing emails.' },
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
  { label: 'Copilot', href: '/copilot', icon: MessageSquare },
  { label: 'Agents', href: '/agents', icon: Bot },
  { label: 'Alerts', href: '/alerts', icon: Bell },
  { label: 'Activity', href: '/activity', icon: Clock3 },
];

export default function HomePage() {
  const pathname = usePathname();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([{ role: 'system', content: 'Auralis is online and ready.' }]);
  const [activityFilter, setActivityFilter] = useState<'all' | 'research' | 'memory'>('all');
  const [systemExpanded, setSystemExpanded] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const canSend = prompt.trim().length > 0 && !isSending;

  const filteredActivity = useMemo(() => {
    if (activityFilter === 'research') return recentActivity.filter((item) => item.context.includes('Research'));
    if (activityFilter === 'memory') return recentActivity.filter((item) => item.context.includes('Memory'));
    return recentActivity;
  }, [activityFilter]);

  const sendPrompt = async () => {
    const input = prompt.trim();
    if (!input || isSending) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(nextMessages);
    setPrompt('');
    setIsSending(true);

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input,
          history: nextMessages
            .filter((message) => message.role !== 'system')
            .map((message) => ({ role: message.role === 'assistant' ? 'assistant' : 'user', content: message.content })),
          userId: 'system_anonymous',
        }),
      });

      if (!response.ok || !response.body) {
        const fallbackText = await response.text();
        setMessages((prev) => [...prev, { role: 'assistant', content: fallbackText || 'Unable to complete request right now.' }]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const cleanChunk = chunk.replace(/__METADATA__:[^\n]*\n?/g, '');
        if (!cleanChunk) continue;

        assistantText += cleanChunk;
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { ...updated[lastIndex], content: assistantText };
          }
          return updated;
        });
      }

      if (!assistantText.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (lastIndex >= 0 && updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = { role: 'assistant', content: 'No response received from the agent.' };
          }
          return updated;
        });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages((prev) => [...prev, { role: 'assistant', content: `Agent request failed: ${errorMessage}` }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8f9fc] shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <section className="border-b border-black/[0.04] px-6 pt-8 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-indigo-50 p-2.5 text-indigo-500">
              <Sparkles className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-[1.75rem] font-semibold tracking-tight text-slate-900">Auralis</p>
              <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-500">PRO</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/alerts" className="relative rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </Link>
            <Link href="/copilot" className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200" aria-label="Open Copilot">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6 px-6 py-7 pb-28">
        <header className="space-y-2.5">
          <h1 className="text-[2.55rem] font-semibold tracking-tight text-slate-900">Good morning, Operator 👋</h1>
          <p className="text-[1.28rem] leading-relaxed font-normal text-slate-500">Your AI agents are ready to help you today.</p>
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
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                  event.preventDefault();
                  void sendPrompt();
                }
              }}
              rows={3}
              placeholder="Ask Auralis to analyze, summarize, or automate…"
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
              onClick={() => void sendPrompt()}
              disabled={!canSend}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-indigo-500 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.22)] transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending…' : 'Send'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-black/[0.04] px-6 py-4 text-base leading-relaxed text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">Try:</span>
              <button type="button" onClick={() => setPrompt('Analyze my weekly productivity and summarize recent news.')} className="text-left hover:text-slate-700">
                Analyze my weekly productivity
              </button>
              <span>·</span>
              <button type="button" onClick={() => setPrompt('Summarize recent market and product updates for me.')} className="text-left hover:text-slate-700">
                Summarize recent news
              </button>
            </div>
            <div className="flex items-center text-slate-400">
              <button type="button" onClick={() => setActivityFilter('all')} className="rounded-full p-1 hover:bg-slate-100">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setActivityFilter(activityFilter === 'research' ? 'memory' : 'research')} className="rounded-full p-1 hover:bg-slate-100">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </article>

        <article className="rounded-[20px] border border-black/[0.04] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[2rem] font-semibold tracking-tight text-slate-900">Recent Activity</h2>
            <Link href="/activity" className="inline-flex items-center gap-1 text-lg font-medium text-slate-400 transition hover:text-slate-600">
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="space-y-5">
            {filteredActivity.map(({ title, time, context, icon: Icon, status }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="rounded-2xl bg-indigo-50/60 p-3 text-indigo-500">
                  <Icon className="h-5 w-5 stroke-[1.8]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.72rem] font-medium leading-tight tracking-tight text-slate-800">{title}</p>
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
                  <p className="text-xl font-semibold tracking-tight text-slate-900">Copilot</p>
                  <p className="text-sm leading-relaxed font-normal text-slate-400">{messages.length} messages</p>
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
              <p
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  message.role === 'user' ? 'bg-indigo-50 text-indigo-700' : message.role === 'assistant' ? 'bg-slate-50 text-slate-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {message.content || (isSending && message.role === 'assistant' ? 'Thinking…' : '')}
              </p>
            ))}
          </div>
        </article>
      </section>

      <nav className="fixed bottom-0 left-1/2 grid w-full max-w-md -translate-x-1/2 grid-cols-5 border-t border-black/[0.05] bg-white/95 px-4 py-3 backdrop-blur">
        {tabs.map(({ label, href, icon: Icon }) => {
          const active = pathname === href;
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
