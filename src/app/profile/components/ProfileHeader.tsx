'use client';

import { ArrowLeft, Bell } from 'lucide-react';

type ProfileHeaderProps = {
  onBack: () => void;
  onNotifications: () => void;
};

export function ProfileHeader({ onBack, onNotifications }: ProfileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-[rgba(246,246,245,0.9)] px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[640px] items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#171717] transition active:scale-95 active:bg-black/5"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={2.1} />
        </button>

        <p className="text-[28px] leading-none tracking-[-0.04em] text-[#101010] [font-family:Georgia,Times,serif]">Kivo</p>

        <button
          type="button"
          onClick={onNotifications}
          aria-label="Open notifications"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#171717] transition active:scale-95 active:bg-black/5"
        >
          <Bell className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
