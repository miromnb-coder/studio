'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, CloudDownload, Link2, Loader2, Mail, ShieldCheck, Unplug } from 'lucide-react';

export type GmailConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

export interface ConnectGmailCardProps {
  status: GmailConnectionStatus;
  connected?: boolean;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  errorMessage?: string | null;
  onConnect?: () => void;
  onSync?: () => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
}

const statusMeta: Record<GmailConnectionStatus, { label: string; tone: string; icon: ReactNode }> = {
  disconnected: {
    label: 'Disconnected',
    tone: 'border-black/10 text-secondary',
    icon: <Unplug className="h-3.5 w-3.5" />,
  },
  connecting: {
    label: 'Connecting…',
    tone: 'border-black/15 text-primary',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  connected: {
    label: 'Connected',
    tone: 'border-emerald-300/80 text-emerald-700',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  syncing: {
    label: 'Syncing…',
    tone: 'border-blue-300/80 text-blue-700',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  },
  error: {
    label: 'Needs attention',
    tone: 'border-red-300/80 text-red-700',
    icon: <AlertTriangle className="h-3.5 w-3.5" />,
  },
};

function formatDate(value?: string | null): string {
  if (!value) return 'Not synced yet';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not synced yet';
  return parsed.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function ConnectGmailCard({
  status,
  connected = false,
  lastSyncedAt,
  emailsAnalyzed = 0,
  subscriptionsFound = 0,
  errorMessage,
  onConnect,
  onSync,
  onReconnect,
  onDisconnect,
}: ConnectGmailCardProps) {
  const isBusy = status === 'connecting' || status === 'syncing';
  const canSync = connected && status !== 'syncing';

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="card-elevated relative overflow-hidden p-4 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.7),rgba(255,255,255,0))]" />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-2.5 py-1 text-[11px] text-secondary backdrop-blur-sm">
            <Mail className="h-3.5 w-3.5" /> Gmail Integration
          </div>
          <h2 className="mt-2 text-lg font-semibold text-primary">Connect Gmail</h2>
          <p className="mt-1 text-sm leading-relaxed text-secondary">
            Let the AI scan receipts, invoices, subscriptions, and recurring payment signals so it can detect savings opportunities automatically.
          </p>
        </div>

        <div className={`badge inline-flex items-center gap-1.5 ${statusMeta[status].tone}`}>
          {statusMeta[status].icon}
          {statusMeta[status].label}
        </div>
      </div>

      <div className="relative mt-4 grid gap-2 rounded-2xl border border-black/5 bg-white/60 p-3 text-xs text-secondary backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Read-only Gmail access</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>No email sending</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Only relevant finance signals are analyzed</span>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
        <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-secondary">Last synced</p>
          <p className="mt-1 text-sm font-medium text-primary">{formatDate(lastSyncedAt)}</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-secondary">Emails analyzed</p>
          <p className="mt-1 text-sm font-medium text-primary">{emailsAnalyzed}</p>
        </div>
        <div className="rounded-xl border border-black/5 bg-white/70 px-3 py-2">
          <p className="text-[11px] uppercase tracking-wide text-secondary">Subscriptions found</p>
          <p className="mt-1 text-sm font-medium text-primary">{subscriptionsFound}</p>
        </div>
      </div>

      {status === 'error' && errorMessage ? (
        <p className="relative mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{errorMessage}</p>
      ) : null}

      <div className="relative mt-4 flex flex-wrap gap-2">
        {!connected ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onConnect}
            disabled={isBusy || !onConnect}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            type="button"
          >
            <Link2 className="h-4 w-4" /> Connect Gmail
          </motion.button>
        ) : null}

        {connected ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onSync}
            disabled={!canSync || isBusy || !onSync}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            type="button"
          >
            {status === 'syncing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CloudDownload className="h-4 w-4" />}
            {status === 'syncing' ? 'Syncing…' : 'Sync emails'}
          </motion.button>
        ) : null}

        {status === 'error' && !connected ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onReconnect}
            disabled={isBusy || !onReconnect}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            type="button"
          >
            <Link2 className="h-4 w-4" /> Reconnect
          </motion.button>
        ) : null}

        {(connected || status === 'error') && onDisconnect ? (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onDisconnect}
            disabled={isBusy}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-60"
            type="button"
          >
            <Unplug className="h-4 w-4" /> Disconnect
          </motion.button>
        ) : null}
      </div>
    </motion.section>
  );
}
