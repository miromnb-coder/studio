'use client';

import { Loader2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export type ConnectorStatus = 'connected' | 'not_connected' | 'loading' | 'error';

export type ConnectorItem = {
  id: string;
  name: string;
  icon: LucideIcon;
  status: ConnectorStatus;
};

type ConnectorRowProps = {
  connector: ConnectorItem;
  index: number;
  onToggleConnected: (id: string, enabled: boolean) => void;
  onConnect: (id: string) => void;
  onRetry: (id: string) => void;
};

export function ConnectorRow({ connector, index, onToggleConnected, onConnect, onRetry }: ConnectorRowProps) {
  const Icon = connector.icon;

  return (
    <motion.li
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.028, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center justify-between gap-3 py-3.5"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#dde1e8] bg-[#f8f9fb] text-[#4d5561]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[16px] font-medium tracking-[-0.012em] text-[#232830]">{connector.name}</p>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a93a1]">
            {connector.status === 'connected'
              ? 'Connected'
              : connector.status === 'loading'
                ? 'Connecting'
                : connector.status === 'error'
                  ? 'Needs attention'
                  : 'Available'}
          </p>
        </div>
      </div>

      {connector.status === 'connected' ? (
        <button
          type="button"
          role="switch"
          aria-checked
          aria-label={`Disable ${connector.name}`}
          onClick={() => onToggleConnected(connector.id, false)}
          className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border border-[#c9d3e1] bg-[#e9eef6] p-1 shadow-sm transition active:scale-95"
        >
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.45),transparent_55%)]" />
          <motion.span
            layout
            className="relative ml-auto h-6 w-6 rounded-full bg-white shadow-[0_4px_12px_rgba(9,9,11,0.35)]"
          />
        </button>
      ) : null}

      {connector.status === 'not_connected' ? (
        <button
          type="button"
          onClick={() => onConnect(connector.id)}
          className="rounded-full border border-white/12 bg-white px-3.5 py-1.5 text-xs font-medium text-[#2d333b] transition hover:border-[#cfd6e0] hover:bg-[#f6f8fb] active:scale-95"
        >
          Connect
        </button>
      ) : null}

      {connector.status === 'loading' ? (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde1e8] bg-[#f7f8fa] px-3 py-1.5 text-xs text-[#576070]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Loading
        </span>
      ) : null}

      {connector.status === 'error' ? (
        <button
          type="button"
          onClick={() => onRetry(connector.id)}
          className="inline-flex items-center gap-1 rounded-full border border-rose-300/25 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-400/15 active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Retry
        </button>
      ) : null}
    </motion.li>
  );
}
