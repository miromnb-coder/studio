'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useGlobalMenu } from '@/app/components/global-menu-provider';

type PageHeaderProps = {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  subtitle?: string;
  onLeftAction?: () => void;
  leftButtonAriaLabel?: string;
  leftButtonIcon?: ReactNode;
  mood?: 'chat' | 'control';
};

export function PageHeader({
  title,
  onBack,
  showBack = false,
  subtitle,
  onLeftAction,
  leftButtonAriaLabel = 'Go back',
  leftButtonIcon,
  mood = 'control',
}: PageHeaderProps) {
  const { openMenu } = useGlobalMenu();
  const resolvedLeftAction = onLeftAction ?? onBack;
  const isChat = mood === 'chat';

  return (
    <header className={`mb-4 rounded-[24px] border px-4 pb-4 pt-3 ${isChat ? 'border-[#e6eaf0] bg-white shadow-[0_8px_20px_rgba(71,85,105,0.06)]' : 'border-[#e4e7ed] bg-white shadow-[0_10px_22px_rgba(17,24,39,0.08)]'}`}>
      <div className="flex h-[48px] items-center justify-between">
        <button
          type="button"
          onClick={resolvedLeftAction}
          aria-label={leftButtonAriaLabel}
          className={`tap-feedback inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border ${isChat ? 'border-[#e6eaf0] bg-[#f7f8fa] text-[#6b7280]' : 'border-[#e5e7eb] bg-[#f6f7f8] text-[#1c1c1e]'} transition ${showBack ? '' : 'pointer-events-none opacity-0'}`}
        >
          {leftButtonIcon ?? <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={1.9} />}
        </button>

        <h1 className={`text-[22px] font-semibold tracking-[-0.03em] ${isChat ? 'text-[#4b5563]' : 'text-[#111111]'}`}>{title}</h1>

        <button
          type="button"
          onClick={openMenu}
          aria-label="Open menu"
          className={`tap-feedback inline-flex h-[40px] w-[40px] items-center justify-center rounded-full border ${isChat ? 'border-[#e6eaf0] bg-[#f7f8fa] text-[#6b7280]' : 'border-[#e5e7eb] bg-[#f6f7f8] text-[#111111]'}`}
        >
          <Menu className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </button>
      </div>

      {subtitle ? <p className={`mt-1.5 text-sm ${isChat ? 'text-[#8a94a6]' : 'text-[#616773]'}`}>{subtitle}</p> : null}
    </header>
  );
}
