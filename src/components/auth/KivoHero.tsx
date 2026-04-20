'use client';

import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

function KivoLogoMark() {
  return (
    <svg
      width="86"
      height="70"
      viewBox="0 0 172 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-[58px] w-[72px] sm:h-[64px] sm:w-[80px]"
    >
      <path
        d="M32 109C39 118 55 124 80 123C110 121 136 105 153 84C162 73 166 61 165 50C164 44 162 39 158 35"
        stroke="black"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M71 81L105 51"
        stroke="black"
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="65" cy="85" r="18" fill="black" />
      <circle cx="116" cy="44" r="30" fill="black" />
    </svg>
  );
}

export function KivoHero() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <div className="mb-4 sm:mb-5">
        <KivoLogoMark />
      </div>

      <div className="mb-7 text-[14px] font-medium uppercase tracking-[0.42em] text-black/28 sm:mb-8 sm:text-[15px]">
        KIVO
      </div>

      <div className="flex min-h-[96px] w-full items-center justify-center sm:min-h-[108px]">
        <div className="w-full max-w-[330px] text-balance text-[30px] font-semibold leading-[0.96] tracking-[-0.06em] text-black sm:max-w-[520px] sm:text-[34px]">
          <KivoTypeHapticText
            phrases={[
              'Kivo learns how you work',
              'Kivo helps you decide faster',
              'Kivo organizes the important',
              'Kivo becomes your operator',
            ]}
            typingSpeedMs={62}
            deletingSpeedMs={34}
            holdFullTextMs={1100}
            holdEmptyMs={160}
            hapticsEveryNthChar={2}
          />
        </div>
      </div>

      <p className="mt-5 w-full max-w-[310px] text-balance text-[18px] font-normal leading-[1.45] tracking-[-0.03em] text-black/42 sm:mt-6 sm:max-w-[520px] sm:text-[18px]">
        One place for decisions, planning, and action.
      </p>
    </section>
  );
}
