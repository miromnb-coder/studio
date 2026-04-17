'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type KivoChatHeaderProps = {
  onOpenQuickSheet?: () => void;
};

export function KivoChatHeader({ onOpenQuickSheet }: KivoChatHeaderProps) {
  const router = useRouter();

  const handleLeftAction = () => {
    router.push('/home');
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-[rgba(248,248,250,0.48)] backdrop-blur-[22px]">
      <div className="relative flex h-[76px] items-center justify-between px-6">
        <button
          type="button"
          onClick={handleLeftAction}
          aria-label="Open home"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.52)] text-[#5a6270] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-[rgba(255,255,255,0.72)] active:scale-[0.985]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
        </button>

        {onOpenQuickSheet ? (
          <button
            type="button"
            onClick={onOpenQuickSheet}
            aria-label="Open quick actions"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-[rgba(255,255,255,0.44)] px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-[#6a7280] shadow-[0_8px_18px_rgba(15,23,42,0.04)] backdrop-blur-xl transition-all duration-200 ease-out hover:bg-[rgba(255,255,255,0.64)] active:scale-[0.985] sm:inline-flex"
          >
            Kivo
          </button>
        ) : null}

        <h1 className="text-[20px] font-medium tracking-[-0.045em] text-[#333946] sm:hidden">
          Kivo
        </h1>

        <button
          type="button"
          onClick={handleUpgrade}
          aria-label="Upgrade"
          className="inline-flex h-10 items-center justify-center rounded-full bg-[#0b0b0d] px-4 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out hover:translate-y-[-1px] hover:bg-black active:translate-y-0 active:scale-[0.985]"
        >
          Upgrade
        </button>
      </div>
    </header>
  );
}
