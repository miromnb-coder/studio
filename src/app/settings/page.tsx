'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { ConnectGmailCard, type GmailConnectionStatus } from '@/components/integrations/ConnectGmailCard';

type GmailStatusPayload = {
  status: GmailConnectionStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  errorMessage?: string | null;
};

const initialGmailState: GmailStatusPayload = {
  status: 'disconnected',
  lastSyncedAt: null,
  emailsAnalyzed: 0,
  subscriptionsFound: 0,
  errorMessage: null,
};

export default function SettingsPage() {
  const { plan, usage } = useUserEntitlements();
  const [gmail, setGmail] = useState<GmailStatusPayload>(initialGmailState);

  const loadGmailStatus = useCallback(async () => {
    const response = await fetch('/api/integrations/gmail/status', { cache: 'no-store' });
    if (!response.ok) {
      setGmail((prev) => ({ ...prev, status: 'error', errorMessage: 'Could not load Gmail status.' }));
      return;
    }

    const payload = (await response.json()) as GmailStatusPayload;
    setGmail({ ...initialGmailState, ...payload });
  }, []);

  useEffect(() => {
    void loadGmailStatus();
  }, [loadGmailStatus]);

  const handleConnect = () => {
    setGmail((prev) => ({ ...prev, status: 'connecting', errorMessage: null }));
    window.location.href = '/api/integrations/gmail/connect';
  };

  const handleSync = async () => {
    setGmail((prev) => ({ ...prev, status: 'syncing', errorMessage: null }));

    const response = await fetch('/api/integrations/gmail/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({ error: 'Gmail sync failed.' }))) as { error?: string };
      setGmail((prev) => ({
        ...prev,
        status: 'error',
        errorMessage: payload.error || 'Gmail sync failed.',
      }));
      return;
    }

    const payload = (await response.json()) as GmailStatusPayload;
    setGmail({ ...initialGmailState, ...payload, status: 'connected' });
  };

  const handleDisconnect = async () => {
    const response = await fetch('/api/integrations/gmail/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      setGmail((prev) => ({ ...prev, status: 'error', errorMessage: 'Could not disconnect Gmail.' }));
      return;
    }

    setGmail(initialGmailState);
  };

  return (
    <main className="screen app-bg space-y-4 pb-24">
      <section className="card-surface p-5">
        <h1 className="text-2xl font-semibold text-primary">Settings</h1>
        <p className="mt-1 text-sm text-secondary">Manage account-level preferences for your Kivo workspace.</p>

        <div className="mt-4 rounded-xl border border-black/10 bg-[#f2f2f2] p-4 text-sm text-secondary">
          <p>Current plan: <span className="font-medium text-primary">{plan}</span></p>
          <p>Daily usage: {usage.current} / {usage.limit}</p>
        </div>

        <Link href="/upgrade" className="btn-primary tap-feedback mt-4 inline-flex px-4 py-2 text-sm">
          Upgrade
        </Link>

        <Link href="/profile" className="btn-secondary tap-feedback mt-3 inline-flex px-4 py-2 text-sm">
          Open profile
        </Link>
      </section>

      <ConnectGmailCard
        status={gmail.status}
        lastSyncedAt={gmail.lastSyncedAt}
        emailsAnalyzed={gmail.emailsAnalyzed}
        subscriptionsFound={gmail.subscriptionsFound}
        errorMessage={gmail.errorMessage}
        onConnect={handleConnect}
        onSync={handleSync}
        onReconnect={handleConnect}
        onDisconnect={handleDisconnect}
      />
    </main>
  );
}
