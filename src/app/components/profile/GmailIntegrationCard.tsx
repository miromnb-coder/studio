'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type GmailIntegrationStatus = 'disconnected' | 'connected' | 'syncing' | 'error';

type StatusPayload = {
  status?: GmailIntegrationStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  errorMessage?: string | null;
};

type SyncPayload = {
  status?: GmailIntegrationStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
};

function formatSyncTime(value: string | null): string {
  if (!value) return 'Never';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleString();
}

export function GmailIntegrationCard() {
  const [status, setStatus] = useState<GmailIntegrationStatus>('disconnected');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [emailsAnalyzed, setEmailsAnalyzed] = useState(0);
  const [subscriptionsFound, setSubscriptionsFound] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const response = await fetch('/api/integrations/gmail/status', { cache: 'no-store' });
      if (!response.ok) {
        setStatus('error');
        setErrorMessage('Unable to load Gmail integration status right now.');
        return;
      }

      const payload = (await response.json()) as StatusPayload;
      setStatus(payload.status || 'disconnected');
      setLastSyncedAt(payload.lastSyncedAt || null);
      setEmailsAnalyzed(typeof payload.emailsAnalyzed === 'number' ? payload.emailsAnalyzed : 0);
      setSubscriptionsFound(typeof payload.subscriptionsFound === 'number' ? payload.subscriptionsFound : 0);
      setErrorMessage(payload.errorMessage || null);
    } catch {
      setStatus('error');
      setErrorMessage('Unable to load Gmail integration status right now.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const connect = () => {
    setIsConnecting(true);
    setErrorMessage(null);
    window.location.href = '/api/integrations/gmail/connect';
  };

  const syncEmails = async () => {
    setIsSyncing(true);
    setStatus('syncing');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/integrations/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setStatus('error');
        setErrorMessage(payload.error === 'GMAIL_NOT_CONNECTED' ? 'Connect Gmail before syncing.' : 'Gmail sync failed. Please try again.');
        return;
      }

      const payload = (await response.json()) as SyncPayload;
      setStatus(payload.status || 'connected');
      setLastSyncedAt(payload.lastSyncedAt || new Date().toISOString());
      setEmailsAnalyzed(typeof payload.emailsAnalyzed === 'number' ? payload.emailsAnalyzed : 0);
      setSubscriptionsFound(typeof payload.subscriptionsFound === 'number' ? payload.subscriptionsFound : 0);
    } catch {
      setStatus('error');
      setErrorMessage('Gmail sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsConnecting(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (loadingStatus) return 'Loading status…';
    if (status === 'syncing') return 'Syncing…';
    if (status === 'connected') return 'Connected';
    if (status === 'error') return 'Error';
    return 'Not connected';
  }, [loadingStatus, status]);

  const canSync = status === 'connected' || status === 'syncing';

  return (
    <section className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm">
      <p className="text-base font-medium text-primary">Integrations</p>
      <div className="mt-3 rounded-xl border border-black/10 bg-white/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-primary">Gmail Integration</p>
            <p className="mt-1 text-secondary">Connect your Gmail to automatically detect subscriptions and save money.</p>
          </div>
          <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs text-secondary">{statusLabel}</span>
        </div>

        <p className="mt-3 text-xs text-secondary">Last sync: {formatSyncTime(lastSyncedAt)}</p>
        <p className="mt-1 text-xs text-secondary">
          Emails analyzed: {emailsAnalyzed} · Subscriptions found: {subscriptionsFound}
        </p>

        {errorMessage ? <p className="mt-3 rounded-lg border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-xs text-[#6e3030]">{errorMessage}</p> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {status === 'disconnected' || status === 'error' ? (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting || loadingStatus}
              className="btn-primary tap-feedback px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {isConnecting ? 'Connecting…' : 'Connect Gmail'}
            </button>
          ) : null}

          {canSync ? (
            <button
              type="button"
              onClick={syncEmails}
              disabled={isSyncing || loadingStatus}
              className="btn-secondary tap-feedback px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {isSyncing ? 'Syncing emails…' : 'Sync emails'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
