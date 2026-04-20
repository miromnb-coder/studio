'use client';

import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

function KivoMark() {
  return (
    <div className="flex items-end gap-[10px]">
      <div className="h-[18px] w-[18px] rounded-full bg-black" />
      <div className="h-[44px] w-[44px] rounded-full bg-black" />
    </div>
  );
}

export function KivoHero() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <div className="mb-6">
        <KivoMark />
      </div>

      <div className="mb-8 text-[16px] font-medium uppercase tracking-[0.42em] text-black/30 sm:text-[18px]">
        KIVO
      </div>

      <div className="w-full max-w-[320px] text-balance text-[34px] font-semibold leading-[0.98] tracking-[-0.055em] text-black sm:max-w-[560px] sm:text-[52px] md:max-w-[760px] md:text-[68px]">
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

      <p className="mt-8 w-full max-w-[300px] text-balance text-[18px] font-normal leading-[1.42] tracking-[-0.03em] text-black/42 sm:max-w-[560px] sm:text-[24px] md:max-w-[720px] md:text-[28px]">
        One place for decisions, planning, and action.
      </p>
    </section>
  );
}
