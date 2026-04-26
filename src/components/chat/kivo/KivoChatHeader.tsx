'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  onSummarize?: () => void;
  onCreateTask?: () => void;
};

export default function KivoChatHeader({ hasMessages = false, onSidebarToggle }: Props) {
  const router = useRouter();
  const [credits, setCredits] = useState<number>(0);
  const [creditPulse, setCreditPulse] = useState(false);
  const previousCreditsRef = useRef<number | null>(null);

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
          pulseTimer = window.setTimeout(() => setCreditPulse(false), 520);
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

  return (
    <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
        <button type="button" onClick={onSidebarToggle ?? (() => router.push('/home'))} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] active:scale-[0.96]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">{hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}</div>
        <button
          type="button"
          aria-label={`Credits balance ${credits}`}
          className={`inline-flex h-[54px] min-w-[104px] items-center justify-center gap-[10px] rounded-full border border-[#DADADA] bg-[#F3F3F1]/78 px-[18px] text-[22px] font-semibold leading-none tracking-[-0.055em] text-[#343434] shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_1px_2px_rgba(0,0,0,0.025)] backdrop-blur-2xl transition-[transform,background-color,border-color,box-shadow] duration-300 ease-out active:scale-[0.965] ${creditPulse ? 'scale-[1.035] border-[#CFCFCF] bg-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_7px_18px_rgba(0,0,0,0.065)]' : ''}`}
        >
          <Sparkles className={`h-[31px] w-[31px] shrink-0 text-[#171717] transition-transform duration-500 ease-out ${creditPulse ? 'rotate-[-10deg] scale-110' : ''}`} strokeWidth={2.05} />
          <span className={`tabular-nums transition-[transform,opacity,filter] duration-500 ease-out ${creditPulse ? 'translate-y-[-1px] scale-110 opacity-100 blur-0' : 'translate-y-0 scale-100 opacity-100 blur-0'}`}>
            {credits}
          </span>
        </button>
      </div>
    </header>
  );
}
