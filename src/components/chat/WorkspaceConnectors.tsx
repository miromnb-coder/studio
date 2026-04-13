'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { ConnectorLogo } from '@/app/components/connector-logos';
import { ConnectorRow, type ConnectorMode } from './ConnectorRow';

type WorkspaceConnectorsProps = {
  onAction: (connector: string, mode: ConnectorMode) => void | Promise<void>;
};

type ConnectorName =
  | 'Gmail'
  | 'Google Calendar'
  | 'Google Drive'
  | 'GitHub'
  | 'Outlook'
  | 'Browser';

type ConnectorStatus =
  | 'connected'
  | 'connecting'
  | 'disconnected'
  | 'managing';

type Connector = {
  id: string;
  name: ConnectorName;
  status: ConnectorStatus;
  mode: ConnectorMode;
  active?: boolean;
  detail: string;
};

const initialConnectors: Connector[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    status: 'connected',
    mode: 'connected',
    detail: 'Inbox sync is current',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    status: 'connected',
    mode: 'connected',
    detail: 'Planner synced for this week',
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    status: 'connected',
    mode: 'connected',
    detail: 'Drive documents indexed',
  },
  {
    id: 'github',
    name: 'GitHub',
    status: 'connected',
    mode: 'toggle',
    active: true,
    detail: 'PR summaries enabled',
  },
  {
    id: 'browser',
    name: 'Browser',
    status: 'disconnected',
    mode: 'connect',
    detail: 'Connect for research capture',
  },
  {
    id: 'outlook',
    name: 'Outlook',
    status: 'connected',
    mode: 'manage',
    detail: 'Optional enterprise mailbox',
  },
];

type Feedback =
  | { kind: 'success'; message: string }
  | { kind: 'info'; message: string }
  | null;

export function WorkspaceConnectors({
  onAction,
}: WorkspaceConnectorsProps) {
  const [connectors, setConnectors] = useState(initialConnectors);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const connectedCount = useMemo(
    () =>
      connectors.filter(
        (item) =>
          item.status === 'connected' ||
          (item.mode === 'toggle' && item.active),
      ).length,
    [connectors],
  );

  const setConnector = (
    id: string,
    updater: (current: Connector) => Connector,
  ) => {
    setConnectors((prev) =>
      prev.map((item) => (item.id === id ? updater(item) : item)),
    );
  };

  const showFeedback = (next: Feedback) => {
    setFeedback(next);
    window.clearTimeout((showFeedback as typeof showFeedback & { _t?: number })._t);
    (showFeedback as typeof showFeedback & { _t?: number })._t = window.setTimeout(() => {
      setFeedback(null);
    }, 2200);
  };

  const handleConnectorAction = async (connector: Connector) => {
    if (busyId) return;

    setBusyId(connector.id);

    try {
      if (connector.mode === 'toggle') {
        const nextActive = !connector.active;

        setConnector(connector.id, (current) => ({
          ...current,
          active: nextActive,
          detail: nextActive
            ? 'PR summaries enabled'
            : 'PR summaries paused',
        }));

        await onAction(connector.id, connector.mode);

        showFeedback({
          kind: 'success',
          message: nextActive
            ? 'GitHub summaries enabled'
            : 'GitHub summaries paused',
        });

        return;
      }

      if (connector.mode === 'connect') {
        setConnector(connector.id, (current) => ({
          ...current,
          status: 'connecting',
          detail: 'Connecting…',
        }));

        await onAction(connector.id, connector.mode);

        setConnector(connector.id, (current) => ({
          ...current,
          status: 'connected',
          mode: 'connected',
          detail:
            current.name === 'Browser'
              ? 'Research capture is ready'
              : 'Connected successfully',
        }));

        showFeedback({
          kind: 'success',
          message: `${connector.name} connected`,
        });

        return;
      }

      if (connector.mode === 'connected') {
        setConnector(connector.id, (current) => ({
          ...current,
          status: 'managing',
          detail: 'Opening tools…',
        }));

        await onAction(connector.id, connector.mode);

        setConnector(connector.id, (current) => ({
          ...current,
          status: 'connected',
          detail:
            current.name === 'Gmail'
              ? 'Inbox tools ready'
              : current.name === 'Google Calendar'
                ? 'Planner tools ready'
                : current.name === 'Google Drive'
                  ? 'Drive tools ready'
                  : 'Connected and ready',
        }));

        showFeedback({
          kind: 'info',
          message: `${connector.name} tools opened`,
        });

        return;
      }

      if (connector.mode === 'manage') {
        setConnector(connector.id, (current) => ({
          ...current,
          status: 'managing',
          detail: 'Opening settings…',
        }));

        await onAction(connector.id, connector.mode);

        setConnector(connector.id, (current) => ({
          ...current,
          status: 'connected',
          detail: 'Management opened',
        }));

        showFeedback({
          kind: 'info',
          message: `${connector.name} settings opened`,
        });
      }
    } catch {
      setConnector(connector.id, (current) => ({
        ...current,
        status: current.mode === 'connect' ? 'disconnected' : 'connected',
        detail: 'Something went wrong. Try again.',
      }));

      showFeedback({
        kind: 'info',
        message: `Could not update ${connector.name}`,
      });
    } finally {
      setBusyId(null);
    }
  };

  const renderedConnectors = connectors.map((connector) => {
    const isBusy = busyId === connector.id;

    let detail = connector.detail;
    if (isBusy && connector.mode === 'connect') detail = 'Connecting…';
    if (isBusy && connector.mode === 'connected') detail = 'Opening tools…';
    if (isBusy && connector.mode === 'manage') detail = 'Opening settings…';

    return {
      ...connector,
      renderedDetail: detail,
    };
  });

  return (
    <section>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#4b5563]">
            Connectors
          </h3>
          <p className="mt-0.5 text-[12px] text-[#9aa3b2]">
            {connectedCount} linked service{connectedCount === 1 ? '' : 's'}
          </p>
        </div>

        {feedback ? (
          <div
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              feedback.kind === 'success'
                ? 'border-[#d7e7dc] bg-[#eef7f1] text-[#587764]'
                : 'border-[#dde3ec] bg-[#f5f7fb] text-[#66707e]'
            }`}
          >
            {feedback.kind === 'success' ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Loader2 className="h-3.5 w-3.5" />
            )}
            {feedback.message}
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        {renderedConnectors.map((connector) => (
          <ConnectorRow
            key={connector.id}
            name={connector.name}
            icon={<ConnectorLogo name={connector.name} />}
            detail={connector.renderedDetail}
            mode={connector.mode}
            toggled={connector.active}
            onAction={() => void handleConnectorAction(connector)}
          />
        ))}
      </div>
    </section>
  );
}
