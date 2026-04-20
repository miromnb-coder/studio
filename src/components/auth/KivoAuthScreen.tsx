'use client';

import { KivoHero } from './KivoHero';
import { KivoAuthPanel } from './KivoAuthPanel';

export function KivoAuthScreen() {
  return (
    <main className="min-h-[100svh] overflow-hidden bg-[#f5f5f3] text-black">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1200px] flex-col px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pb-[max(24px,env(safe-area-inset-bottom))] sm:pt-[max(24px,env(safe-area-inset-top))]">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-[0.92] items-center justify-center">
            <KivoHero />
          </div>

          <div className="flex min-h-0 flex-[1.08] items-end justify-center pt-4 sm:pt-6">
            <div className="w-full max-w-[690px]">
              <KivoAuthPanel />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
