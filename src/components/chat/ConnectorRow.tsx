'use client';

import { CheckCircle2, ChevronRight } from 'lucide-react';
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
};

export function ConnectorRow({ name, icon, mode, toggled = false, detail, onAction }: ConnectorRowProps) {
  return (
    <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e7ebf1] px-4 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#e3e8f0] bg-white text-[#596171] shadow-[0_4px_10px_rgba(76,84,98,0.08)]">{icon}</span>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-semibold tracking-[-0.01em] text-[#2f3644]">{name}</p>
          {detail ? <p className="truncate text-[12px] text-[#8a93a2]">{detail}</p> : null}
        </div>
      </div>

      {mode === 'toggle' ? (
        <button
          type="button"
          onClick={onAction}
          aria-label={`${name} toggle`}
          className={`relative h-7 w-12 rounded-full border transition ${toggled ? 'border-[#8fceaf] bg-[#a9dcc1]' : 'border-[#d8dde5] bg-[#e8ebf0]'}`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm ${toggled ? 'left-[25px]' : 'left-[2px]'}`}
          />
        </button>
      ) : (
        <button type="button" onClick={onAction} className="inline-flex items-center gap-1 text-[14px] font-medium text-[#68707e]">
          {mode === 'connected' ? <CheckCircle2 className="h-4 w-4 text-[#86bf9f]" /> : null}
          <span>
            {mode === 'connect' && 'Connect'}
            {mode === 'connected' && 'Connected'}
            {mode === 'manage' && 'Manage'}
          </span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
