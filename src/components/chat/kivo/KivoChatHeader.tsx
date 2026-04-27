'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, UserRound, X } from 'lucide-react';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

type CreditSnapshot = {
  plan?: 'free' | 'plus' | 'pro';
  credits?: number;
  monthlyCredits?: number;
  freeCredits?: number;
  monthlyUsed?: number;
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
      const duration = 520;

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(Math.round(startValue + diff * eased));
        if (progress < 1) frameRef.current = window.requestAnimationFrame(tick);
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

export default function KivoChatHeader({ hasMessages = false }: Props) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<CreditSnapshot | null>(null);
  const [credits, setCredits] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pulse, setPulse] = useState(false);
  const previousCreditsRef = useRef<number | null>(null);
  const animatedCredits = useAnimatedNumber(credits);

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
          setPulse(true);
          if (pulseTimer) window.clearTimeout(pulseTimer);
          pulseTimer = window.setTimeout(() => setPulse(false), 520);
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

  const monthlyCredits = Number(snapshot?.monthlyCredits ?? 0);
  const monthlyUsed = Number(snapshot?.monthlyUsed ?? 0);
  const monthlyRemaining = Math.max(0, monthlyCredits - monthlyUsed);
  const freeCredits = Number(snapshot?.freeCredits ?? 0);

  const openUsageSheet = () => {
    window.navigator.vibrate?.(8);
    setSheetOpen(true);
  };

  return (
    <>
      <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
          <button
            type="button"
            onClick={() => router.push('/library')}
            aria-label="Open library"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] transition-transform duration-200 active:scale-[0.93]"
          >
            <UserRound className="h-[23px] w-[23px]" strokeWidth={2.05} />
          </button>

          <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">
            {hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}
          </div>

          <button
            type="button"
            onClick={openUsageSheet}
            aria-label={`Credits balance ${credits}`}
            className={`inline-flex h-[39px] min-w-[78px] items-center justify-center gap-[7px] rounded-full border border-[#DCDCDC] bg-[#F5F5F3]/82 px-[12px] text-[18px] font-semibold leading-none tracking-[-0.055em] text-[#343434] shadow-[0_0_0_1px_rgba(0,0,0,0.035),inset_0_1px_0_rgba(255,255,255,0.84)] backdrop-blur-2xl transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out active:scale-[0.94] ${pulse ? 'scale-[1.045] border-[#CFCFCF] bg-white/92' : ''}`}
          >
            <Sparkles className={`h-[24px] w-[24px] shrink-0 text-[#111111] transition-transform duration-500 ease-out ${pulse ? 'rotate-[-12deg] scale-110' : ''}`} strokeWidth={2.08} />
            <span className="relative inline-flex h-[22px] min-w-[28px] items-center justify-center overflow-hidden tabular-nums">
              <span key={animatedCredits}>{animatedCredits}</span>
            </span>
          </button>
        </div>
      </header>

      {sheetOpen ? (
        <div className="fixed inset-0 z-[999] flex items-end justify-center bg-[#101827]/24 px-0 backdrop-blur-[2px]" onClick={() => setSheetOpen(false)}>
          <section
            className="relative flex max-h-[calc(100dvh-72px)] w-full max-w-[560px] flex-col overflow-hidden rounded-t-[34px] border border-white/65 bg-[#F8FAFE]/96 text-[#131A25] shadow-[0_-24px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 12px)' }}
          >
            <div className="shrink-0 border-b border-black/[0.035] bg-[#F8FAFE]/94 px-5 pb-4 pt-3 backdrop-blur-2xl">
              <div className="mx-auto mb-3 h-1.5 w-11 rounded-full bg-black/14" />
              <div className="grid grid-cols-[44px_1fr_44px] items-center">
                <button type="button" onClick={() => setSheetOpen(false)} className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#202833] active:scale-95">
                  <X className="h-7 w-7" strokeWidth={2.15} />
                </button>
                <h2 className="text-center text-[22px] font-semibold tracking-[-0.045em]">Usage</h2>
                <div />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-5">
              <div className="rounded-[31px] border border-white/70 bg-gradient-to-br from-[#EEF3FA] via-[#F8FAFE] to-[#E8EDF7] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_20px_58px_rgba(31,41,55,0.07)]">
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
                    </div>
                    <span className="text-[20px] font-semibold tabular-nums tracking-[-0.035em]">{credits}</span>
                  </div>
                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]"><span>Free credits</span><span>{freeCredits}</span></div>
                  <div className="flex items-center justify-between text-[18px] tracking-[-0.04em] text-[#727985]"><span>Monthly credits</span><span>{monthlyRemaining} / {monthlyCredits}</span></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
