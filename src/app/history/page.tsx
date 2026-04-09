'use client';

import { useEffect, useMemo } from 'react';
import { Clock3 } from 'lucide-react';
import { useAppStore, type HistoryEntry } from '../store/app-store';

type GroupLabel = 'Today' | 'Yesterday' | 'Earlier';

const toDayStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

const getGroupLabel = (createdAt: string): GroupLabel => {
  const eventDay = toDayStart(new Date(createdAt));
  const today = toDayStart(new Date());
  const yesterday = today - 24 * 60 * 60 * 1000;
  if (eventDay === today) return 'Today';
  if (eventDay === yesterday) return 'Yesterday';
  return 'Earlier';
};

export default function HistoryPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const history = useAppStore((s) => s.history);
  const enqueuePromptAndGoToChat = useAppStore((s) => s.enqueuePromptAndGoToChat);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  const grouped = useMemo(() => {
    const groups: Record<GroupLabel, HistoryEntry[]> = { Today: [], Yesterday: [], Earlier: [] };
    history.forEach((entry) => groups[getGroupLabel(entry.createdAt)].push(entry));
    return groups;
  }, [history]);

  return (
    <main className="screen app-bg">
      <section className="card-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-white/5 p-2.5 text-[#cde4ff]"><Clock3 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-primary">History</h1>
            <p className="text-sm text-secondary">Today, yesterday, and earlier timeline of operator actions.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="card-elevated px-4 py-4 text-sm text-secondary">No timeline yet. Chat, alerts, and agents will appear here.</div>
        ) : (
          <div className="space-y-4">
            {(['Today', 'Yesterday', 'Earlier'] as GroupLabel[]).map((label) => (
              <div key={label}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">{label}</h2>
                <div className="space-y-2">
                  {grouped[label].length === 0 ? (
                    <p className="card-elevated px-3 py-3 text-xs text-secondary">No entries</p>
                  ) : (
                    grouped[label].map((entry) => (
                      <button key={entry.id} onClick={() => enqueuePromptAndGoToChat(entry.prompt ?? `Continue this context: ${entry.title}. ${entry.description}`)} type="button" className="card-interactive w-full rounded-[14px] px-3 py-3 text-left">
                        <p className="text-sm font-medium text-primary">{entry.title}</p>
                        <p className="text-xs text-secondary">{entry.description}</p>
                        <p className="mt-1 text-[11px] text-secondary">{new Date(entry.createdAt).toLocaleString()}</p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
