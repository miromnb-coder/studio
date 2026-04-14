'use client';

import { ArrowLeft, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalMenu } from '@/app/components/global-menu-provider';

type KivoChatHeaderProps = {
  onOpenQuickSheet?: () => void;
};

export function KivoChatHeader({ onOpenQuickSheet }: KivoChatHeaderProps) {
  const router = useRouter();
  const { openMenu } = useGlobalMenu();

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(245,245,247,0.78)] backdrop-blur-2xl">
      <div className="flex h-[76px] items-center justify-between px-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white/40 text-[#4b5563] transition-all duration-200 ease-out hover:bg-white/60 active:scale-[0.985]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
        </button>

        {onOpenQuickSheet ? (
          <button
            type="button"
            onClick={onOpenQuickSheet}
            aria-label="Open quick actions"
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/[0.05] bg-white/55 px-3.5 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-[#5f6672] shadow-[0_6px_16px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-200 ease-out hover:bg-white/72 active:scale-[0.985] sm:inline-flex"
          >
            Kivo
          </button>
        ) : null}

        <h1 className="text-[21px] font-medium tracking-[-0.04em] text-[#2f3640] sm:hidden">
          Kivo
        </h1>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/[0.06] bg-white/40 text-[#4b5563] transition-all duration-200 ease-out hover:bg-white/60 active:scale-[0.985]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
