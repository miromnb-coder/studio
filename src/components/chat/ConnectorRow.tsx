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
  onAction: () => void;
};

export function ConnectorRow({ name, icon, mode, toggled = false, onAction }: ConnectorRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-[#e7e9ee] px-3 py-3 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#e1e5eb] bg-[#f8f9fc] text-[#596171]">{icon}</span>
        <p className="truncate text-[17px] font-medium text-[#2d3340]">{name}</p>
      </div>

      {mode === 'toggle' ? (
        <button
          type="button"
          onClick={onAction}
          aria-label={`${name} toggle`}
          className={`relative h-7 w-12 rounded-full border transition ${toggled ? 'border-[#86c8ad] bg-[#9dd7be]' : 'border-[#d8dde5] bg-[#e8ebf0]'}`}
        >
          <motion.span
            layout
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            className={`absolute top-[2px] h-5 w-5 rounded-full bg-white shadow-sm ${toggled ? 'left-[25px]' : 'left-[2px]'}`}
          />
        </button>
      ) : (
        <button type="button" onClick={onAction} className="inline-flex items-center gap-1 text-[15px] text-[#6b7280]">
          {mode === 'connected' ? <CheckCircle2 className="h-4 w-4 text-[#90cdb2]" /> : null}
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
