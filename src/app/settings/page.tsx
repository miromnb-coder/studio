'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Mail, Shield, Sparkles } from 'lucide-react';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { ConnectGmailCard, type GmailConnectionStatus } from '@/components/integrations/ConnectGmailCard';
import { AppShell, PremiumCard, SectionHeader, SmartButton } from '../components/premium-ui';

type GmailStatusPayload = {
  connected?: boolean;
  status: GmailConnectionStatus;
  lastSyncedAt?: string | null;
  emailsAnalyzed?: number;
  subscriptionsFound?: number;
  errorMessage?: string | null;
};

const initialGmailState: GmailStatusPayload = {
  connected: false,
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
    <AppShell>
      <PremiumCard className="space-y-4 p-5">
        <SectionHeader title="Settings" subtitle="Workspace controls, integrations, and security preferences." />

        <PremiumCard className="space-y-2 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#22262c]"><Sparkles className="h-4 w-4" /> Plan & usage</p>
          <p className="text-sm text-[#7a838f]">Current plan: <span className="font-medium text-[#22262c]">{plan}</span></p>
          <p className="text-sm text-[#7a838f]">Daily usage: {usage.unlimited ? 'Unlimited (Dev Mode)' : `${usage.current} / ${usage.limit}`}</p>
          <div className="flex gap-2 pt-1">
            <Link href="/upgrade" className="inline-flex"><SmartButton>Upgrade</SmartButton></Link>
            <Link href="/profile" className="inline-flex"><SmartButton variant="secondary">Open profile</SmartButton></Link>
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#22262c]"><Shield className="h-4 w-4" /> Security</p>
          <p className="text-sm text-[#7a838f]">Account sessions are protected through Supabase auth and token rotation.</p>
          <p className="text-xs text-[#8b95a3]">Tip: connect Gmail only when you want proactive subscription intelligence.</p>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#22262c]"><Mail className="h-4 w-4" /> Gmail intelligence</p>
          <p className="text-sm text-[#7a838f]">Connect inbox data so Kivo can detect bills, renewals, and savings opportunities.</p>
        </PremiumCard>

        <ConnectGmailCard
          connected={Boolean(gmail.connected)}
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
      </PremiumCard>
    </AppShell>
  );
}
