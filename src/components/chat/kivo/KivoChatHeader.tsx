'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, HelpCircle, Sparkles, X } from 'lucide-react';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

type CreditHistoryItem = {
  id: string;
  title: string;
  amount: number;
  reason?: string;
  created_at: string;
  status?: string;
};

type CreditSnapshot = {
  plan?: 'free' | 'plus' | 'pro';
  credits?: number;
  monthlyCredits?: number;
  freeCredits?: number;
  monthlyUsed?: number;
  history?: CreditHistoryItem[];
};

function useAnimatedNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);

    setDisplayValue((currentValue) => {
      const startValue = currentValue;
      const diff = value - startValue;
      if (diff === 0) return currentValue;

      const startedAt = performance.now();
      const duration = 620;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(startValue + diff * eased));

        if (progress < 1) {
          frameRef.current = window.requestAnimationFrame(tick);
        }
      };

      frameRef.current = window.requestAnimationFrame(tick);
      return currentValue;
    });

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return displayValue;
}

function formatPlan(plan?: string) {
  if (plan === 'pro') return 'Kivo Pro';
  if (plan === 'plus') return 'Kivo Plus';
  return 'Kivo Free';
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupHistory(history: CreditHistoryItem[]) {
  return history.reduce<Record<string, CreditHistoryItem[]>>((groups, item) => {
    const label = formatDateLabel(item.created_at);
    groups[label] = groups[label] || [];
    groups[label].push(item);
    return groups;
  }, {});
}

export default function KivoChatHeader({ hasMessages = false, onSidebarToggle }: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [creditPulse, setCreditPulse] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const previousCreditsRef = useRef<number | null>(null);
  const animatedCredits = useAnimatedNumber(credits);

  const monthlyCredits = Number(snapshot?.monthlyCredits ?? 0);
  const monthlyUsed = Number(snapshot?.monthlyUsed ?? 0);
  const monthlyRemaining = Math.max(0, monthlyCredits - monthlyUsed);
  const freeCredits = Number(snapshot?.freeCredits ?? 0);
  const dailyRefreshCredits = snapshot?.plan === 'free' ? freeCredits : 0;
  const history = snapshot?.history ?? [];
  const groupedHistory = useMemo(() => groupHistory(history), [history]);

  const glowClass = useMemo(() => {
    if (credits >= 1000) return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),0_8px_24px_rgba(124,58,237,0.18)]';
    if (credits >= 500) return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),0_6px_18px_rgba(59,130,246,0.13)]';
    return 'shadow-[0_0_0_1px_rgba(0,0,0,0.035),inset_0_1px_0_rgba(255,255,255,0.84)]';
  }, [credits]);

  useEffect(() => {
    let mounted = true;
    let pulseTimer: ReturnType<typeof window.setTimeout> | undefined;

    const loadCredits = async () => {
      try {
        const response = await fetch('/api/credits', { cache: 'no-store' });
        if (!response.ok) return;
        const data: CreditSnapshot = await response.json();
        const nextCredits = Number(data?.credits ?? 0);

        if (!mounted) return;

        setSnapshot(data);
        setCredits(nextCredits);

        if (previousCreditsRef.current !== null && previousCreditsRef.current !== nextCredits) {
          setCreditPulse(true);
          if (pulseTimer) window.clearTimeout(pulseTimer);
          pulseTimer = window.setTimeout(() => setCreditPulse(false), 560);
        }

        previousCreditsRef.current = nextCredits;
      } catch {
        // Keep the header quiet if credits are unavailable.
      }
    };

    loadCredits();
    const intervalId = window.setInterval(loadCredits, 15000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      if (pulseTimer) window.clearTimeout(pulseTimer);
    };
  }, []);

  const openCreditSheet = () => {
    if (typeof window !== 'undefined' && 'navigator' in window) {
      window.navigator.vibrate?.(8);
    }
    setSheetOpen(true);
  };

  return (
    <>
      <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
          <button type="button" onClick={onSidebarToggle ?? (() => router.push('/home'))} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] active:scale-[0.96]">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
          <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">{hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}</div>
          <button
            type="button"
            onClick={openCreditSheet}
            aria-label={`Credits balance ${credits}`}
            className={`inline-flex h-[39px] min-w-[78px] items-center justify-center gap-[7px] rounded-full border border-[#DCDCDC] bg-[#F5F5F3]/82 px-[12px] text-[18px] font-semibold leading-none tracking-[-0.055em] text-[#343434] backdrop-blur-2xl transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out active:scale-[0.94] ${glowClass} ${creditPulse ? 'scale-[1.045] border-[#CFCFCF] bg-white/92' : ''}`}
          >
            <Sparkles className={`h-[24px] w-[24px] shrink-0 text-[#111111] transition-transform duration-500 ease-out ${creditPulse ? 'rotate-[-12deg] scale-110' : ''}`} strokeWidth={2.08} />
            <span className="relative inline-flex h-[22px] min-w-[28px] items-center justify-center overflow-hidden tabular-nums">
              <span key={animatedCredits} className={`block transition-[transform,opacity,filter] duration-300 ease-out ${creditPulse ? 'translate-y-0 scale-105 opacity-100' : 'translate-y-0 scale-100 opacity-100'}`}>
                {animatedCredits}
              </span>
            </span>
          </button>
        </div>
      </header>

      {sheetOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#101827]/24 px-0 backdrop-blur-[2px]" onClick={() => setSheetOpen(false)}>
          <section
            className="relative max-h-[calc(100dvh-72px)] w-full max-w-[560px] animate-[slideIn_220ms_ease-out] overflow-hidden rounded-t-[32px] border border-white/55 bg-[#F7F8FB]/95 text-[#131A25] shadow-[0_-20px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
          >
            <div className="absolute left-7 right-7 top-[-18px] h-[24px] rounded-t-[24px] bg-white/50 blur-[1px]" />
            <div className="sticky top-0 z-10 border-b border-black/[0.035] bg-[#F7F8FB]/88 px-5 pb-4 pt-3 backdrop-blur-2xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/12" />
              <div className="grid grid-cols-[44px_1fr_44px] items-center">
                <button type="button" onClick={() => setSheetOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#202833] active:scale-95">
                  <X className="h-7 w-7" strokeWidth={2.15} />
                </button>
                <h2 className="text-center text-[22px] font-semibold tracking-[-0.045em]">Usage</h2>
                <div />
              </div>
            </div>

            <div className="max-h-[calc(100dvh-150px)] overflow-y-auto px-4 pb-8 pt-5">
              <div className="rounded-[28px] border border-black/[0.055] bg-gradient-to-br from-[#EEF3FA] via-[#F4F6FA] to-[#ECEFF5] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_18px_50px_rgba(31,41,55,0.055)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-[28px] font-bold tracking-[-0.045em] text-[#20242C]">{formatPlan(snapshot?.plan)}</h3>
                    <p className="mt-1 text-[15px] font-medium text-[#6D7480]">Next refresh&nbsp;&nbsp;<span className="text-[#343B46]">Auto monthly</span></p>
                  </div>
                  <button type="button" onClick={() => router.push('/upgrade')} className="rounded-full bg-black/[0.075] px-5 py-2.5 text-[16px] font-semibold tracking-[-0.03em] text-[#2E3440] active:scale-[0.97]">
                    Upgrade
                  </button>
                </div>

                <div className="my-5 border-t border-dashed border-black/[0.09]" />

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 text-[20px] font-semibold tracking-[-0.045em]">
                      <Sparkles className="h-7 w-7 text-[#151A22]" strokeWidth={2.08} />
                      <span>Credits</span>
                      <HelpCircle className="h-5 w-5 text-[#8A919C]" strokeWidth={2.1} />
                    </div>
                    <span className="text-[20px] font-semibold tabular-nums tracking-[-0.035em]">{credits}</span>
                  </div>

                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]">
                    <span>Free credits</span>
                    <span className="tabular-nums">{freeCredits}</span>
                  </div>

                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]">
                    <span>Monthly credits</span>
                    <span className="tabular-nums">{monthlyRemaining} / {monthlyCredits}</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.045em]">
                      <CalendarDays className="h-7 w-7 text-[#1D2530]" strokeWidth={2.05} />
                      <span>Daily refresh credits</span>
                      <HelpCircle className="h-5 w-5 text-[#8A919C]" strokeWidth={2.1} />
                    </div>
                    <span className="text-[20px] font-semibold tabular-nums tracking-[-0.035em]">{dailyRefreshCredits}</span>
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center justify-between px-1">
                <h3 className="text-[26px] font-semibold tracking-[-0.055em]">Credits history</h3>
                <div className="flex items-center gap-1.5 text-[16px] font-medium text-[#8A919C]">
                  <span>UTC+3</span>
                  <HelpCircle className="h-5 w-5" strokeWidth={2.1} />
                </div>
              </div>

              <div className="mt-4 space-y-5 px-1">
                {Object.entries(groupedHistory).length ? (
                  Object.entries(groupedHistory).map(([date, items]) => (
                    <section key={date} className="border-b border-black/[0.06] pb-4 last:border-b-0">
                      <p className="mb-3 text-[16px] font-medium tracking-[-0.02em] text-[#8A919C]">{date}</p>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-4">
                            <p className="truncate text-[19px] font-medium tracking-[-0.045em] text-[#242A33]">{item.title || item.reason || 'Credit event'}</p>
                            <p className={`text-[19px] font-semibold tabular-nums tracking-[-0.035em] ${item.amount > 0 ? 'text-[#167A4A]' : 'text-[#242A33]'}`}>{item.amount > 0 ? `+${item.amount}` : item.amount}</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-black/[0.055] bg-white/65 p-5 text-center text-[15px] font-medium text-[#7B8491]">
                    No credit history yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
