'use client';

import { Clock3 } from 'lucide-react';

type GroupLabel = 'Today' | 'Yesterday' | 'Earlier';

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function groupLabel(createdAt: string): GroupLabel {
  const eventDay = toDayStart(new Date(createdAt));
  const now = new Date();
  const today = toDayStart(now);
  const yesterday = today - 24 * 60 * 60 * 1000;

  if (eventDay === today) return 'Today';
  if (eventDay === yesterday) return 'Yesterday';
  return 'Earlier';
}

function formatEventTime(createdAt: string) {
  return new Date(createdAt).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const router = useRouter();

  const groupedEvents = useMemo(() => {
    const events = readHistoryEvents().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const groups: Record<GroupLabel, HistoryEvent[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    events.forEach((event) => {
      groups[groupLabel(event.createdAt)].push(event);
    });

    return groups;
  }, []);

  const openHistoryEvent = (event: HistoryEvent) => {
    restoreHistoryToChat(event);
    router.push('/chat');
  };

  return (
    <main className="screen bg-[#f8fafc]">
      <section className="surface-card p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-slate-100 p-2.5 text-slate-500"><Clock3 className="h-5 w-5" /></div>
          <div>
            <h1 className="text-2xl font-semibold">History</h1>
            <p className="text-sm text-slate-500">Recent runs, summaries, and saved outputs.</p>
          </div>
        </div>

        <div className="space-y-3">
          {historyItems.map((item, index) => (
            <div key={item} className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-700">{index + 1}. {item}</div>
          ))}
        </div>
      </section>
    </main>
  );
}
