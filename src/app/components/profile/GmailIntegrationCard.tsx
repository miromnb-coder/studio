'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

export type GmailIntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'syncing' | 'error';

type StatusPayload = {
  connected?: boolean;
  status?: GmailIntegrationStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  recurringPaymentsFound?: number;
  monthlyTotal?: number;
  estimatedMonthlySavings?: number;
  summary?: string;
  errorMessage?: string | null;
};

type SyncPayload = {
  status?: GmailIntegrationStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  recurringPaymentsFound?: number;
  monthlyTotal?: number;
  estimatedMonthlySavings?: number;
  summary?: string;
  warning?: string | null;
};

function formatSyncTime(value: string | null): string {
  if (!value) return 'Never';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Never';
  return parsed.toLocaleString();
}

type GmailIntegrationCardProps = {
  gmailCallbackState?: string | null;
};

export function GmailIntegrationCard({ gmailCallbackState = null }: GmailIntegrationCardProps) {
  const [status, setStatus] = useState<GmailIntegrationStatus>('disconnected');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [emailsAnalyzed, setEmailsAnalyzed] = useState(0);
  const [subscriptionsFound, setSubscriptionsFound] = useState(0);
  const [recurringPaymentsFound, setRecurringPaymentsFound] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [estimatedMonthlySavings, setEstimatedMonthlySavings] = useState(0);
  const [summary, setSummary] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const applyPayload = useCallback((payload: StatusPayload | SyncPayload) => {
    setStatus(payload.status || 'disconnected');
    setLastSyncedAt(payload.lastSyncedAt || null);
    setEmailsAnalyzed(typeof payload.emailsAnalyzed === 'number' ? payload.emailsAnalyzed : 0);
    setSubscriptionsFound(typeof payload.subscriptionsFound === 'number' ? payload.subscriptionsFound : 0);
    setRecurringPaymentsFound(typeof payload.recurringPaymentsFound === 'number' ? payload.recurringPaymentsFound : 0);
    setMonthlyTotal(typeof payload.monthlyTotal === 'number' ? payload.monthlyTotal : 0);
    setEstimatedMonthlySavings(typeof payload.estimatedMonthlySavings === 'number' ? payload.estimatedMonthlySavings : 0);
    setSummary(payload.summary ? String(payload.summary) : '');
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setLoadingStatus(true);
      const response = await fetch(`/api/integrations/gmail/status?_ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        setStatus('error');
        setErrorMessage('Unable to load Gmail integration status right now.');
        return;
      }

      const payload = (await response.json()) as StatusPayload;
      setGmailConnected(Boolean(payload.connected));
      applyPayload(payload);
      setErrorMessage(payload.errorMessage || null);
    } catch {
      setStatus('error');
      setErrorMessage('Unable to load Gmail integration status right now.');
    } finally {
      setLoadingStatus(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const handleCallbackComplete = () => {
      void loadStatus();
    };

    const handleFinanceRefresh = () => {
      void loadStatus();
    };

    window.addEventListener('gmail:callback-complete', handleCallbackComplete as EventListener);
    window.addEventListener('finance:data-updated', handleFinanceRefresh as EventListener);
    return () => {
      window.removeEventListener('gmail:callback-complete', handleCallbackComplete as EventListener);
      window.removeEventListener('finance:data-updated', handleFinanceRefresh as EventListener);
    };
  }, [loadStatus]);

  useEffect(() => {
    if (gmailCallbackState !== 'connected' && gmailCallbackState !== 'error') return;

    void loadStatus();
    const timer = setTimeout(() => {
      void loadStatus();
    }, 1200);

    return () => clearTimeout(timer);
  }, [gmailCallbackState, loadStatus]);

  const connect = () => {
    setIsConnecting(true);
    setGmailConnected(false);
    setStatus('connecting');
    setErrorMessage(null);
    window.location.href = '/api/integrations/gmail/connect';
  };

  const syncEmails = async () => {
    setIsSyncing(true);
    setStatus('syncing');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/integrations/gmail/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const payload = (await response.json().catch(() => ({}))) as SyncPayload & { error?: string; message?: string };

      if (!response.ok && response.status !== 207) {
        setStatus('error');
        setErrorMessage(payload.error === 'GMAIL_NOT_CONNECTED' ? 'Connect Gmail before syncing.' : payload.message || 'Gmail sync failed. Please try again.');
        return;
      }

      setGmailConnected(true);
      applyPayload(payload);
      setSuccessMessage(payload.summary || 'Gmail sync completed.');

      if (payload.warning) {
        setErrorMessage(payload.warning);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('finance_data_updated_at', new Date().toISOString());
        window.dispatchEvent(
          new CustomEvent('finance:data-updated', {
            detail: {
              source: 'gmail_sync',
              summary: payload.summary || null,
            },
          }),
        );
      }

      void loadStatus();
    } catch {
      setStatus('error');
      setErrorMessage('Gmail sync failed. Please try again.');
    } finally {
      setIsSyncing(false);
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsConnecting(true);
    try {
      const response = await fetch('/api/integrations/gmail/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        setStatus('error');
        setErrorMessage('Could not disconnect Gmail right now.');
        return;
      }

      setStatus('disconnected');
      setGmailConnected(false);
      setLastSyncedAt(null);
      setEmailsAnalyzed(0);
      setSubscriptionsFound(0);
      setRecurringPaymentsFound(0);
      setMonthlyTotal(0);
      setEstimatedMonthlySavings(0);
      setSummary('');

      if (typeof window !== 'undefined') {
        localStorage.setItem('finance_data_updated_at', new Date().toISOString());
        window.dispatchEvent(new CustomEvent('finance:data-updated', { detail: { source: 'gmail_disconnect' } }));
      }
    } catch {
      setStatus('error');
      setErrorMessage('Could not disconnect Gmail right now.');
    } finally {
      setIsConnecting(false);
    }
  };

  const statusLabel = useMemo(() => {
    if (loadingStatus) return 'Loading status…';
    if (status === 'connecting') return 'Connecting…';
    if (status === 'syncing') return 'Syncing…';
    if (status === 'connected') return 'Connected';
    if (status === 'error') return 'Error';
    return 'Not connected';
  }, [loadingStatus, status]);

  return (
    <section className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm">
      <p className="text-base font-medium text-primary">Integrations</p>
      <div className="mt-3 rounded-xl border border-black/10 bg-white/70 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-primary">Gmail Integration</p>
            <p className="mt-1 text-secondary">Connect Gmail to detect recurring charges, summarize risk, and estimate savings.</p>
          </div>
          <span className="rounded-full border border-black/10 bg-white px-2 py-1 text-xs text-secondary">{statusLabel}</span>
        </div>

        <p className="mt-3 text-xs text-secondary">Last sync: {formatSyncTime(lastSyncedAt)}</p>
        <p className="mt-1 text-xs text-secondary">
          Emails analyzed: {emailsAnalyzed} · Subscriptions: {subscriptionsFound} · Recurring: {recurringPaymentsFound}
        </p>
        <p className="mt-1 text-xs text-secondary">
          Monthly total: ${monthlyTotal.toFixed(2)} · Estimated savings: ${estimatedMonthlySavings.toFixed(2)}
        </p>
        {summary ? <p className="mt-2 rounded-lg bg-[#f7f7f7] px-3 py-2 text-xs text-secondary">{summary}</p> : null}

        {gmailCallbackState === 'error' && !errorMessage ? (
          <p className="mt-3 rounded-lg border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-xs text-[#6e3030]">
            Gmail connection failed. Please retry, and if it keeps failing contact support.
          </p>
        ) : null}
        {errorMessage ? <p className="mt-3 rounded-lg border border-[#dfc9c9] bg-[#f8eded] px-3 py-2 text-xs text-[#6e3030]">{errorMessage}</p> : null}
        {successMessage ? <p className="mt-3 rounded-lg border border-[#cbe4d2] bg-[#eef8f0] px-3 py-2 text-xs text-[#255b34]">{successMessage}</p> : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {!gmailConnected ? (
            <button
              type="button"
              onClick={connect}
              disabled={isConnecting || loadingStatus}
              className="btn-primary tap-feedback px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {isConnecting ? 'Connecting…' : 'Connect Gmail'}
            </button>
          ) : null}

          {gmailConnected ? (
            <button
              type="button"
              onClick={syncEmails}
              disabled={isSyncing || loadingStatus}
              className="btn-secondary tap-feedback px-3 py-1.5 text-xs disabled:opacity-60"
            >
              {isSyncing ? 'Syncing emails…' : 'Sync emails'}
            </button>
          ) : null}

          {status === 'connected' || status === 'syncing' ? (
            <button
              type="button"
              onClick={disconnect}
              disabled={isConnecting || isSyncing || loadingStatus}
              className="tap-feedback rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-secondary disabled:opacity-60"
            >
              {isConnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
