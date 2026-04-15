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

  const handleLeftAction = () => {
    router.push('/home');
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
          onClick={openMenu}
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-[rgba(255,255,255,0.52)] text-[#5a6270] shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:bg-[rgba(255,255,255,0.72)] active:scale-[0.985]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
