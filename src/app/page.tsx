'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, LogOut, Send, Sparkles } from 'lucide-react';
import { useAppStore, type HistoryEntry } from './store/app-store';

const smartSuggestions = [
  'Help me plan my week with clear priorities.',
  'Compare two options and recommend the better one.',
  'Explain this concept deeply but simply.',
  'Create an action plan for my next product launch.',
];

export default function HomePage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const history = useAppStore((s) => s.history);
  const alerts = useAppStore((s) => s.alerts);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);
  const updateUserName = useAppStore((s) => s.updateUserName);
  const logout = useAppStore((s) => s.logout);

  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const recentActivity = useMemo(() => history.slice(0, 4), [history]);
  const activeAlerts = useMemo(() => alerts.filter((item) => !item.resolved), [alerts]);
  const userName = user?.name || 'there';

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    enqueuePromptAndGoToChat(prompt);
    setPrompt('');
  };

  const editName = () => {
    const nextName = window.prompt('Edit name', user?.name || '');
    if (nextName?.trim()) updateUserName(nextName.trim());
  };

  const openHistoryItem = (item: HistoryEntry) => {
    if (item.prompt) return enqueuePromptAndGoToChat(item.prompt);
    enqueuePromptAndGoToChat(`Continue from this context: ${item.title}. ${item.description}`);
  };

  return (
    <main className="screen app-bg">
      <section className="mb-4 rounded-2xl bg-[#f7f7f7] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#ececec] p-2 text-[#303030]"><Sparkles className="h-4 w-4" /></div>
            <div>
              <p className="text-lg font-semibold text-primary">Kivo</p>
              <p className="text-xs text-secondary">A calm, smart assistant for daily work</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={editName} type="button" className="tap-feedback rounded-full px-3 py-2 text-xs text-secondary">Edit</button>
            <Link href="/alerts" className="tap-feedback rounded-full p-2 text-secondary"><Bell className="h-5 w-5" /></Link>
            <button type="button" onClick={logout} className="tap-feedback rounded-full p-2 text-secondary"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>
      </section>

      <section className="space-y-3 pb-3">
        <header className="px-1">
          <h1 className="text-[1.8rem] font-semibold tracking-tight text-primary">Hi {userName} 👋</h1>
          <p className="text-sm text-secondary">What should Kivo help you with right now?</p>
        </header>

        <article className="rounded-2xl bg-[#f7f7f7] p-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="system-input w-full resize-none border-black/10 bg-[#f2f2f2] px-3 py-2 text-sm"
            placeholder="Ask Kivo anything..."
          />
          <div className="mt-2 flex justify-end">
            <button onClick={submitPrompt} type="button" className="btn-primary tap-feedback inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50" disabled={!prompt.trim()}>
              <Send className="h-4 w-4" /> Start
            </button>
          </div>
        </article>

        <article className="rounded-2xl bg-[#f7f7f7] p-4">
          <h2 className="mb-2 text-sm font-semibold text-secondary">Smart suggestions</h2>
          <div className="space-y-2">
            {smartSuggestions.map((starter) => (
              <button key={starter} onClick={() => enqueuePromptAndGoToChat(starter)} className="w-full rounded-xl bg-[#f2f2f2] px-3 py-3 text-left text-sm text-primary" type="button">
                {starter}
              </button>
            ))}
          </div>
        </article>

        <article className="rounded-2xl bg-[#f7f7f7] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <Link href="/chat" className="text-xs font-semibold text-secondary">Open Chat</Link>
          </div>
          <div className="space-y-2">
            {recentActivity.length === 0 ? (
              <p className="rounded-xl bg-[#f2f2f2] px-3 py-3 text-sm text-secondary">No recent activity yet.</p>
            ) : (
              recentActivity.map((item) => (
                <button key={item.id} type="button" onClick={() => openHistoryItem(item)} className="w-full rounded-xl bg-[#f2f2f2] px-3 py-3 text-left">
                  <p className="text-sm font-medium text-primary">{item.title}</p>
                  <p className="text-xs text-secondary">{item.description}</p>
                </button>
              ))
            )}
          </div>
          <p className="mt-3 text-xs text-secondary">{activeAlerts.length} active alert(s) need attention.</p>
        </article>
      </section>
    </main>
  );
}
