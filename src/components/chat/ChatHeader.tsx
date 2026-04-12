'use client';

import { ArrowLeft, Menu } from 'lucide-react';

type ChatHeaderProps = {
  onBack: () => void;
  onToggleMenu: () => void;
};

export function ChatHeader({ onBack, onToggleMenu }: ChatHeaderProps) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-[#d9dde4] px-4 sm:px-6">
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full text-[#68707d] transition hover:bg-[#e7e9ee]"
      >
        <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={1.9} />
      </button>

      <h1 className="text-[23px] font-medium tracking-[-0.03em] text-[#4c5361]">Kivo</h1>

      <button
        type="button"
        onClick={onToggleMenu}
        aria-label="Open menu"
        className="inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#d5d9e1] bg-[#f1f2f6] text-[#767e8b]"
      >
        <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
      </button>
    </header>
  );
}
