'use client';

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
    icon: Gauge as typeof Search,
    accent: 'bg-sky-50 text-sky-500',
  },
  {
    title: 'Memory Agent',
    subtitle: 'Stores and recalls important context.',
    icon: Layers as typeof Search,
    accent: 'bg-amber-50 text-amber-500',
  },
];

export default function AgentsPage() {
  const [agentEntities, setAgentEntities] = useState<Record<AgentName, AgentEntity>>(
    () => readAgentRuntime().agents,
  );
  const [now, setNow] = useState<number>(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncRuntime = () => {
      setAgentEntities(readAgentRuntime().agents);
    };

    syncRuntime();

    const loadingTimer = window.setTimeout(() => setLoading(false), 700);
    const clockTimer = window.setInterval(() => setNow(Date.now()), 1000);

    window.addEventListener('storage', syncRuntime);
    window.addEventListener(AGENT_RUNTIME_EVENT, syncRuntime as EventListener);

    return () => {
      window.clearTimeout(loadingTimer);
      window.clearInterval(clockTimer);
      window.removeEventListener('storage', syncRuntime);
      window.removeEventListener(AGENT_RUNTIME_EVENT, syncRuntime as EventListener);
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
    <main className="screen bg-[#f8fafc]">
      <section className="mb-5 flex items-center justify-between">
        <Link
          href="/"
          className="tap-feedback inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-[0_4px_14px_rgba(15,23,42,0.04)] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500">
          <Bot className="h-5 w-5" />
        </div>
      </section>

      <section className="surface-card p-5">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Active Agents
          </h1>
          <p className="text-sm text-slate-500">
            Systems currently assisting behind the scenes.
          </p>
        </div>

        <div className="space-y-3">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-24 rounded-2xl" />
              ))
            : agents.map(({ title, subtitle, icon: Icon, accent }) => {
                const entity = agentEntities[title];

                return (
                  <div
                    key={title}
                    className="message-appear flex items-start gap-3 rounded-2xl bg-slate-50 p-4"
                  >
                    <div className={`rounded-2xl p-3 ${accent}`}>
                      <Icon className="h-5 w-5 stroke-[1.8]" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[1.02rem] font-semibold tracking-tight text-slate-800">
                        {title}
                      </p>
                      <p className="text-sm leading-relaxed text-slate-500">
                        {subtitle}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Last run: {formatTimestamp(entity?.lastRun ?? null)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Last task: {entity?.lastTask ?? 'No task executed yet'}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          entity?.status === 'running'
                            ? 'animate-pulse bg-emerald-100 text-emerald-700'
                            : entity?.status === 'completed'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {entity?.status ?? 'idle'}
                      </span>

                      <span className="text-[11px] text-slate-400">
                        {secondsAgo(entity?.lastRun ?? null) !== null
                          ? `${secondsAgo(entity?.lastRun ?? null)}s ago`
                          : 'Waiting'}
                      </span>
                    </div>
                  </div>
                );
              })}
        </div>
      </section>
    </main>
  );
}
