'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarClock, ChevronLeft, Sparkles } from 'lucide-react';

type HistoryItem = { id: string; title: string; amount: number; reason: string; agentTool: string | null; created_at: string; status: 'reserved' | 'charged' | 'refunded' | 'failed' };
type Snapshot = { credits: number; monthlyCredits: number; freeCredits: number; monthlyUsed: number; plan: 'free' | 'plus' | 'pro'; history: HistoryItem[] };

export default function UsagePage() {
  const router = useRouter();
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/credits', { cache: 'no-store' });
      if (!response.ok) return;
      setData(await response.json());
    };
    load();
  }, []);

  const monthlyRemaining = useMemo(() => Math.max(0, (data?.monthlyCredits || 0) - (data?.monthlyUsed || 0)), [data]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#F6F6F4] to-[#EFEFEA] px-4 py-6 text-[#141414] dark:from-[#0B0C11] dark:to-[#131622] dark:text-[#F4F4F5]">
      <section className="mx-auto max-w-[620px]">
        <button onClick={() => router.push('/chat')} className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-white/5"><ChevronLeft className="h-4 w-4" />Back</button>

        <div className="rounded-[30px] border border-black/10 bg-white/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.06)] dark:border-white/10 dark:bg-white/5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
              <p className="mt-1 text-sm text-black/55 dark:text-white/60">Smart credit engine overview</p>
            </div>
            <button onClick={() => router.push('/upgrade')} className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">Upgrade</button>
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-black/10 bg-[#F5F5F2] p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center justify-between text-lg font-semibold"><span className="inline-flex items-center gap-2"><Sparkles className="h-5 w-5" />Credits</span><span>✦ {data?.credits ?? 0}</span></div>
            <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60"><span>Free credits</span><span>{data?.freeCredits ?? 0}</span></div>
            <div className="flex items-center justify-between text-sm text-black/60 dark:text-white/60"><span>Monthly credits</span><span>{monthlyRemaining} / {data?.monthlyCredits ?? 0}</span></div>
            <div className="flex items-center justify-between text-sm"><span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" />Monthly refresh</span><span>Auto</span></div>
          </div>
        </div>

        <div className="mt-6 rounded-[30px] border border-black/10 bg-white/95 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.05)] dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold tracking-tight">Credits history</h2>
            <span className="text-xs text-black/45 dark:text-white/50">UTC</span>
          </div>
          <div className="space-y-3">
            {(data?.history || []).map((item) => (
              <article key={item.id} className="rounded-2xl border border-black/10 bg-white p-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-black/45 dark:text-white/50">{new Date(item.created_at).toLocaleString()} · {item.status}</p>
                  </div>
                  <p className={`text-sm font-semibold ${item.amount >= 0 ? 'text-emerald-600' : 'text-black dark:text-white'}`}>{item.amount >= 0 ? `+${item.amount}` : item.amount}</p>
                </div>
              </article>
            ))}
            {!data?.history?.length ? <p className="text-sm text-black/50 dark:text-white/55">No transactions yet.</p> : null}
          </div>
        </div>
      </section>
    </main>
  );
}
