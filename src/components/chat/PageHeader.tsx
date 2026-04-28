'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { haptic } from '@/lib/haptics';

type PageHeaderProps = {
  title: string;
  subtitle?: string;

  onBack?: () => void;
  showBack?: boolean;

  onLeftAction?: () => void;
  leftButtonAriaLabel?: string;
  leftButtonIcon?: ReactNode;

  mood?: 'chat' | 'control';

  status?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;

  sticky?: boolean;
  className?: string;
};

export function PageHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  onLeftAction,
  leftButtonAriaLabel = 'Go back',
  leftButtonIcon,
  mood = 'control',
  status,
  badge,
  meta,
  actions,
  sticky = false,
  className = '',
}: PageHeaderProps) {
  const router = useRouter();

  const resolvedLeftAction = onLeftAction ?? onBack;
  const isChat = mood === 'chat';
  const canUseLeftButton = showBack && !!resolvedLeftAction;

  return (
    <header
      className={[
        'relative overflow-hidden rounded-[28px] border px-4 pb-4 pt-3 backdrop-blur-xl',
        sticky ? 'sticky top-3 z-30' : '',
        isChat
          ? 'border-[#e7ebf2] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,249,252,0.88)_100%)] shadow-[0_12px_30px_rgba(71,85,105,0.08)]'
          : 'border-[#e5e7eb] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(246,248,251,0.90)_100%)] shadow-[0_14px_34px_rgba(15,23,42,0.10)]',
        className,
      ].join(' ')}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px ${
          isChat ? 'bg-white/90' : 'bg-white/95'
        }`}
      />

      <div
        className={`pointer-events-none absolute -top-16 left-8 h-28 w-28 rounded-full blur-3xl ${
          isChat ? 'bg-[#dbeafe]/55' : 'bg-[#e0e7ff]/45'
        }`}
      />
      <div
        className={`pointer-events-none absolute -right-10 top-2 h-24 w-24 rounded-full blur-3xl ${
          isChat ? 'bg-[#e9d5ff]/35' : 'bg-[#dbeafe]/35'
        }`}
      />

      <div className="relative flex h-[48px] items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (!canUseLeftButton || !resolvedLeftAction) return;
            haptic.selection();
            resolvedLeftAction();
          }}
          aria-label={leftButtonAriaLabel}
          disabled={!canUseLeftButton}
          className={`tap-feedback inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border transition ${
            isChat
              ? 'border-[#e6eaf0] bg-white/75 text-[#6b7280] shadow-[0_4px_12px_rgba(148,163,184,0.10)]'
              : 'border-[#e5e7eb] bg-white/80 text-[#111111] shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
          } ${canUseLeftButton ? 'hover:scale-[1.02] active:scale-[0.98]' : 'pointer-events-none opacity-0'}`}
        >
          {leftButtonIcon ?? <ArrowLeft className="h-[20px] w-[20px]" strokeWidth={1.9} />}
        </button>

        <div className="min-w-0 flex-1 text-center">
          <div className="flex items-center justify-center gap-2">
            <h1
              className={`truncate text-[21px] font-semibold tracking-[-0.04em] sm:text-[24px] ${
                isChat ? 'text-[#374151]' : 'text-[#111111]'
              }`}
            >
              {title}
            </h1>

            {badge ? (
              <div className="hidden sm:flex shrink-0 items-center">{badge}</div>
            ) : null}
          </div>

          {subtitle ? (
            <p
              className={`mx-auto mt-1 max-w-[680px] truncate text-[13px] sm:text-sm ${
                isChat ? 'text-[#8a94a6]' : 'text-[#616773]'
              }`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="flex w-[96px] shrink-0 justify-end">
          <button
            type="button"
            onClick={() => {
              haptic.heavy();
              router.push('/upgrade');
            }}
            aria-label="Upgrade"
            className="tap-feedback inline-flex h-[38px] items-center justify-center rounded-full bg-[#0b0b0d] px-4 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition hover:translate-y-[-1px] hover:bg-black active:translate-y-0 active:scale-[0.98]"
          >
            Upgrade
          </button>
        </div>
      </div>

      {(status || meta || actions) && (
        <div className="relative mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {status ? (
              <div
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-medium ${
                  isChat
                    ? 'border-[#dbe4f0] bg-white/70 text-[#5b6472]'
                    : 'border-[#e5e7eb] bg-white/80 text-[#374151]'
                }`}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {status}
              </div>
            ) : null}

            {meta ? (
              <div
                className={`min-w-0 rounded-full border px-3 py-1.5 text-[12px] ${
                  isChat
                    ? 'border-[#dbe4f0] bg-white/65 text-[#7a8596]'
                    : 'border-[#e5e7eb] bg-white/80 text-[#616773]'
                }`}
              >
                {meta}
              </div>
            ) : null}
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : (
            <div
              className={`hidden sm:inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] ${
                isChat
                  ? 'border-[#dbe4f0] bg-white/65 text-[#7a8596]'
                  : 'border-[#e5e7eb] bg-white/80 text-[#616773]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Premium workspace
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
            </div>
          )}
        </div>
      )}
    </header>
  );
}
