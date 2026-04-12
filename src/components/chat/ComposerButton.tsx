'use client';

import type { ReactNode } from 'react';

type ComposerButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
};

export function ComposerButton({ children, label, onClick, disabled, active }: ComposerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`inline-flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#d7dbe3] text-[#858d99] transition ${
        active ? 'bg-[#e5e8ee]' : 'bg-[#f1f3f7]'
      } hover:bg-[#eceff4] disabled:opacity-45`}
    >
      {children}
    </button>
  );
}
