'use client';

import { ArrowLeft, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useGlobalMenu } from '@/app/components/global-menu-provider';

type KivoChatHeaderProps = {
  onOpenQuickSheet: () => void;
};

export function KivoChatHeader({ onOpenQuickSheet }: KivoChatHeaderProps) {
  const router = useRouter();
  const { openMenu } = useGlobalMenu();

  return (
    <header className="sticky top-0 z-30 border-b border-[#d9dbe2] bg-[rgba(243,243,245,0.84)] backdrop-blur-xl">
      <div className="flex h-[76px] items-center justify-between px-6">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd3dc] bg-[rgba(255,255,255,0.42)] text-[#4a515d] transition hover:bg-white/70 active:scale-[0.98]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.9} />
        </button>

        <button
          type="button"
          onClick={onOpenQuickSheet}
          aria-label="Open quick actions"
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#dde2ea] bg-white/72 px-3 py-1.5 text-[12px] font-medium text-[#667085] shadow-[0_6px_16px_rgba(15,23,42,0.06)] sm:inline-flex"
        >
          Kivo
        </button>

        <h1 className="text-[22px] font-medium tracking-[-0.03em] text-[#333944] sm:hidden">
          Kivo
        </h1>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#cfd3dc] bg-[rgba(255,255,255,0.42)] text-[#4a515d] transition hover:bg-white/70 active:scale-[0.98]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
