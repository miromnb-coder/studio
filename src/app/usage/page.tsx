'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, HelpCircle, Sparkles, X } from 'lucide-react';

type LedgerItem = { id?: string; createdAt?: string; title: string; amount: number };
type Account = { plan?: 'free' | 'plus' | 'pro'; credits?: number; dailyRefreshCredits?: number; monthlyCredits?: number; monthlyUsed?: number; history?: LedgerItem[] };

function planName(plan?: string) {
  if (plan === 'pro') return 'Kivo Pro';
  if (plan === 'plus') return 'Kivo Plus';
  return 'Kivo Free';
}

function dayLabel(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function UsagePage() {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/credits', { cache: 'no-store' });
        if (res.ok && alive) setAccount(await res.json());
      } catch {}
    }
    load();
    const id = window.setInterval(load, 15000);
    return () => { alive = false; window.clearInterval(id); };
  }, []);

  const plan = account?.plan ?? 'free';
  const credits = account?.credits ?? 100;
  const monthlyCredits = account?.monthlyCredits ?? (plan === 'pro' ? 8000 : plan === 'plus' ? 3000 : 0);
  const monthlyUsed = account?.monthlyUsed ?? 0;
  const dailyRefresh = account?.dailyRefreshCredits ?? 100;
  const history = account?.history?.length ? account.history : [
    { title: 'Daily refresh credits', amount: dailyRefresh, createdAt: new Date().toISOString() },
  ];

  return (
    <div className="min-h-[100dvh] bg-black text-[#242424]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[560px] items-end bg-black">
        <main className="relative w-full rounded-t-[28px] bg-[#eeeeee] pb-[calc(28px+env(safe-area-inset-bottom))] shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
          <div className="absolute left-8 right-8 top-[-18px] h-8 rounded-t-[18px] bg-white/65" />

          <header className="relative flex h-[72px] items-center justify-center px-5">
            <button type="button" onClick={() => router.push('/chat')} aria-label="Close" className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#242424] active:scale-95">
              <X className="h-7 w-7" strokeWidth={2.2} />
            </button>
            <h1 className="text-[20px] font-semibold tracking-[-0.035em] text-[#111]">Usage</h1>
          </header>

          <div className="max-h-[calc(100dvh-72px)] overflow-y-auto px-4 pb-4">
            <section className="rounded-[22px] bg-[#dedede] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-[25px] font-semibold tracking-[-0.035em]">{planName(plan)}</h2>
                  <p className="mt-1 text-[15px] text-black/55">{plan === 'free' ? 'Daily refresh' : 'Renewal date'} <span className="ml-2 text-[#242424]">Live balance</span></p>
                </div>
                <button type="button" onClick={() => router.push('/upgrade')} className="rounded-full bg-black/10 px-5 py-2 text-[17px] font-medium text-[#242424] active:scale-95">Upgrade</button>
              </div>

              <div className="my-5 border-t border-dashed border-black/10" />

              <div className="space-y-4 text-[17px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium"><Sparkles className="h-6 w-6" />Credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                  <span className="font-semibold">{credits}</span>
                </div>
                <div className="flex items-center justify-between text-black/55"><span>Free credits</span><span>{plan === 'free' ? credits : 0}</span></div>
                <div className="flex items-center justify-between text-black/55"><span>Monthly credits</span><span>{monthlyCredits ? `${Math.max(0, monthlyCredits - monthlyUsed)} / ${monthlyCredits}` : '0'}</span></div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-medium"><CalendarDays className="h-6 w-6" />Daily refresh credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                  <span className="font-semibold">{plan === 'free' ? dailyRefresh : 0}</span>
                </div>
              </div>
            </section>

            <section className="mt-7">
              <div className="flex items-center justify-between">
                <h2 className="text-[25px] font-semibold tracking-[-0.045em]">Credits history</h2>
                <span className="text-[16px] text-black/45">UTC+3 <HelpCircle className="inline h-4 w-4" /></span>
              </div>

              <div className="mt-4 space-y-5">
                {history.map((item, index) => (
                  <div key={item.id ?? `${item.title}-${index}`} className="border-b border-black/[0.07] pb-4 last:border-b-0">
                    <p className="mb-3 text-[16px] text-black/38">{dayLabel(item.createdAt)}</p>
                    <div className="flex items-center justify-between gap-3 text-[18px] tracking-[-0.02em]">
                      <span className="min-w-0 truncate">{item.title}</span>
                      <span>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
