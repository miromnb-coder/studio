'use client';

import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

function KivoMark() {
  return (
    <div className="flex items-end gap-3">
      <div className="h-[18px] w-[18px] rounded-full bg-black" />
      <div className="h-[42px] w-[42px] rounded-full bg-black" />
    </div>
  );
}

export function KivoHero() {
  return (
    <section className="flex w-full max-w-[920px] flex-col items-center text-center">
      <div className="mb-7">
        <KivoMark />
      </div>

      <div className="mb-7 text-[18px] font-medium uppercase tracking-[0.48em] text-black/35">
        KIVO
      </div>

      <div className="max-w-[860px] text-balance text-[42px] font-semibold leading-[1.04] tracking-[-0.05em] text-black sm:text-[56px] md:text-[72px]">
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

      <p className="mt-8 max-w-[760px] text-balance text-[22px] font-normal leading-[1.45] tracking-[-0.025em] text-black/42 sm:text-[28px]">
        One place for decisions, planning, and action.
      </p>
    </section>
  );
}
