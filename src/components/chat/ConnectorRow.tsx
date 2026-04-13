'use client';

import { CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type ConnectorMode = 'connect' | 'connected' | 'toggle' | 'manage';

type ConnectorRowProps = {
  name: string;
  icon: ReactNode;
  mode: ConnectorMode;
  toggled?: boolean;
  detail?: string;
  onAction: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function ConnectorRow({
  name,
  icon,
  mode,
  toggled = false,
  detail,
  onAction,
  loading = false,
  disabled = false,
}: ConnectorRowProps) {
  const isDisabled = disabled || loading;

  const actionLabel =
    mode === 'connect'
      ? loading
        ? 'Connecting...'
        : 'Connect'
      : mode === 'connected'
        ? loading
          ? 'Opening...'
          : 'Connected'
        : mode === 'manage'
          ? loading
            ? 'Opening...'
            : 'Manage'
          : '';

  return (
    <div className="flex min-h-[68px] items-center justify-between gap-3 border-b border-[#e7ebf1] px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[#e3e8f0] bg-white text-[#596171] shadow-[0_3px_8px_rgba(76,84,98,0.06)]">
          {icon}
        </span>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#2f3744]">
            {name}
          </p>
          {detail ? (
            <p className="truncate text-[12px] leading-snug text-[#8b93a1]">
              {detail}
            </p>
          ) : null}
        </div>
      </div>

      {mode === 'toggle' ? (
        <button
          type="button"
          onClick={onAction}
          disabled={isDisabled}
          aria-label={`${name} toggle`}
          className={`relative h-7 w-12 shrink-0 rounded-full border transition ${
            toggled
              ? 'border-[#a8d4b8] bg-[#b8e1c6]'
              : 'border-[#d8dde5] bg-[#eceff4]'
          } ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-[0.98]'}`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-[0_1px_3px_rgba(60,66,78,0.16)] ${
              toggled ? 'left-[25px]' : 'left-[2px]'
            }`}
          />
        </button>
      ) : (
        <button
          type="button"
          onClick={onAction}
          disabled={isDisabled}
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-transparent px-2 py-1.5 text-[13px] font-medium text-[#6d7481] transition ${
            isDisabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:bg-[#f1f4f8] active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#7b8492]" />
          ) : mode === 'connected' ? (
            <CheckCircle2 className="h-4 w-4 text-[#7fb693]" />
          ) : null}

          <span>{actionLabel}</span>

          {!loading ? (
            <ChevronRight className="h-4 w-4 text-[#9aa2af]" />
          ) : null}
        </button>
      )}
    </div>
  );
}
