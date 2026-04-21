'use client';

import { KivoHero } from './KivoHero';
import { KivoAuthPanel } from './KivoAuthPanel';

export function KivoAuthScreen() {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f5f5f3] text-black">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f8f8f6_0%,#f2f2ef_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,rgba(255,255,255,0.9),rgba(255,255,255,0)_34%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_78%,rgba(255,255,255,0.95),rgba(255,255,255,0)_24%)]" />
        <div className="absolute left-1/2 top-[74%] h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-white/60 blur-3xl" />
        <div className="absolute left-1/2 top-[72%] h-[560px] w-[92%] -translate-x-1/2 rounded-full bg-white/28 blur-[90px]" />
        <div className="absolute inset-0 opacity-[0.22] [background-image:radial-gradient(rgba(255,255,255,0.9)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0)_18%,rgba(255,255,255,0)_82%,rgba(255,255,255,0.18))]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] w-full max-w-[1200px] flex-col px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-[max(18px,env(safe-area-inset-top))] sm:px-8 sm:pb-[max(24px,env(safe-area-inset-bottom))] sm:pt-[max(24px,env(safe-area-inset-top))]">
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
