'use client';

<<<<<<< codex/define-and-implement-agent-entities-and-routing
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Bot, Gauge, Layers, Search } from 'lucide-react';
import {
  AGENT_RUNTIME_EVENT,
  type AgentEntity,
  type AgentName,
  readAgentRuntime,
} from '../lib/chat-store';

const agents: Array<{
  title: AgentName;
  subtitle: string;
  icon: typeof Search;
  accent: string;
}> = [
  {
    title: 'Research Agent',
    subtitle: 'Finds relevant information and trends.',
    icon: Search,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  {
    title: 'Analysis Agent',
    subtitle: 'Processes patterns and insights.',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Stores and recalls important context.',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
];

export default function AgentsPage() {
  const [agentEntities, setAgentEntities] = useState<Record<AgentName, AgentEntity>>(
    () => readAgentRuntime().agents,
  );
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    const syncRuntime = () => setAgentEntities(readAgentRuntime().agents);
    syncRuntime();

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    window.addEventListener('storage', syncRuntime);
    window.addEventListener(AGENT_RUNTIME_EVENT, syncRuntime);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('storage', syncRuntime);
      window.removeEventListener(AGENT_RUNTIME_EVENT, syncRuntime);
    };
  }, []);

  const formatTimestamp = (value: string | null) => {
    if (!value) return 'Never';
    const date = new Date(value);
    return date.toLocaleString();
  };

  const secondsAgo = (value: string | null) => {
    if (!value) return null;
    return Math.max(0, Math.floor((now - new Date(value).getTime()) / 1000));
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-[#f8fafc] px-5 py-6 text-slate-900">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <Bot className="h-5 w-5" />
        </div>
      </div>

      {/* Content */}
      <section className="rounded-[22px] border border-black/[0.04] bg-white p-6 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-slate-900">
          Active Agents
        </h1>
=======
import { useEffect, useState } from 'react';
import { Bot, Gauge, Layers, Search } from 'lucide-react';

const agents = [
  { title: 'Research Agent', subtitle: 'Finds relevant information and trends.', icon: Search },
  { title: 'Analysis Agent', subtitle: 'Processes patterns and insights.', icon: Gauge },
  { title: 'Memory Agent', subtitle: 'Stores and recalls important context.', icon: Layers },
];

export default function AgentsPage() {
  const [loading, setLoading] = useState(true);
>>>>>>> main

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(timer);
  }, []);

<<<<<<< codex/define-and-implement-agent-entities-and-routing
        <div className="mt-6 space-y-4">
          {agents.map(({ title, subtitle, icon: Icon, accent }) => (
            <div
              key={title}
              className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
            >
              <div className={`rounded-2xl p-3 ${accent}`}>
                <Icon className="h-5 w-5 stroke-[1.8]" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[1.1rem] font-medium tracking-tight text-slate-800">
                  {title}
                </p>
                <p className="text-[0.95rem] leading-relaxed text-slate-500">
                  {subtitle}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Last run: {formatTimestamp(agentEntities[title].lastRun)}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Last task: {agentEntities[title].lastTask ?? 'No task executed yet'}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                    agentEntities[title].status === 'running'
                      ? 'animate-pulse bg-emerald-100 text-emerald-700'
                      : agentEntities[title].status === 'completed'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {agentEntities[title].status}
                </span>
                <span className="text-[11px] text-slate-400">
                  {secondsAgo(agentEntities[title].lastRun) !== null
                    ? `${secondsAgo(agentEntities[title].lastRun)}s ago`
                    : 'Waiting'}
                </span>
              </div>
            </div>
          ))}
=======
  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">Active Agents</h1>
            <p className="text-sm text-slate-500">Systems currently assisting behind the scenes.</p>
          </div>
>>>>>>> main
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)
            : agents.map(({ title, subtitle, icon: Icon }) => (
                <div key={title} className="message-appear flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-500"><Icon className="h-5 w-5" /></div>
                  <div>
                    <p className="font-semibold text-slate-800">{title}</p>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
