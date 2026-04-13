'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Lock, Settings2, Shield, UserCircle2, Waypoints } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import { AppShell, PremiumCard, ProductPageHeader, SectionHeader, SmartButton } from '../components/premium-ui';
import { ConnectorLogo } from '../components/connector-logos';
import { ConnectorDetailSheet } from '../components/connectors/ConnectorDetailSheet';
import { CONNECTOR_META, getConnectorRecord, saveConnectorRecord, type ConnectorId, type ConnectorRecord } from '../lib/connectors-state';

const connectorIds: ConnectorId[] = ['gmail', 'google-calendar', 'google-drive', 'github', 'outlook', 'browser'];

export default function ControlPage() {
  const router = useRouter();
  const { plan } = useUserEntitlements();
  const [connectors, setConnectors] = useState<Record<ConnectorId, ConnectorRecord>>({} as Record<ConnectorId, ConnectorRecord>);
  const [activeId, setActiveId] = useState<ConnectorId | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const records = connectorIds.reduce((acc, id) => {
      acc[id] = getConnectorRecord(id);
      return acc;
    }, {} as Record<ConnectorId, ConnectorRecord>);
    setConnectors(records);

    const run = async () => {
      const response = await fetch('/api/integrations/gmail/status', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      const state = data.connected ? (data.status === 'error' ? 'error' : 'connected') : 'not_connected';
      const next: ConnectorRecord = {
        ...records.gmail,
        state,
        accountEmail: data.accountEmail || null,
        lastSyncAt: data.lastSyncedAt || null,
        permissions: Array.isArray(data.permissions) && data.permissions.length ? data.permissions : records.gmail.permissions,
        errorMessage: data.errorMessage || null,
      };
      setConnectors((prev) => ({ ...prev, gmail: next }));
      saveConnectorRecord('gmail', next);
    };
    void run();
  }, []);

  const activeConnector = activeId ? connectors[activeId] : null;

  const updateConnector = (id: ConnectorId, next: ConnectorRecord) => {
    setConnectors((prev) => ({ ...prev, [id]: next }));
    saveConnectorRecord(id, next);
  };

  const beginConnect = async (id: ConnectorId, reconnect = false) => {
    const current = connectors[id];
    if (!current) return;
    const pendingState = reconnect ? 'reconnecting' : 'connecting';
    updateConnector(id, { ...current, state: pendingState, errorMessage: null });

    if (id === 'gmail') {
      window.location.assign('/api/integrations/gmail/connect');
      return;
    }

    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const connected = {
      ...current,
      state: 'connected' as const,
      accountEmail: current.accountEmail || 'connected@operator.local',
      lastSyncAt: new Date().toISOString(),
    };
    updateConnector(id, connected);
    setBusy(false);
  };

  const disconnect = async (id: ConnectorId) => {
    const current = connectors[id];
    if (!current) return;
    const confirmed = window.confirm(`Disconnect ${current.name}?`);
    if (!confirmed) return;

    setBusy(true);
    if (id === 'gmail') {
      const response = await fetch('/api/integrations/gmail/disconnect', { method: 'POST' });
      if (!response.ok) {
        updateConnector(id, { ...current, state: 'error', errorMessage: 'Disconnect failed. Please retry.' });
        setBusy(false);
        return;
      }
    }

    updateConnector(id, { ...current, state: 'not_connected', accountEmail: null, errorMessage: null });
    setBusy(false);
  };

  const openTools = (id: ConnectorId) => {
    if (id === 'gmail') {
      router.push('/actions?tool=gmail');
      return;
    }
    router.push('/tools');
  };

  const rows = useMemo(
    () => [
      { title: 'Account', icon: UserCircle2, detail: 'Manage profile, security, and identity', href: '/control/account' },
      { title: 'Privacy', icon: Shield, detail: 'Data controls, retention, and permissions', href: '/control/privacy' },
      { title: 'App preferences', icon: Settings2, detail: 'Theme, notifications, and workspace defaults', href: '/control/preferences' },
      { title: 'Automations', icon: Waypoints, detail: 'Connected triggers and execution limits', href: '/control/automations' },
    ],
    [],
  );

  return (
    <AppShell>
      <ProductPageHeader pageTitle="Control" pageSubtitle="Settings, privacy, account, and integrations" />
      <div className="space-y-3">
        <PremiumCard className="space-y-3 p-4">
          <SectionHeader title="Integrations" subtitle="Tap any service to manage status, permissions, and sync" />
          <div className="grid grid-cols-3 gap-2">
            {connectorIds.map((id) => {
              const c = connectors[id] ?? { ...CONNECTOR_META[id], state: 'not_connected' as const };
              return (
                <button key={id} type="button" onClick={() => setActiveId(id)} className="tap-feedback rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] p-2 text-center">
                  <div className="mb-1 flex justify-center"><ConnectorLogo name={c.name as never} /></div>
                  <p className="text-[11px] font-medium text-[#111111]">{c.name}</p>
                  <p className="text-[10px] text-[#6f7785]">{c.state.replace('_', ' ')}</p>
                </button>
              );
            })}
          </div>
        </PremiumCard>

        <PremiumCard className="space-y-2 p-4">
          <SectionHeader title="System center" subtitle="Everything important in one place" />
          {rows.map((row) => {
            const Icon = row.icon;
            return (
            <button key={row.title} onClick={() => router.push(row.href)} className="tap-feedback flex w-full items-center gap-3 rounded-[16px] border border-[#e7eaf0] bg-[#fcfcfd] p-3 text-left" type="button">
              <Icon className="h-4 w-4 text-[#111111]" />
              <span className="flex-1">
                <p className="text-sm font-semibold text-[#111111]">{row.title}</p>
                <p className="text-xs text-[#636a76]">{row.detail}</p>
              </span>
              <ArrowRight className="h-4 w-4 text-[#9aa1ab]" />
            </button>
            );
          })}
        </PremiumCard>

        <PremiumCard className="p-4">
          <SectionHeader title="Plan" subtitle="Premium control and usage" />
          <p className="rounded-[14px] border border-[#e7eaf0] bg-[#fcfcfd] px-3 py-2 text-sm text-[#111111]">Current plan: <strong>{plan}</strong></p>
          <SmartButton className="mt-3 w-full" onClick={() => router.push('/control/subscription')}><Lock className="mr-2 h-4 w-4" />Manage subscription</SmartButton>
        </PremiumCard>
      </div>

      <ConnectorDetailSheet
        connector={activeConnector}
        open={Boolean(activeConnector)}
        busy={busy}
        onClose={() => setActiveId(null)}
        onPrimary={() => {
          if (!activeId || !activeConnector) return;
          if (activeConnector.state === 'connected') {
            openTools(activeId);
            setActiveId(null);
            return;
          }
          void beginConnect(activeId);
        }}
        onReconnect={() => activeId ? void beginConnect(activeId, true) : undefined}
        onDisconnect={() => activeId ? void disconnect(activeId) : undefined}
      />
    </AppShell>
  );
}
