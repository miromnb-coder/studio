'use client';

import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

function KivoMark() {
  return (
    <div className="flex items-end gap-[9px] sm:gap-[10px]">
      <div className="h-[16px] w-[16px] rounded-full bg-black sm:h-[17px] sm:w-[17px]" />
      <div className="h-[40px] w-[40px] rounded-full bg-black sm:h-[42px] sm:w-[42px]" />
    </div>
  );
}

export function KivoHero() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <div className="mb-4 sm:mb-5">
        <KivoMark />
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
