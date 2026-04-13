'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ConnectorLogo } from '@/app/components/connector-logos';
import { ConnectorRow, type ConnectorMode } from './ConnectorRow';
import { getConnectorRecord, type ConnectorId, type ConnectorRecord } from '@/app/lib/connectors-state';

type WorkspaceConnectorsProps = {
  onAction: (connector: string, mode: ConnectorMode) => void | Promise<void>;
};

const connectorIds: ConnectorId[] = ['gmail', 'google-calendar', 'google-drive', 'github', 'outlook', 'browser'];

export function WorkspaceConnectors({ onAction }: WorkspaceConnectorsProps) {
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);

  useEffect(() => {
    setConnectors(connectorIds.map((id) => getConnectorRecord(id)));
    const run = async () => {
      const response = await fetch('/api/integrations/gmail/status', { cache: 'no-store' });
      if (!response.ok) return;
      const data = await response.json();
      setConnectors((prev) => prev.map((item) => item.id === 'gmail' ? {
        ...item,
        state: data.connected ? (data.status === 'error' ? 'error' : 'connected') : 'not_connected',
        accountEmail: data.accountEmail || null,
        lastSyncAt: data.lastSyncedAt || null,
      } : item));
    };
    void run();
  }, []);

  const connectedCount = useMemo(() => connectors.filter((item) => item.state === 'connected').length, [connectors]);

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">Connectors</h3>
          <p className="mt-0.5 text-[12px] text-[#9aa3b2]">{connectedCount} linked service{connectedCount === 1 ? '' : 's'}</p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#d7e7dc] bg-[#eef7f1] px-2.5 py-1 text-[11px] font-medium text-[#587764]"><CheckCircle2 className="h-3.5 w-3.5" />Real status</div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        {connectors.map((connector) => (
          <ConnectorRow
            key={connector.id}
            name={connector.name as never}
            icon={<ConnectorLogo name={connector.name as never} />}
            detail={connector.state === 'connected' ? 'Connected' : connector.state.replace('_', ' ')}
            mode={connector.state === 'connected' ? 'connected' : 'connect'}
            onAction={() => void onAction(connector.id, connector.state === 'connected' ? 'connected' : 'connect')}
          />
        ))}
      </div>
    </section>
  );
}
