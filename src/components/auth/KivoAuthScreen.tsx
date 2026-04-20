'use client';

import { KivoHero } from './KivoHero';
import { KivoAuthPanel } from './KivoAuthPanel';

export function KivoAuthScreen() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f5f5f3] text-black">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[1200px] flex-col px-6 pb-[max(28px,env(safe-area-inset-bottom))] pt-[max(28px,env(safe-area-inset-top))] sm:px-8">
        <div className="flex-1" />

        <div className="flex flex-col items-center">
          <KivoHero />
        </div>

        <div className="flex-1 min-h-[80px]" />

        <div className="mx-auto w-full max-w-[940px]">
          <KivoAuthPanel />
        </div>
      </div>
    </main>
  );
}
