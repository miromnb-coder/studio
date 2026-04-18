'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

type KivoChatHeaderProps = {
  onOpenQuickSheet?: () => void;
};

function KivoMark({
  className = '',
}: {
  className?: string;
}) {
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

  return (
    <header className="sticky top-0 z-30 border-b border-black/[0.04] bg-white/88 backdrop-blur-2xl">
      <div className="relative mx-auto flex h-[74px] w-full max-w-[560px] items-center justify-between px-5">
        {/* Left */}
        <button
          type="button"
          onClick={() => router.push('/home')}
          aria-label="Go back"
          className="inline-flex items-center justify-center text-[#2f3640] transition-all duration-200 hover:opacity-70 active:scale-[0.97]"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
        </button>

        {/* Center */}
        <button
          type="button"
          onClick={() => onOpenQuickSheet?.()}
          className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2.5"
        >
          <KivoMark className="h-[18px] w-[18px] text-[#111318]" />

          <span className="text-[19px] font-semibold tracking-[-0.04em] text-[#111318]">
            Kivo
          </span>
        </button>

        {/* Right */}
        <button
          type="button"
          onClick={() => router.push('/upgrade')}
          aria-label="Upgrade"
          className="inline-flex h-9 items-center justify-center rounded-full border border-black/[0.06] bg-[#111318] px-4 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_20px_rgba(0,0,0,0.10)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-black active:translate-y-0 active:scale-[0.985]"
        >
          Upgrade
        </button>
      </div>
    </header>
  );
}
