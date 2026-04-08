'use client';

import { useEffect } from 'react';
import { Bot, Gauge, Layers, Search } from 'lucide-react';
import { useAppStore, type AgentName } from '../store/app-store';

const meta: Record<AgentName, { subtitle: string; icon: typeof Search; accent: string }> = {
  'Research Agent': {
    subtitle: 'Finds relevant information and trends.',
    icon: Search,
    accent: 'bg-indigo-50 text-indigo-500',
  },
  'Analysis Agent': {
    subtitle: 'Compares numbers and meaningful differences.',
    icon: Gauge,
    accent: 'bg-sky-50 text-sky-500',
  },
  'Memory Agent': {
    subtitle: 'Recalls and summarizes prior context.',
    icon: Layers,
    accent: 'bg-amber-50 text-amber-500',
  },
};

export default function AgentsPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const agents = useAppStore((s) => s.agents);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-indigo-50 p-2.5 text-indigo-500"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Live Agents</h1>
            <p className="text-sm text-slate-500">Real-time status, latest task, and recent run details.</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.values(agents).map((agent) => {
            const details = meta[agent.name];
            const Icon = details.icon;
            return (
              <button key={agent.name} onClick={() => enqueuePromptAndGoToChat(`Run ${agent.name} on this task: ${agent.lastTask ?? 'new task request'}`)} type="button" className="message-appear flex w-full items-start gap-3 rounded-2xl bg-slate-50 p-4 text-left">
                <div className={`rounded-2xl p-3 ${details.accent}`}><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.02rem] font-semibold tracking-tight text-slate-800">{agent.name}</p>
                  <p className="text-sm text-slate-500">{details.subtitle}</p>
                  <p className="mt-2 text-xs text-slate-500">Last run: {agent.lastRun ? new Date(agent.lastRun).toLocaleString() : 'Never'}</p>
                  <p className="mt-1 text-xs text-slate-400">Last task: {agent.lastTask ?? 'No task executed yet'}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${agent.status === 'running' ? 'animate-pulse bg-emerald-100 text-emerald-700' : agent.status === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'}`}>{agent.status}</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
