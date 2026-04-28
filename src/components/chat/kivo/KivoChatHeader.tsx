'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { KivoUsageSheet } from './KivoUsageSheet';
import { haptic } from '@/lib/haptics';

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

export default function KivoChatHeader({ hasMessages = false }: Props) {
  const router = useRouter();
  const [credits, setCredits] = useState(0);
  const [creditSnapshot, setCreditSnapshot] = useState<CreditSnapshot>({});
  const [isUsageSheetOpen, setIsUsageSheetOpen] = useState(false);
  const timezoneLabel = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [pulse, setPulse] = useState(false);
  const previousCreditsRef = useRef<number | null>(null);
  const animatedCredits = useAnimatedNumber(credits);

  useEffect(() => {
    let mounted = true;
    let pulseTimer: ReturnType<typeof window.setTimeout> | undefined;

    const loadCredits = async () => {
      try {
        const response = await fetch('/api/credits', { cache: 'no-store', headers: { 'x-kivo-timezone': timezoneLabel } });
        if (!response.ok) return;
        const data: CreditSnapshot = await response.json();
        const nextCredits = Number(data?.credits ?? 0);
        if (!mounted) return;

        setCreditSnapshot(data ?? {});
        setCredits(nextCredits);

        if (previousCreditsRef.current !== null && previousCreditsRef.current !== nextCredits) {
          setPulse(true);
          if (nextCredits > previousCreditsRef.current) {
            haptic.success();
          }
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
  }, [timezoneLabel]);

  const openUsageSheet = () => {
    haptic.light();
    setIsUsageSheetOpen((currentState) => !currentState);
  };

  return (
    <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
        <button
          type="button"
          onClick={() => {
            haptic.selection();
            router.push('/library');
          }}
          aria-label="Open library"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] transition-transform duration-200 active:scale-[0.93]"
        >
          <ChevronLeft className="h-[29px] w-[29px]" strokeWidth={2.25} />
        </button>

        <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">
          {hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}
        </div>

        <button
          type="button"
          onClick={openUsageSheet}
          aria-label={`Credits balance ${credits}`}
          className={`inline-flex h-[39px] min-w-[78px] items-center justify-center gap-[7px] rounded-full border border-black/[0.06] bg-transparent px-[12px] text-[18px] font-semibold leading-none tracking-[-0.055em] text-[#343434] shadow-[inset_0_1px_0_rgba(255,255,255,0.34)] backdrop-blur-2xl transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out active:scale-[0.94] ${pulse ? 'scale-[1.045] border-black/[0.1] bg-white/20' : ''}`}
        >
          <Sparkles className={`h-[24px] w-[24px] shrink-0 text-[#111111] transition-transform duration-500 ease-out ${pulse ? 'rotate-[-12deg] scale-110' : ''}`} strokeWidth={2.08} />
          <span className="relative inline-flex h-[22px] min-w-[28px] items-center justify-center overflow-hidden tabular-nums">
            <span key={animatedCredits}>{animatedCredits}</span>
          </span>
        </button>
      </div>

      <KivoUsageSheet
        isOpen={isUsageSheetOpen}
        onClose={() => setIsUsageSheetOpen(false)}
        onUpgrade={() => {
          haptic.heavy();
          router.push('/upgrade');
        }}
        usage={{
          credits,
          dailyUsed: Number(creditSnapshot.freeCredits ?? credits),
          dailyLimit: Number(creditSnapshot.freeCredits ?? 25),
          monthlyUsed: Number(creditSnapshot.monthlyUsed ?? credits),
          monthlyLimit: Number(creditSnapshot.monthlyCredits ?? 200),
          bonusCredits: 0,
        }}
        timezoneLabel={timezoneLabel}
      />
    </header>
  );
}
