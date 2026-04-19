'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Settings2, Sparkles } from 'lucide-react';
import { ConnectorLogo } from '@/app/components/connector-logos';
import {
  CONNECTOR_META,
  getConnectorRecord,
  saveConnectorRecord,
  type ConnectorId,
  type ConnectorRecord,
} from '@/app/lib/connectors-state';
import { ConnectorRow, type ConnectorMode } from './ConnectorRow';

type WorkspaceConnectorsProps = {
  onOpenDetail: (connector: ConnectorId) => void;
  onConnectorAction: (connector: ConnectorId, mode: ConnectorMode) => void;
  onOpenAddConnector: () => void;
  onOpenManageAccess: () => void;
  onConnectorsChange?: (connectors: ConnectorRecord[]) => void;
};

const connectorIds: ConnectorId[] = ['gmail', 'google-calendar', 'browser', 'google-drive', 'github', 'outlook'];

const recommended: Array<{ id: ConnectorId; title: string; benefit: string }> = [
  { id: 'gmail', title: 'Gmail', benefit: 'Save money & clear inbox' },
  { id: 'google-calendar', title: 'Calendar', benefit: 'Plan your day' },
  { id: 'browser', title: 'Browser', benefit: 'Live research' },
];

export function WorkspaceConnectors({
  onOpenDetail,
  onConnectorAction,
  onOpenAddConnector,
  onOpenManageAccess,
  onConnectorsChange,
}: WorkspaceConnectorsProps) {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);

  useEffect(() => {
    setConnectors(connectorIds.map((id) => getConnectorRecord(id)));
  }, []);

  useEffect(() => {
    onConnectorsChange?.(connectors);
  }, [connectors, onConnectorsChange]);

  useEffect(() => {
    const hydrateRemoteStatus = async () => {
      const [gmailResponse, calendarResponse] = await Promise.all([
        fetch('/api/integrations/gmail/status', { cache: 'no-store' }),
        fetch('/api/integrations/google-calendar/status', { cache: 'no-store' }),
      ]);

      if (gmailResponse.ok) {
        const data = await gmailResponse.json();
        setConnectors((prev) =>
          prev.map((item) => {
            if (item.id !== 'gmail') return item;
            const next: ConnectorRecord = {
              ...item,
              state: data.connected ? (data.status === 'error' ? 'error' : 'connected') : 'not_connected',
              accountEmail: data.accountEmail || null,
              lastSyncAt: data.lastSyncedAt || null,
              permissions:
                Array.isArray(data.permissions) && data.permissions.length
                  ? data.permissions
                  : item.permissions,
              errorMessage: data.errorMessage || null,
            };
            saveConnectorRecord('gmail', next);
            return next;
          }),
        );
      }

      if (calendarResponse.ok) {
        const data = await calendarResponse.json();
        setConnectors((prev) =>
          prev.map((item) => {
            if (item.id !== 'google-calendar') return item;
            const next: ConnectorRecord = {
              ...item,
              state: data.connected ? 'connected' : data.status === 'error' ? 'error' : 'not_connected',
              accountEmail: data.accountEmail || null,
              lastSyncAt: data.lastSyncAt || null,
              permissions:
                Array.isArray(data.permissions) && data.permissions.length
                  ? data.permissions
                  : item.permissions,
              errorMessage: data.errorMessage || null,
            };
            saveConnectorRecord('google-calendar', next);
            return next;
          }),
        );
      }
    };

    void hydrateRemoteStatus();
  }, []);

  const connectedCount = useMemo(
    () => connectors.filter((item) => item.state === 'connected').length,
    [connectors],
  );

  const showRecommended = connectedCount < 2;

  return (
    <section className="space-y-3">
      <header>
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#465062]">Connectors</h3>
        <p className="mt-0.5 text-[12px] text-[#8b93a1]">{connectedCount} connected service{connectedCount === 1 ? '' : 's'}</p>
      </header>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-white/92 shadow-[0_10px_24px_rgba(31,41,55,0.06)]">
        <button
          type="button"
          onClick={onOpenAddConnector}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f6f8fc]"
        >
          <span className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-[#2f3744]"><Plus className="h-4 w-4" />Add connectors</span>
          <span className="text-[12px] text-[#7f8998]">Connect new services instantly</span>
        </button>
        <div className="mx-4 h-px bg-[#e7edf5]" />
        <button
          type="button"
          onClick={onOpenManageAccess}
          className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-[#f6f8fc]"
        >
          <span className="inline-flex items-center gap-2.5 text-[14px] font-semibold text-[#2f3744]"><Settings2 className="h-4 w-4" />Manage access</span>
          <span className="text-[12px] text-[#7f8998]">Permissions, sync and privacy</span>
        </button>
      </div>

      {showRecommended ? (
        <div className="rounded-[24px] border border-[#e2e7f0] bg-[linear-gradient(180deg,#fdfefe_0%,#f6f9fd_100%)] p-4 shadow-[0_8px_20px_rgba(45,55,72,0.05)]">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a1]">
            <Sparkles className="h-3.5 w-3.5" />
            Recommended
          </p>
          <div className="mt-3 space-y-2">
            {recommended.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onOpenDetail(item.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-[#e7edf5] bg-white px-3 py-2.5 text-left transition hover:bg-[#f8fbff]"
              >
                <span>
                  <span className="block text-[13px] font-semibold text-[#2f3744]">{item.title}</span>
                  <span className="text-[12px] text-[#7e8796]">{item.benefit}</span>
                </span>
                <span className="rounded-full bg-[#1f242c] px-3 py-1 text-[11px] font-semibold text-white">Connect</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] p-2 shadow-[0_10px_24px_rgba(64,72,88,0.06)]">
        <ul className="space-y-1.5">
          {connectors.map((connector, index) => (
            <ConnectorRow
              key={connector.id}
              connector={{ ...CONNECTOR_META[connector.id], ...connector }}
              index={index}
              icon={<ConnectorLogo name={connector.name as never} />}
              onOpenDetail={(id) => onOpenDetail(id as ConnectorId)}
              onAction={(id, mode) => onConnectorAction(id as ConnectorId, mode)}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}
