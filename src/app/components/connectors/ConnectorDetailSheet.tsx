'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Loader2, PlugZap, Unplug, X } from 'lucide-react';
import { ConnectorLogo } from '../connector-logos';
import type { ConnectorRecord } from '@/app/lib/connectors-state';
import { formatSyncLabel } from '@/app/lib/connectors-state';

type Props = {
  connector: ConnectorRecord | null;
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onPrimary: () => void;
  onReconnect?: () => void;
  onDisconnect?: () => void;
};

export function ConnectorDetailSheet({ connector, open, onClose, onPrimary, onReconnect, onDisconnect, busy }: Props) {
  if (!connector) return null;

  const isConnected = connector.state === 'connected';
  const isLoading = connector.state === 'connecting' || connector.state === 'reconnecting' || busy;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
          <motion.section initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[30px] border border-[#dde2ea] bg-[#f8f9fc] p-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <ConnectorLogo name={connector.name as never} />
                <h3 className="text-base font-semibold text-[#111]">{connector.name}</h3>
              </div>
              <button onClick={onClose} type="button" className="rounded-full border border-[#d8dde5] p-2"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-[#636a76]">{connector.description}</p>
            <div className="mt-3 rounded-xl border border-[#e5e8ef] bg-white p-3 text-xs text-[#586070]">
              <p>Status: <strong>{connector.state.replace('_', ' ')}</strong></p>
              {connector.accountEmail ? <p>Account: {connector.accountEmail}</p> : null}
              <p>Last sync: {formatSyncLabel(connector.lastSyncAt)}</p>
              {connector.errorMessage ? <p className="mt-1 text-[#9a3f3f]">Error: {connector.errorMessage}</p> : null}
            </div>
            <div className="mt-3 rounded-xl border border-[#e5e8ef] bg-white p-3">
              <p className="text-xs font-semibold text-[#111]">Permissions</p>
              <ul className="mt-1 text-xs text-[#636a76] list-disc pl-4">{connector.permissions.map((permission) => <li key={permission}>{permission}</li>)}</ul>
            </div>
            <div className="mt-3 rounded-xl border border-[#e5e8ef] bg-white p-3">
              <p className="text-xs font-semibold text-[#111]">Available tools</p>
              <ul className="mt-1 text-xs text-[#636a76] list-disc pl-4">{connector.tools.map((tool) => <li key={tool}>{tool}</li>)}</ul>
            </div>
            <button disabled={isLoading} onClick={onPrimary} className="mt-4 w-full rounded-xl bg-[#111] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" type="button">
              {isLoading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Working...</span> : isConnected ? <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />Open {connector.name} tools</span> : <span className="inline-flex items-center gap-2"><PlugZap className="h-4 w-4" />Connect {connector.name}</span>}
            </button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button disabled={isLoading || !onReconnect} onClick={onReconnect} type="button" className="rounded-xl border border-[#dce1ea] bg-white px-3 py-2 text-xs disabled:opacity-60">Reconnect</button>
              <button disabled={isLoading || !onDisconnect || !isConnected} onClick={onDisconnect} type="button" className="inline-flex items-center justify-center gap-1 rounded-xl border border-[#ead3d3] bg-[#fff7f7] px-3 py-2 text-xs text-[#8d3d3d] disabled:opacity-60"><Unplug className="h-3.5 w-3.5" />Disconnect</button>
            </div>
            {connector.state === 'error' ? <p className="mt-2 inline-flex items-center gap-1 text-xs text-[#8d3d3d]"><AlertTriangle className="h-3.5 w-3.5" />Connection issue detected. Reconnect to recover.</p> : null}
          </motion.section>
        </>
      ) : null}
    </AnimatePresence>
  );
}
