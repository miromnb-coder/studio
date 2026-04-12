'use client';

import { useState, type ReactNode } from 'react';
import { CalendarDays, Github, Globe, Mail, HardDrive, Inbox } from 'lucide-react';
import { ConnectorRow, type ConnectorMode } from './ConnectorRow';

type WorkspaceConnectorsProps = {
  onAction: (connector: string, mode: ConnectorMode) => void;
};

type Connector = {
  id: string;
  name: string;
  mode: ConnectorMode;
  active?: boolean;
  icon: ReactNode;
};

const initialConnectors: Connector[] = [
  { id: 'gmail', name: 'Gmail', mode: 'connected', icon: <Mail className="h-5 w-5" /> },
  { id: 'google-calendar', name: 'Google Calendar', mode: 'connected', icon: <CalendarDays className="h-5 w-5" /> },
  { id: 'google-drive', name: 'Google Drive', mode: 'connected', icon: <HardDrive className="h-5 w-5" /> },
  { id: 'github', name: 'GitHub', mode: 'toggle', active: true, icon: <Github className="h-5 w-5" /> },
  { id: 'browser', name: 'Browser', mode: 'connect', icon: <Globe className="h-5 w-5" /> },
  { id: 'outlook', name: 'Outlook', mode: 'manage', icon: <Inbox className="h-5 w-5" /> },
];

export function WorkspaceConnectors({ onAction }: WorkspaceConnectorsProps) {
  const [connectors, setConnectors] = useState(initialConnectors);

  return (
    <section>
      <h3 className="mb-3 text-[17px] font-semibold text-[#4a5160]">Connectors</h3>
      <div className="overflow-hidden rounded-[22px] border border-[#e0e4ea] bg-[#fbfcfe] shadow-[0_6px_18px_rgba(80,87,101,0.05)]">
        {connectors.map((connector) => (
          <ConnectorRow
            key={connector.id}
            name={connector.name}
            icon={connector.icon}
            mode={connector.mode}
            toggled={connector.active}
            onAction={() => {
              if (connector.mode === 'toggle') {
                setConnectors((prev) => prev.map((item) => (item.id === connector.id ? { ...item, active: !item.active } : item)));
              }
              onAction(connector.id, connector.mode);
            }}
          />
        ))}
      </div>
    </section>
  );
}
