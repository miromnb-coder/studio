'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Bot,
  ChevronRight,
  Clock3,
  Gauge,
  Layers,
  Search,
  Sparkles,
  TriangleAlert,
  WandSparkles,
} from 'lucide-react';
import { BottomNav } from './components/bottom-nav';
import {
  CHAT_DRAFT_KEY,
  type AgentRuntimeState,
  type ChatMessage,
  makeMessage,
  readAgentRuntime,
  readChatMessages,
  writeChatMessages,
} from './lib/chat-store';

type AgentCard = {
  title: 'Research Agent' | 'Analysis Agent' | 'Memory Agent';
  icon: typeof Search;
  accent: string;
};

const agentCards: AgentCard[] = [
  { title: 'Research Agent', icon: Search, accent: 'bg-indigo-50 text-indigo-500' },
  { title: 'Analysis Agent', icon: Gauge, accent: 'bg-sky-50 text-sky-500' },
  { title: 'Memory Agent', icon: Layers, accent: 'bg-amber-50 text-amber-500' },
];

function relativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(deltaMs)) return 'just now';
  const minutes = Math.max(1, Math.round(deltaMs / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function buildRecommendations(alertCount: number, history: ChatMessage[]) {
  const latest = history[history.length - 1]?.content ?? 'recent operator activity';
  return [
    {
      label: 'Triage priority alerts',
      prompt: `Triage my ${alertCount} active alerts and give me the top 3 actions for today.`,
      icon: TriangleAlert,
    },
    {
      label: 'Summarize recent changes',
      prompt: `Summarize my recent activity and highlight what changed: ${latest}`,
      icon: Sparkles,
    },
    {
      label: 'Automate next step',
      prompt: 'Create an automation plan for repetitive alert handling and memory updates.',
      icon: WandSparkles,
    },
  ];
}

export default function HomePage() {
  const router = useRouter();
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [runtime, setRuntime] = useState<AgentRuntimeState>({ status: 'idle', activeAgent: null });

  useEffect(() => {
    setHistory(readChatMessages());
    setRuntime(readAgentRuntime());
  }, []);

  const alerts = useMemo(
    () =>
      history.filter((msg) => /alert|risk|duplicate|renewal|billing/i.test(msg.content)),
    [history],
  );

  const recentActivity = useMemo(() => history.slice(-3).reverse(), [history]);

  const activeAgents = useMemo(
    () =>
      agentCards.map((agent) => ({
        ...agent,
        status:
          runtime.activeAgent === agent.title && runtime.status !== 'idle'
            ? runtime.status
            : 'idle',
      })),
    [runtime],
  );

  const activeAgentCount = activeAgents.filter((agent) => agent.status !== 'idle').length;
  const latestActivity = recentActivity[0];
  const recommendations = buildRecommendations(alerts.length, history);

  const openChatWithPrompt = (prompt: string) => {
    const messages = readChatMessages();
    writeChatMessages([...messages, makeMessage('user', prompt, 'home')]);
    window.localStorage.setItem(CHAT_DRAFT_KEY, prompt);
    router.push('/chat');
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] text-slate-900">
      <section className="border-b border-black/[0.04] bg-white/90 px-5 pt-7 pb-5 backdrop-blur">
        <h1 className="text-[2.1rem] font-semibold tracking-tight text-slate-900">Today Overview</h1>
        <p className="mt-1 text-[1rem] text-slate-500">Live snapshot from your operator store.</p>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-black/[0.04] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Alerts</p>
            <p className="mt-1 text-2xl font-semibold text-rose-500">{alerts.length}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.04] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Active agents</p>
            <p className="mt-1 text-2xl font-semibold text-indigo-600">{activeAgentCount}</p>
          </div>
          <div className="rounded-2xl border border-black/[0.04] bg-white p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Latest activity</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{latestActivity ? relativeTime(latestActivity.createdAt) : 'No history'}</p>
          </div>
        </div>
      </section>

      <section className="space-y-5 px-5 py-6 pb-32">
        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[1.5rem] font-semibold tracking-tight">Recommended Actions</h2>
            <Bell className="h-5 w-5 text-slate-400" />
          </div>

          <div className="space-y-3">
            {recommendations.map(({ label, prompt, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => openChatWithPrompt(prompt)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <h2 className="mb-4 text-[1.5rem] font-semibold tracking-tight">Active Agents</h2>
          <div className="space-y-3">
            {activeAgents.map(({ title, status, icon: Icon, accent }) => (
              <div key={title} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2.5 ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-medium text-slate-800">{title}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${status === 'idle' ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[22px] border border-black/[0.04] bg-white p-5 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="h-5 w-5 text-slate-400" />
            <h2 className="text-[1.5rem] font-semibold tracking-tight">Recent Activity</h2>
          </div>

          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500">No history yet.</p>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700">{item.content}</p>
                  <p className="mt-1 text-xs text-slate-500">{relativeTime(item.createdAt)} · {item.source}</p>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <BottomNav />
    </main>
  );
}
