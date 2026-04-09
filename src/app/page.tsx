'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, Bot, Gauge, Layers, LogOut, Send, Sparkles } from 'lucide-react';
import { PRODUCT_NAME, PRODUCT_SHORT } from './config/product';
import { useAppStore, type AgentName, type HistoryEntry } from './store/app-store';

const quickActions = [
  'Research unusual spending patterns from the last 30 days.',
  'Compare this month vs last month and highlight percentage changes.',
  'Summarize all recent context and propose next steps.',
];

const iconMap: Record<AgentName, typeof Bot> = {
  'Research Agent': Bot,
  'Analysis Agent': Gauge,
  'Memory Agent': Layers,
};

export default function HomePage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const messages = useAppStore((s) => s.messages);
  const history = useAppStore((s) => s.history);
  const agents = useAppStore((s) => s.agents);
  const alerts = useAppStore((s) => s.alerts);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const updateUserName = useAppStore((s) => s.updateUserName);
  const logout = useAppStore((s) => s.logout);

  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const recentMessages = useMemo(() => messages.slice(-3).reverse(), [messages]);
  const recentHistory = useMemo(() => history.slice(0, 4), [history]);
  const activeAlerts = useMemo(
    () =>
      alerts.filter(
        (item) => !item.resolved && (!item.snoozedUntil || new Date(item.snoozedUntil).getTime() < Date.now()),
      ),
    [alerts],
  );

  const userName = user?.name || 'Operator';
  const initials = userName
    .split(' ')
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    enqueuePromptAndGoToChat(prompt);
    setPrompt('');
  };

  const editName = () => {
    const nextName = window.prompt('Edit display name', userName);
    if (!nextName?.trim()) return;
    updateUserName(nextName.trim());
  };

  const openHistoryItem = (item: HistoryEntry) => {
    if (item.prompt) {
      enqueuePromptAndGoToChat(item.prompt);
      return;
    }
    enqueuePromptAndGoToChat(`Continue from history item: ${item.title}. ${item.description}`);
  };

  return (
    <main className="screen app-bg">
      <section className="card-surface mb-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/5 p-2.5 text-[#cde4ff]">
              <Sparkles className="h-4 w-4 stroke-[1.9]" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-primary">{PRODUCT_NAME}</p>
              <p className="text-xs text-secondary">Mobile AI operator workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={editName}
              className="tap-feedback inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-primary"
            >
              {initials}
            </button>
            <Link href="/alerts" className="tap-feedback rounded-full p-2 text-secondary hover:bg-white/5">
              <Bell className="h-5 w-5" />
            </Link>
            <button type="button" onClick={logout} className="tap-feedback rounded-full p-2 text-secondary hover:bg-white/5">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-3 pb-3">
        <header className="px-1">
          <h1 className="text-[1.8rem] font-semibold tracking-tight text-primary">Hi {userName || PRODUCT_SHORT} 👋</h1>
          <p className="text-sm text-secondary">Start work fast, then continue in chat with live agents.</p>
        </header>

        <article className="card-surface px-4 py-4">
          <p className="mb-2 text-sm text-secondary">Quick actions</p>
          <div className="space-y-2">
            {quickActions.map((starter) => (
              <button
                key={starter}
                onClick={() => enqueuePromptAndGoToChat(starter)}
                className="card-interactive w-full rounded-[14px] px-4 py-3 text-left text-sm text-primary"
                type="button"
              >
                {starter}
              </button>
            ))}
          </div>
          <div className="card-elevated mt-3 p-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="system-input w-full resize-none bg-transparent px-3 py-2 text-sm"
              placeholder="Type a task to start in chat..."
            />
            <div className="mt-2 flex justify-end">
              <button
                onClick={submitPrompt}
                type="button"
                className="btn-primary tap-feedback inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                disabled={!prompt.trim()}
              >
                <Send className="h-4 w-4" />
                Start
              </button>
            </div>
          </div>
        </article>

        <article className="card-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Agents</h2>
            <Link href="/agents" className="text-xs font-semibold text-[#cde4ff]">
              View
            </Link>
          </div>
          <div className="space-y-2">
            {Object.values(agents).map((agent) => {
              const Icon = iconMap[agent.name];
              return (
                <button
                  key={agent.name}
                  type="button"
                  onClick={() =>
                    enqueuePromptAndGoToChat(
                      `Continue work with ${agent.name}. Last task: ${agent.lastTask ?? 'none yet'}.`,
                    )
                  }
                  className="card-interactive flex w-full items-center justify-between rounded-[14px] px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-white/5 p-2 text-[#cde4ff]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">{agent.name}</p>
                      <p className="text-xs text-secondary">{agent.lastTask ?? 'No task run yet'}</p>
                    </div>
                  </div>
                  <span className={`badge ${agent.status === 'running' ? 'badge-accent agent-pulse' : ''}`}>{agent.status}</span>
                </button>
              );
            })}
          </div>
        </article>

        <article className="card-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link href="/history" className="text-xs font-semibold text-[#cde4ff]">
              All
            </Link>
          </div>
          <div className="space-y-2">
            {recentHistory.length === 0 ? (
              <p className="card-elevated rounded-[14px] px-3 py-3 text-sm text-secondary">
                No activity yet. Start a task to build your timeline.
              </p>
            ) : (
              recentHistory.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openHistoryItem(item)}
                  className="card-interactive w-full rounded-[14px] px-3 py-3 text-left"
                >
                  <p className="text-sm font-medium text-primary">{item.title}</p>
                  <p className="text-xs text-secondary">{item.description}</p>
                </button>
              ))
            )}
          </div>
        </article>

        <article className="card-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Conversation preview</h2>
            <Link href="/chat" className="text-xs font-semibold text-[#cde4ff]">
              Open chat
            </Link>
          </div>
          <div className="space-y-2">
            {recentMessages.length === 0 ? (
              <p className="card-elevated rounded-[14px] px-3 py-3 text-sm text-secondary">No messages yet.</p>
            ) : (
              recentMessages.map((message) => (
                <button
                  key={message.id}
                  onClick={() => enqueuePromptAndGoToChat(message.content)}
                  type="button"
                  className="card-interactive w-full rounded-[14px] px-3 py-3 text-left text-sm text-primary"
                >
                  {message.role === 'user' ? 'You' : message.agent ?? 'Assistant'}: {message.content}
                </button>
              ))
            )}
          </div>
          <div className="card-elevated mt-3 rounded-[14px] px-3 py-2 text-xs text-[#cde4ff]">
            {activeAlerts.length} active alert(s) require review.
          </div>
        </article>
      </section>
    </main>
  );
}
