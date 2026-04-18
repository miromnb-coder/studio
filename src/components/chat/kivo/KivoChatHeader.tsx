'use client';

import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type KivoChatHeaderProps = {
  onOpenQuickSheet?: () => void;
};

export function KivoChatHeader({ onOpenQuickSheet }: KivoChatHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    router.push('/home');
  };

  const handleUpgrade = () => {
    router.push('/upgrade');
  };

  const handleTitleClick = () => {
    onOpenQuickSheet?.();
  };

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-white/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-[76px] w-full max-w-[560px] items-center px-5">
        <div className="flex w-[56px] shrink-0 justify-start">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="inline-flex h-10 w-10 items-center justify-center text-[#2B313D] transition-all duration-200 ease-out hover:opacity-65 active:scale-[0.96]"
          >
            <ArrowLeft className="h-[21px] w-[21px]" strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-3">
          {onOpenQuickSheet ? (
            <button
              type="button"
              onClick={handleTitleClick}
              aria-label="Open quick actions"
              className="inline-flex min-w-0 items-center gap-2.5 transition-all duration-200 ease-out hover:opacity-80 active:scale-[0.985]"
            >
              <span className="relative h-[18px] w-[18px] shrink-0 overflow-hidden rounded-[4px]">
                <Image
                  src="/kivo-mark.png"
                  alt="Kivo"
                  fill
                  className="object-contain"
                  sizes="18px"
                  priority
                />
              </span>

              <span className="truncate text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
                Kivo
              </span>
            </button>
          ) : (
            <div className="inline-flex min-w-0 items-center gap-2.5">
              <span className="relative h-[18px] w-[18px] shrink-0 overflow-hidden rounded-[4px]">
                <Image
                  src="/kivo-mark.png"
                  alt="Kivo"
                  fill
                  className="object-contain"
                  sizes="18px"
                  priority
                />
              </span>

              <span className="truncate text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
                Kivo
              </span>
            </div>
          )}
        </div>

        <div className="flex w-[92px] shrink-0 justify-end">
          <button
            type="button"
            onClick={handleUpgrade}
            aria-label="Upgrade to Kivo Plus"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#111318_0%,#050608_100%)] px-4.5 text-[13px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.985]"
          >
            Kivo Plus
          </button>
        </div>
      </div>
    </header>
  );
}
