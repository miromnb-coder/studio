'use client';

import { useState } from 'react';
import { ConnectorLogo } from '@/app/components/connector-logos';
import { ConnectorRow, type ConnectorMode } from './ConnectorRow';

type WorkspaceConnectorsProps = {
  onAction: (connector: string, mode: ConnectorMode) => void;
};

type Connector = {
  id: string;
  name: 'Gmail' | 'Google Calendar' | 'Google Drive' | 'GitHub' | 'Outlook' | 'Browser';
  mode: ConnectorMode;
  active?: boolean;
  detail: string;
};

const initialConnectors: Connector[] = [
  { id: 'gmail', name: 'Gmail', mode: 'connected', detail: 'Inbox sync is current' },
  { id: 'google-calendar', name: 'Google Calendar', mode: 'connected', detail: 'Planner synced for this week' },
  { id: 'google-drive', name: 'Google Drive', mode: 'connected', detail: 'Drive documents indexed' },
  { id: 'github', name: 'GitHub', mode: 'toggle', active: true, detail: 'PR summaries enabled' },
  { id: 'browser', name: 'Browser', mode: 'connect', detail: 'Connect for research capture' },
  { id: 'outlook', name: 'Outlook', mode: 'manage', detail: 'Optional enterprise mailbox' },
];

export function WorkspaceConnectors({ onAction }: WorkspaceConnectorsProps) {
  const [connectors, setConnectors] = useState(initialConnectors);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">
          Connectors
        </h3>
        <span className="text-[12px] text-[#9aa3b2]">Linked services</span>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        {connectors.map((connector) => (
          <ConnectorRow
            key={connector.id}
            name={connector.name}
            icon={<ConnectorLogo name={connector.name} />}
            detail={connector.detail}
            mode={connector.mode}
            toggled={connector.active}
            onAction={() => {
              if (connector.mode === 'toggle') {
                setConnectors((prev) =>
                  prev.map((item) =>
                    item.id === connector.id ? { ...item, active: !item.active } : item,
                  ),
                );
              }

              onAction(connector.id, connector.mode);
            }}
          />
        ))}
      </div>
    </section>
  );
}
