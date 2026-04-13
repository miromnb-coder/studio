'use client';

import type { KeyboardEvent, ReactNode } from 'react';

type ComposerButtonProps = {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'default' | 'quick-create';
};

export function ComposerButton({
  children,
  label,
  onClick,
  disabled = false,
  active = false,
  variant = 'default',
}: ComposerButtonProps) {
  const handlePress = () => {
    if (disabled) return;
    onClick();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick();
    }
  };

  const classes = [
    'composer-action-btn',
    active ? 'composer-action-btn-active' : '',
    variant === 'quick-create'
      ? 'composer-action-btn-plus'
      : '',
    disabled
      ? 'opacity-50 cursor-not-allowed pointer-events-none'
      : 'cursor-pointer pointer-events-auto',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={handlePress}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={classes}
    >
      <span className="pointer-events-none flex items-center justify-center">
        {children}
      </span>
    </button>
  );
}
