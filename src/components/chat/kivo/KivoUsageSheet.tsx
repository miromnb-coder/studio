'use client';

import { CalendarDays, HelpCircle, Sparkles, X } from 'lucide-react';

type LedgerItem = { id?: string; createdAt?: string; title: string; amount: number };
type CreditAccount = {
  plan?: 'free' | 'plus' | 'pro';
  credits?: number;
  dailyRefreshCredits?: number;
  monthlyCredits?: number;
  monthlyUsed?: number;
  nextRefreshType?: 'daily' | 'monthly';
  history?: LedgerItem[];
};

type Props = { open: boolean; onClose: () => void; onUpgrade: () => void; account?: CreditAccount | null; credits?: number };

function planTitle(plan?: string) {
  if (plan === 'pro') return 'Kivo Pro';
  if (plan === 'plus') return 'Kivo Plus';
  return 'Kivo Free';
}

function dateLabel(value?: string) {
  if (!value) return 'Today';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Today';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function KivoUsageSheet({ open, onClose, onUpgrade, account, credits = 77 }: Props) {
  if (!open) return null;
  const balance = account?.credits ?? credits;
  const plan = account?.plan ?? 'free';
  const monthlyCredits = account?.monthlyCredits ?? (plan === 'pro' ? 8000 : plan === 'plus' ? 3000 : 0);
  const monthlyUsed = account?.monthlyUsed ?? 0;
  const dailyRefresh = account?.dailyRefreshCredits ?? 100;
  const history = account?.history?.length ? account.history : [
    { title: 'Daily refresh credits', amount: dailyRefresh, createdAt: new Date().toISOString() },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <button aria-label="Close usage" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-[91] w-full max-w-[560px] overflow-hidden rounded-t-[28px] bg-[#eeeeee] pb-[calc(18px+env(safe-area-inset-bottom))] shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
        <div className="absolute left-8 right-8 top-[-18px] h-8 rounded-t-[18px] bg-white/65" />
        <header className="relative flex h-[72px] items-center justify-center px-5">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#242424] active:scale-95">
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
          <h2 className="text-[20px] font-semibold tracking-[-0.035em] text-[#111]">Usage</h2>
        </header>

        <main className="max-h-[calc(100dvh-120px)] overflow-y-auto px-4 pb-4">
          <section className="rounded-[22px] bg-[#dedede] p-5 text-[#242424]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-[25px] font-semibold tracking-[-0.035em]">{planTitle(plan)}</h3>
                <p className="mt-1 text-[15px] text-black/55">{plan === 'free' ? 'Daily refresh' : 'Monthly credits'} · live balance</p>
              </div>
              <button type="button" onClick={onUpgrade} className="rounded-full bg-black/10 px-5 py-2 text-[17px] font-medium text-[#242424] active:scale-95">Upgrade</button>
            </div>

            <div className="my-5 border-t border-dashed border-black/10" />

            <div className="space-y-4 text-[17px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium"><Sparkles className="h-6 w-6" />Credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                <span className="font-semibold">{balance}</span>
              </div>
              <div className="flex items-center justify-between text-black/55"><span>Free credits</span><span>{plan === 'free' ? balance : 0}</span></div>
              <div className="flex items-center justify-between text-black/55"><span>Monthly credits</span><span>{monthlyCredits ? `${Math.max(0, monthlyCredits - monthlyUsed)} / ${monthlyCredits}` : '0'}</span></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium"><CalendarDays className="h-6 w-6" />Daily refresh credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                <span className="font-semibold">{plan === 'free' ? dailyRefresh : 0}</span>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="text-[25px] font-semibold tracking-[-0.045em] text-[#242424]">Credits history</h3>
              <span className="text-[16px] text-black/45">UTC+3</span>
            </div>

            <div className="mt-4 space-y-5">
              {history.map((item, index) => (
                <div key={item.id ?? `${item.title}-${index}`} className="border-b border-black/[0.07] pb-4 last:border-b-0">
                  <p className="mb-3 text-[16px] text-black/38">{dateLabel(item.createdAt)}</p>
                  <div className="flex items-center justify-between gap-3 text-[18px] tracking-[-0.02em] text-[#242424]">
                    <span className="min-w-0 truncate">{item.title}</span>
                    <span>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
