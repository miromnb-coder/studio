'use client';

import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

function KivoMark() {
  return (
    <div className="flex items-end gap-[10px]">
      <div className="h-[16px] w-[16px] rounded-full bg-black" />
      <div className="h-[42px] w-[42px] rounded-full bg-black" />
    </div>
  );
}

export function KivoHero() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <div className="mb-5 sm:mb-6">
        <KivoMark />
      </div>

      <div className="mb-8 text-[15px] font-medium uppercase tracking-[0.42em] text-black/28 sm:text-[18px]">
        KIVO
      </div>

      <div className="flex min-h-[92px] w-full items-center justify-center sm:min-h-[124px] md:min-h-[152px]">
        <div className="w-full max-w-[340px] text-balance text-[34px] font-semibold leading-[0.98] tracking-[-0.055em] text-black sm:max-w-[560px] sm:text-[52px] md:max-w-[760px] md:text-[68px]">
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

      <p className="mt-6 w-full max-w-[315px] text-balance text-[18px] font-normal leading-[1.45] tracking-[-0.03em] text-black/42 sm:mt-7 sm:max-w-[560px] sm:text-[24px] md:max-w-[720px] md:text-[28px]">
        One place for decisions, planning, and action.
      </p>
    </section>
  );
}
