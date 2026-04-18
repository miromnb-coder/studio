'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import type { ConnectorRecord } from '@/app/lib/connectors-state';

export type ConnectorMode = 'connect' | 'connected' | 'toggle' | 'manage';

type ConnectorRowProps = {
  connector: ConnectorRecord;
  icon: ReactNode;
  index: number;
  onOpenDetail: (id: string) => void;
  onAction: (id: string, mode: ConnectorMode) => void;
};

function relativeSyncLabel(iso?: string | null) {
  if (!iso) return 'Not synced yet';
  const syncTime = new Date(iso).getTime();
  if (Number.isNaN(syncTime)) return 'Not synced yet';
  const diffMinutes = Math.max(1, Math.round((Date.now() - syncTime) / 60000));
  if (diffMinutes < 60) return `Synced ${diffMinutes} min ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `Synced ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `Synced ${days}d ago`;
}

export function ConnectorRow({ connector, icon, index, onOpenDetail, onAction }: ConnectorRowProps) {
  const isConnected = connector.state === 'connected';
  const isLoading = connector.state === 'connecting' || connector.state === 'reconnecting';

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="flex w-full items-center justify-between gap-3 rounded-[22px] px-3 py-3 text-left transition hover:bg-[#f5f8fd]">
        <span className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenDetail(connector.id)}
            className="flex min-w-0 items-center gap-3 text-left"
            aria-label={`Open ${connector.name} details`}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#e2e8f1] bg-white text-[#596171] shadow-[0_6px_14px_rgba(32,40,53,0.05)]">
              {icon}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-[#2f3744]">{connector.name}</span>
              <span className="block truncate text-[12px] leading-5 text-[#7d8797]">{connector.description}</span>
              <span className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[#8f98a7]">
                {isConnected ? <CheckCircle2 className="h-3.5 w-3.5 text-[#5d9f74]" /> : null}
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#748095]" /> : null}
                {isLoading ? 'Connecting...' : isConnected ? relativeSyncLabel(connector.lastSyncAt) : 'Not connected'}
              </span>
            </span>
          </button>
        </span>

        <span className="shrink-0">
          {isLoading ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-[#dbe3ef] bg-[#f7f9fc] px-3 py-1.5 text-[11px] font-medium text-[#677286]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Connecting...
            </span>
          ) : (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAction(connector.id, isConnected ? 'manage' : 'connect');
              }}
              className={`rounded-full px-3.5 py-1.5 text-[11px] font-semibold transition active:scale-[0.98] ${
                isConnected
                  ? 'border border-[#d5deeb] bg-white text-[#2f3744] hover:bg-[#f5f8fd]'
                  : 'bg-[#1f242c] text-white shadow-[0_8px_18px_rgba(19,24,32,0.2)] hover:bg-[#0f141b]'
              }`}
            >
              {isConnected ? 'Open' : 'Connect'}
            </button>
          )}
        </span>
      </div>
    </motion.li>
  );
}
