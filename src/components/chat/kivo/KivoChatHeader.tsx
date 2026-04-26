'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, X } from 'lucide-react';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

function useAnimatedNumber(value: number) {
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number | null>(null);
  const startValueRef = useRef(value);

  useEffect(() => {
    if (frameRef.current) window.cancelAnimationFrame(frameRef.current);

    const startValue = displayValue;
    const diff = value - startValue;
    startValueRef.current = startValue;

    if (diff === 0) return;

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

    return () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
    };
  }, [value]);

  return displayValue;
}

export default function KivoChatHeader({ hasMessages = false, onSidebarToggle }: Props) {
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [creditPulse, setCreditPulse] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const previousCreditsRef = useRef<number | null>(null);
  const animatedCredits = useAnimatedNumber(credits);

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
        const data = await response.json();
        const nextCredits = Number(data?.credits ?? 0);

        if (!mounted) return;

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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/18 px-3 pb-3 backdrop-blur-[2px]" onClick={() => setSheetOpen(false)}>
          <section
            className="w-full max-w-[520px] rounded-[32px] border border-black/[0.08] bg-white/92 p-5 text-[#171717] shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-black/12" />
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] font-medium text-black/45">Kivo Credits</p>
                <h2 className="mt-1 text-[30px] font-semibold tracking-[-0.06em]">{credits} credits</h2>
              </div>
              <button type="button" onClick={() => setSheetOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/[0.06] text-black/60 active:scale-95">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[22px] border border-black/[0.06] bg-[#F7F7F5] p-4">
                <p className="text-xs font-medium text-black/45">Status</p>
                <p className="mt-2 text-[15px] font-semibold">{credits >= 500 ? 'Strong balance' : credits > 100 ? 'Ready to run' : 'Low balance'}</p>
              </div>
              <div className="rounded-[22px] border border-black/[0.06] bg-[#F7F7F5] p-4">
                <p className="text-xs font-medium text-black/45">Refresh</p>
                <p className="mt-2 text-[15px] font-semibold">Auto monthly</p>
              </div>
            </div>

            <button type="button" onClick={() => router.push('/upgrade')} className="mt-5 h-12 w-full rounded-full bg-black text-[15px] font-semibold text-white active:scale-[0.98]">
              Upgrade credits
            </button>
          </section>
        </div>
      ) : null}
    </>
  );
}
