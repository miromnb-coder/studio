'use client';

import Image from 'next/image';
import { KivoTypeHapticText } from '@/components/ui/KivoTypeHapticText';

export function KivoHero() {
  return (
    <section className="flex w-full flex-col items-center text-center">
      <div className="mb-4 sm:mb-5">
        <span className="inline-flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[16px] bg-white/85 shadow-[0_10px_26px_rgba(0,0,0,0.08)] sm:h-[64px] sm:w-[64px]">
          <Image
            src="/icon.svg"
            alt="Kivo"
            width={56}
            height={56}
            className="h-[46px] w-[46px] object-contain sm:h-[50px] sm:w-[50px]"
            priority
          />
        </span>
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
