'use client';

import { useEffect, useState } from 'react';

const SPLASH_SEEN_KEY = 'kivo-splash-seen-v1';
const LOGO_SRC = '/kivo-logo.png.PNG';

export function KivoSplashScreen() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const alreadySeen = window.sessionStorage.getItem(SPLASH_SEEN_KEY) === '1';

    if (alreadySeen && !isStandalone) return;

    setVisible(true);
    window.sessionStorage.setItem(SPLASH_SEEN_KEY, '1');

    const leaveTimer = window.setTimeout(() => setLeaving(true), 1050);
    const hideTimer = window.setTimeout(() => setVisible(false), 1450);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-[#f7f7f5] px-8 transition-opacity duration-500 ease-out ${leaving ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="flex -translate-y-8 flex-col items-center">
        <div className="animate-[kivoSplashLogo_720ms_cubic-bezier(0.22,1,0.36,1)_both]">
          <img src={LOGO_SRC} alt="" className="h-[154px] w-[154px] rounded-[34px] object-cover shadow-[0_22px_70px_rgba(15,23,42,0.08)]" />
        </div>

        <div className="mt-7 text-center animate-[kivoSplashText_760ms_cubic-bezier(0.22,1,0.36,1)_160ms_both]">
          <div className="text-[48px] font-medium leading-none tracking-[-0.07em] text-[#111827]">Kivo</div>
          <div className="mt-4 text-[17px] font-normal tracking-[0.12em] text-[#6f7785]">Personal AI OS</div>
        </div>
      </div>

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+68px)] left-0 right-0 flex flex-col items-center animate-[kivoSplashText_760ms_cubic-bezier(0.22,1,0.36,1)_320ms_both]">
        <div className="text-[17px] font-normal tracking-[0.12em] text-[#737b89]">Plan. Decide. Move faster.</div>
        <div className="mt-7 h-[3px] w-[72px] overflow-hidden rounded-full bg-black/[0.08]">
          <div className="h-full w-1/2 animate-[kivoSplashProgress_1.15s_ease-in-out_infinite] rounded-full bg-[#111827]/70" />
        </div>
      </div>
    </div>
  );
}
