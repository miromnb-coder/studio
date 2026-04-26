'use client';

import { X, Sparkles, CalendarDays, HelpCircle } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  credits?: number;
};

const HISTORY = [
  { date: 'Today', items: [{ title: 'Personal agent task', amount: -8 }, { title: 'Calendar check', amount: -3 }] },
  { date: 'Yesterday', items: [{ title: 'Memory search', amount: -2 }, { title: 'Kivo planning', amount: -12 }] },
  { date: 'This week', items: [{ title: 'Daily refresh credits', amount: 100 }, { title: 'Gmail priority scan', amount: -5 }] },
];

export function KivoUsageSheet({ open, onClose, onUpgrade, credits = 77 }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/35 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <button aria-label="Close usage" className="absolute inset-0" onClick={onClose} />
      <div className="relative z-[91] w-full max-w-[560px] overflow-hidden rounded-t-[28px] bg-[#f1f1f1] pb-[calc(20px+env(safe-area-inset-bottom))] shadow-[0_-18px_70px_rgba(0,0,0,0.22)]">
        <div className="absolute left-8 right-8 top-[-18px] h-8 rounded-t-[18px] bg-white/65" />
        <header className="relative flex h-[72px] items-center justify-center px-5">
          <button type="button" onClick={onClose} aria-label="Close" className="absolute left-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-[#242424] active:scale-95">
            <X className="h-7 w-7" strokeWidth={2.2} />
          </button>
          <h2 className="text-[20px] font-semibold tracking-[-0.035em] text-[#111]">Usage</h2>
        </header>

        <main className="max-h-[calc(100dvh-120px)] overflow-y-auto px-4 pb-4">
          <section className="rounded-[22px] bg-[#e4e4e4] p-5 text-[#242424]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-[25px] font-semibold tracking-[-0.035em]">Kivo Free</h3>
                <p className="mt-1 text-[15px] text-black/55">Daily refresh · renews tomorrow</p>
              </div>
              <button onClick={onUpgrade} className="rounded-full bg-black/10 px-5 py-2 text-[17px] font-medium text-[#242424] active:scale-95">Upgrade</button>
            </div>

            <div className="my-5 border-t border-dashed border-black/10" />

            <div className="space-y-4 text-[17px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium"><Sparkles className="h-6 w-6" />Credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                <span className="font-semibold">{credits}</span>
              </div>
              <div className="flex items-center justify-between text-black/55"><span>Free credits</span><span>0</span></div>
              <div className="flex items-center justify-between text-black/55"><span>Daily credits</span><span>{credits} / 100</span></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium"><CalendarDays className="h-6 w-6" />Daily refresh credits <HelpCircle className="h-4 w-4 text-black/35" /></div>
                <span className="font-semibold">100</span>
              </div>
            </div>
          </section>

          <section className="mt-7">
            <div className="flex items-center justify-between">
              <h3 className="text-[25px] font-semibold tracking-[-0.045em] text-[#242424]">Credits history</h3>
              <span className="text-[16px] text-black/45">UTC+3</span>
            </div>

            <div className="mt-4 space-y-5">
              {HISTORY.map((group) => (
                <div key={group.date} className="border-b border-black/7 pb-4 last:border-b-0">
                  <p className="mb-3 text-[16px] text-black/38">{group.date}</p>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <div key={item.title} className="flex items-center justify-between gap-3 text-[18px] tracking-[-0.02em] text-[#242424]">
                        <span className="min-w-0 truncate">{item.title}</span>
                        <span className={item.amount > 0 ? 'text-[#242424]' : 'text-[#242424]'}>{item.amount > 0 ? `+${item.amount}` : item.amount}</span>
                      </div>
                    ))}
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
