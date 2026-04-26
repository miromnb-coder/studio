'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { KivoUsageSheet } from './KivoUsageSheet';

type Props = {
  hasMessages?: boolean;
  onSidebarToggle?: () => void;
};

export default function KivoChatHeader({ hasMessages = false, onSidebarToggle }: Props) {
  const router = useRouter();
  const [usageOpen, setUsageOpen] = useState(false);
  const [account, setAccount] = useState<any>(null);

  const loadCredits = async () => {
    try {
      const response = await fetch('/api/credits', { cache: 'no-store' });
      if (response.ok) setAccount(await response.json());
    } catch {
      // Keep fallback balance visible if API is unavailable.
    }
  };

  useEffect(() => {
    loadCredits();
    const id = window.setInterval(loadCredits, 15000);
    return () => window.clearInterval(id);
  }, []);

  const credits = account?.credits ?? 100;

  return (
    <>
      <header
        className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="mx-auto flex h-[74px] w-full max-w-[560px] items-center px-4">
          <button
            type="button"
            onClick={onSidebarToggle ?? (() => router.push('/home'))}
            aria-label="Open menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#1C2431] active:scale-[0.96]"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex-1 text-center text-[17px] font-semibold tracking-[-0.04em] text-[#131A25]">
            {hasMessages ? 'Kivo 1.6' : 'Kivo Lite'}
          </div>

          <button
            type="button"
            onClick={() => {
              setUsageOpen(true);
              void loadCredits();
            }}
            aria-label="Open credits usage"
            className="inline-flex h-[44px] min-w-[92px] items-center justify-center gap-[7px] rounded-full border border-black/[0.08] bg-white px-4 text-[16px] font-medium tracking-[-0.03em] text-[#242424] shadow-[0_1px_6px_rgba(0,0,0,0.05)] transition-transform duration-150 active:scale-[0.97]"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            <span>{credits}</span>
          </button>
        </div>
      </header>

      <KivoUsageSheet
        open={usageOpen}
        onClose={() => setUsageOpen(false)}
        onUpgrade={() => router.push('/upgrade')}
        credits={credits}
        account={account}
      />
    </>
  );
}
