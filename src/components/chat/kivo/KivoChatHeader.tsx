'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch('/api/credits', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (mounted) setCredits(Number(data?.credits ?? 0));
      } catch {
        // silent fallback
      }
    };

    load();
    const id = window.setInterval(load, 15000);
    return () => {
      mounted = false;
      window.clearInterval(id);
    };
  }, []);

  return (
    <header className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
        <button type="button" onClick={onSidebarToggle ?? (() => router.push('/home'))} aria-label="Open menu" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] active:scale-[0.96]">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none"><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">{hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}</div>
        <button type="button" onClick={() => router.push('/usage')} aria-label="Open credits usage" className="inline-flex h-[42px] min-w-[92px] items-center justify-center gap-[7px] rounded-full border border-violet-500/20 bg-gradient-to-r from-[#151021] to-[#241738] px-4 text-[15px] font-semibold tracking-[-0.03em] text-white shadow-[0_8px_24px_rgba(91,33,182,0.28)] transition-transform duration-150 active:scale-[0.97]">
          <Sparkles className="h-4 w-4" strokeWidth={2.2} />
          <span>✦ {credits}</span>
        </button>
      </div>
    </header>
  );
}
