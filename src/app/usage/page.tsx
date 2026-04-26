'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, HelpCircle, Sparkles, X } from 'lucide-react';

type HistoryItem = {
  id?: string;
  createdAt?: string;
  title: string;
  amount: number;
};

type CreditAccount = {
  plan?: 'free' | 'plus' | 'pro';
  credits?: number;
  dailyRefreshCredits?: number;
  monthlyCredits?: number;
  monthlyUsed?: number;
  history?: HistoryItem[];
};

export default function UsagePage() {
  const router = useRouter();
  const [account, setAccount] = useState<CreditAccount | null>(null);

  useEffect(() => {
    async function loadCredits() {
      try {
        const res = await fetch('/api/credits', { cache: 'no-store' });
        if (res.ok) setAccount(await res.json());
      } catch {}
    }

    loadCredits();
    const id = window.setInterval(loadCredits, 15000);
    return () => window.clearInterval(id);
  }, []);

  const plan = account?.plan ?? 'free';
  const credits = account?.credits ?? 100;
  const dailyRefresh = account?.dailyRefreshCredits ?? 100;
  const monthlyCredits =
    account?.monthlyCredits ?? (plan === 'pro' ? 8000 : plan === 'plus' ? 3000 : 0);
  const monthlyUsed = account?.monthlyUsed ?? 0;

  const planName =
    plan === 'pro' ? 'Kivo Pro' : plan === 'plus' ? 'Kivo Plus' : 'Kivo Free';

  const history =
    account?.history?.length
      ? account.history
      : [
          {
            title: 'Daily refresh credits',
            amount: dailyRefresh,
            createdAt: new Date().toISOString(),
          },
        ];

  return (
    <main className="min-h-[100dvh] bg-black text-[#252525]">
      <div className="mx-auto flex min-h-[100dvh] max-w-[560px] items-end bg-black">
        <section className="relative min-h-[calc(100dvh-88px)] w-full rounded-t-[28px] bg-[#eeeeec] px-5 pb-[calc(28px+env(safe-area-inset-bottom))] pt-4">
          <div className="absolute left-8 right-8 top-[-18px] h-[18px] rounded-t-[18px] bg-white/70" />

          <header className="relative mb-7 flex h-12 items-center justify-center">
            <button
              type="button"
              onClick={() => router.push('/chat')}
              className="absolute left-0 flex h-11 w-11 items-center justify-center rounded-full active:scale-95"
              aria-label="Close usage"
            >
              <X className="h-7 w-7" strokeWidth={2.2} />
            </button>

            <h1 className="text-[20px] font-semibold tracking-[-0.04em]">
              Usage
            </h1>
          </header>

          <section className="rounded-[22px] bg-[#dededc] p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-[25px] font-semibold tracking-[-0.04em]">
                  {planName}
                </h2>
                <p className="mt-1 text-[15px] text-black/50">
                  {plan === 'free' ? 'Daily refresh' : 'Renewal date'}{' '}
                  <span className="ml-2 text-black/75">
                    {plan === 'free' ? 'Tomorrow' : 'May 03, 2026'}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push('/upgrade')}
                className="rounded-full bg-black/10 px-5 py-2 text-[17px] font-medium active:scale-95"
              >
                Upgrade
              </button>
            </div>

            <div className="my-5 border-t border-dashed border-black/10" />

            <div className="space-y-4 text-[17px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <Sparkles className="h-6 w-6" />
                  Credits
                  <HelpCircle className="h-4 w-4 text-black/35" />
                </div>
                <span className="font-semibold">{credits}</span>
              </div>

              <div className="flex items-center justify-between text-black/50">
                <span>Free credits</span>
                <span>{plan === 'free' ? credits : 0}</span>
              </div>

              <div className="flex items-center justify-between text-black/50">
                <span>Monthly credits</span>
                <span>
                  {monthlyCredits
                    ? `${Math.max(0, monthlyCredits - monthlyUsed)} / ${monthlyCredits}`
                    : '0'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <CalendarDays className="h-6 w-6" />
                  Daily refresh credits
                  <HelpCircle className="h-4 w-4 text-black/35" />
                </div>
                <span className="font-semibold">
                  {plan === 'free' ? dailyRefresh : 0}
                </span>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h2 className="text-[25px] font-semibold tracking-[-0.045em]">
                Credits history
              </h2>
              <span className="text-[16px] text-black/45">UTC+3</span>
            </div>

            <div className="mt-4 space-y-5">
              {history.map((item, index) => (
                <div
                  key={item.id ?? `${item.title}-${index}`}
                  className="border-b border-black/[0.07] pb-4 last:border-b-0"
                >
                  <p className="mb-3 text-[16px] text-black/38">
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Today'}
                  </p>

                  <div className="flex items-center justify-between gap-3 text-[18px] tracking-[-0.02em]">
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
