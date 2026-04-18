'use client';

import Image from 'next/image';
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

  const handleTitleClick = () => {
    if (onOpenQuickSheet) {
      onOpenQuickSheet();
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-[rgba(255,255,255,0.78)] backdrop-blur-[20px]">
      <div className="relative flex h-[78px] items-center justify-between px-6">
        <button
          type="button"
          onClick={handleLeftAction}
          aria-label="Go back"
          className="inline-flex items-center justify-center p-1 text-[#2d3440] transition-all duration-200 ease-out hover:opacity-65 active:scale-[0.97]"
        >
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>

        <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center">
          <button
            type="button"
            onClick={handleTitleClick}
            disabled={!onOpenQuickSheet}
            aria-label={onOpenQuickSheet ? 'Open quick actions' : 'Kivo'}
            className={`flex items-center gap-2.5 transition-all duration-200 ease-out ${
              onOpenQuickSheet
                ? 'cursor-pointer hover:opacity-80 active:scale-[0.985]'
                : 'cursor-default'
            }`}
          >
            <div className="relative h-[18px] w-[18px] overflow-hidden rounded-[4px]">
              <Image
                src="/kivo-mark.png"
                alt="Kivo"
                fill
                className="object-contain"
                sizes="18px"
                priority
              />
            </div>

            <span className="text-[22px] font-semibold tracking-[-0.045em] text-[#2b313d]">
              Kivo
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleUpgrade}
          aria-label="Upgrade to Kivo Plus"
          className="inline-flex h-11 items-center justify-center rounded-full bg-[linear-gradient(180deg,#101114_0%,#050608_100%)] px-5 text-[13px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)] transition-all duration-200 ease-out hover:translate-y-[-1px] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.985]"
        >
          Kivo Plus
        </button>
      </div>
    </header>
  );
}
