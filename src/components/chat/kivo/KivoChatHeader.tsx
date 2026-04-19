'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type KivoChatHeaderProps = {
  onOpenQuickSheet?: () => void;
};

function KivoMark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <g
        stroke="currentColor"
        strokeWidth="44"
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="square"
      >
        <rect x="294" y="294" width="124" height="124" rx="10" />
        <rect x="606" y="294" width="124" height="124" rx="10" />
        <rect x="294" y="606" width="124" height="124" rx="10" />
        <rect x="606" y="606" width="124" height="124" rx="10" />

        <line x1="294" y1="512" x2="176" y2="512" />
        <line x1="848" y1="512" x2="730" y2="512" />
        <line x1="512" y1="294" x2="512" y2="176" />
        <line x1="512" y1="848" x2="512" y2="730" />

        <line x1="418" y1="418" x2="454" y2="454" />
        <line x1="606" y1="418" x2="570" y2="454" />
        <line x1="418" y1="606" x2="454" y2="570" />
        <line x1="606" y1="606" x2="570" y2="570" />
      </g>

      <circle
        cx="512"
        cy="512"
        r="116"
        fill="white"
        stroke="currentColor"
        strokeWidth="44"
      />
      <circle cx="512" cy="512" r="54" fill="currentColor" />
    </svg>
  );
}

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
    <header
      className="relative z-30 border-b border-black/[0.035] bg-white/82 backdrop-blur-2xl"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="mx-auto flex h-[78px] w-full max-w-[560px] items-center px-5">
        <div className="flex w-[52px] shrink-0 justify-start">
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
              <KivoMark className="h-[17px] w-[17px] shrink-0 text-[#111318]" />
              <span className="truncate text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
                Kivo
              </span>
            </button>
          ) : (
            <div className="inline-flex min-w-0 items-center gap-2.5">
              <KivoMark className="h-[17px] w-[17px] shrink-0 text-[#111318]" />
              <span className="truncate text-[21px] font-semibold tracking-[-0.045em] text-[#202734]">
                Kivo
              </span>
            </div>
          )}
        </div>

        <div className="flex w-[108px] shrink-0 justify-end">
          <button
            type="button"
            onClick={handleUpgrade}
            aria-label="Upgrade to Kivo Plus"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#111318_0%,#050608_100%)] px-5 text-[13px] font-semibold tracking-[-0.015em] text-white shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[1px] hover:shadow-[0_14px_28px_rgba(0,0,0,0.18)] active:translate-y-0 active:scale-[0.985]"
          >
            Kivo Plus
          </button>
        </div>
      </div>
    </header>
  );
}
