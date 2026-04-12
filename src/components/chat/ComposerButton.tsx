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
      className={`composer-action-btn ${active ? 'composer-action-btn-active' : ''}`}
    >
      {children}
    </button>
  );
}
