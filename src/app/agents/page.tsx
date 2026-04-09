'use client';

import { useEffect } from 'react';
import { Bot, Gauge, Layers, Search } from 'lucide-react';
import { useAppStore, type AgentName } from '../store/app-store';

const meta: Record<AgentName, { subtitle: string; icon: typeof Search }> = {
  'Research Agent': {
    subtitle: 'Finds relevant information and trends.',
    icon: Search,
  },
  'Analysis Agent': {
    subtitle: 'Compares numbers and meaningful differences.',
    icon: Gauge,
  },
  'Memory Agent': {
    subtitle: 'Recalls and summarizes prior context.',
    icon: Layers,
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
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-full bg-white/5 p-2.5 text-[#c9ced6]"><Bot className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary">Live Agents</h1>
            <p className="text-sm text-secondary">Real-time status, latest task, and recent run details.</p>
          </div>
        </div>

        <div className="space-y-3">
          {Object.values(agents).map((agent) => {
            const details = meta[agent.name];
            const Icon = details.icon;
            return (
              <button key={agent.name} onClick={() => enqueuePromptAndGoToChat(`Run ${agent.name} on this task: ${agent.lastTask ?? 'new task request'}`)} type="button" className="message-appear card-interactive flex w-full items-start gap-3 rounded-2xl p-4 text-left">
                <div className="rounded-2xl bg-white/5 p-3 text-[#c9ced6]"><Icon className="h-5 w-5 stroke-[1.8]" /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[1.02rem] font-semibold tracking-tight text-primary">{agent.name}</p>
                  <p className="text-sm text-secondary">{details.subtitle}</p>
                  <p className="mt-2 text-xs text-secondary">Last run: {agent.lastRun ? new Date(agent.lastRun).toLocaleString() : 'Never'}</p>
                  <p className="mt-1 text-xs text-secondary">Last task: {agent.lastTask ?? 'No task executed yet'}</p>
                </div>
                <span className={`badge ${agent.status === 'running' ? 'badge-accent agent-pulse' : ''}`}>{agent.status}</span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
