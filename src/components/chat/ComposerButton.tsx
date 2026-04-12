'use client';

import type { ReactNode } from 'react';

type ComposerButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'quick-create';
};

export function ComposerButton({ children, label, onClick, disabled, active, variant = 'default' }: ComposerButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      disabled={disabled}
      className={`composer-action-btn ${active ? 'composer-action-btn-active' : ''} ${
        variant === 'quick-create' ? 'composer-action-btn-plus' : ''
      }`}
    >
      {children}
    </button>
  );
}
