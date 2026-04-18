'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, ChevronLeft, Loader2, PlugZap, Settings2, Unplug, X } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo, useDragControls } from 'framer-motion';
import { ConnectorLogo } from '@/app/components/connector-logos';
import {
  CONNECTOR_META,
  formatSyncLabel,
  getConnectorRecord,
  saveConnectorRecord,
  type ConnectorId,
  type ConnectorRecord,
  type ConnectorState,
} from '@/app/lib/connectors-state';
import type { ConnectorMode } from './ConnectorRow';

type QuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';
type ToolId = 'finance-scanner' | 'memory-search' | 'research-mode' | 'compare-tool' | 'automation-builder';
type RecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';

type WorkspaceSheetProps = {
  open: boolean;
  onClose: () => void;
  onQuickAction: (id: QuickActionId) => void;
  onConnectorAction: (connector: string, mode: ConnectorMode) => void;
  onToolSelect: (id: ToolId) => void;
  onRecentSelect: (id: RecentId) => void;
};

const CONNECTOR_ORDER: ConnectorId[] = ['gmail', 'google-calendar', 'browser', 'google-drive', 'github', 'outlook'];

type RuntimeState = {
  state: ConnectorState;
  busy: boolean;
};

const DETAIL_SUBTITLE: Record<ConnectorId, string> = {
  gmail: 'Email actions, search, and subscription intelligence.',
  'google-calendar': 'Calendar planning and schedule automation.',
  browser: 'Live web search, comparisons, and current research.',
  'google-drive': 'Document search and workspace file context.',
  github: 'Repository context and code workflow automations.',
  outlook: 'Enterprise mailbox and meeting operations.',
};

const CONNECTOR_STATUS_LABEL: Record<ConnectorState, string> = {
  connected: 'Connected',
  connecting: 'Connecting',
  error: 'Needs attention',
  not_connected: 'Not connected',
  reconnecting: 'Connecting',
};

function ConnectorListRow({
  connector,
  onOpen,
  onAction,
}: {
  connector: ConnectorRecord;
  onOpen: (id: ConnectorId) => void;
  onAction: (id: ConnectorId) => void;
}) {
  const isBusy = connector.state === 'connecting' || connector.state === 'reconnecting';
  const isConnected = connector.state === 'connected';

  return (
    <li>
      <div className="flex items-center gap-3 rounded-2xl border border-[#e8edf4] bg-white p-3 shadow-[0_1px_2px_rgba(18,23,34,0.04)]">
        <button
          type="button"
          onClick={() => onOpen(connector.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
          aria-label={`Open ${connector.name} details`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e4e9f1] bg-[#fbfdff] text-[#485365]">
            <ConnectorLogo name={connector.name as never} />
          </span>

          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-[#1f2937]">{connector.name}</span>
            <span className="mt-0.5 block text-[12px] text-[#6b7280]">{CONNECTOR_STATUS_LABEL[connector.state]}</span>
          </span>
        </button>

        {isBusy ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#dde4ef] bg-[#f7f9fc] px-3 py-1.5 text-[11px] font-medium text-[#607086]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Connecting
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAction(connector.id)}
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition active:scale-[0.98] ${
              isConnected
                ? 'border border-[#dce4f0] bg-white text-[#334155] hover:bg-[#f8fafc]'
                : connector.state === 'error'
                  ? 'border border-[#f0d2d2] bg-[#fff7f7] text-[#934646] hover:bg-[#fff1f1]'
                  : 'bg-[#111827] text-white hover:bg-[#0b1220]'
            }`}
          >
            {isConnected ? 'Manage' : connector.state === 'error' ? 'Reconnect' : 'Connect'}
            {!isConnected ? <ArrowRight className="h-3.5 w-3.5" /> : null}
          </button>
        )}
      </div>
    </li>
  );
}

export function WorkspaceSheet({
  open,
  onClose,
  onQuickAction: _onQuickAction,
  onConnectorAction,
  onToolSelect: _onToolSelect,
  onRecentSelect: _onRecentSelect,
}: WorkspaceSheetProps) {
  const dragControls = useDragControls();
  const [detailId, setDetailId] = useState<ConnectorId | null>(null);
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);
  const [runtimeState, setRuntimeState] = useState<Partial<Record<ConnectorId, RuntimeState>>>({});

  const hydrateConnectors = useCallback(async () => {
    const base = CONNECTOR_ORDER.map((id) => getConnectorRecord(id));
    setConnectors(base);

    try {
      const [gmailResponse, calendarResponse, browserResponse] = await Promise.all([
        fetch('/api/integrations/gmail/status', { cache: 'no-store' }),
        fetch('/api/integrations/google-calendar/status', { cache: 'no-store' }),
        fetch('/api/integrations/browser/status', { cache: 'no-store' }),
      ]);

      const gmailData = gmailResponse.ok ? (await gmailResponse.json()) as Record<string, unknown> : null;
      const calendarData = calendarResponse.ok ? (await calendarResponse.json()) as Record<string, unknown> : null;
      const browserData = browserResponse.ok ? (await browserResponse.json()) as Record<string, unknown> : null;

      setConnectors((prev) =>
        prev.map((item) => {
          if (item.id === 'gmail' && gmailData) {
            const isConnected = gmailData.connected === true;
            const isError = gmailData.status === 'error';
            const updated: ConnectorRecord = {
              ...item,
              state: isConnected ? (isError ? 'error' : 'connected') : 'not_connected',
              accountEmail: typeof gmailData.accountEmail === 'string' ? gmailData.accountEmail : null,
              lastSyncAt: typeof gmailData.lastSyncedAt === 'string' ? gmailData.lastSyncedAt : null,
              permissions:
                Array.isArray(gmailData.permissions) && gmailData.permissions.every((permission) => typeof permission === 'string')
                  ? gmailData.permissions as string[]
                  : item.permissions,
              errorMessage: typeof gmailData.errorMessage === 'string' ? gmailData.errorMessage : null,
            };
            saveConnectorRecord('gmail', updated);
            return updated;
          }

          if (item.id === 'google-calendar' && calendarData) {
            const updated: ConnectorRecord = {
              ...item,
              state: calendarData.connected === true ? 'connected' : 'not_connected',
              accountEmail: typeof calendarData.accountEmail === 'string' ? calendarData.accountEmail : null,
              lastSyncAt: typeof calendarData.lastSyncAt === 'string' ? calendarData.lastSyncAt : null,
              permissions:
                Array.isArray(calendarData.permissions) && calendarData.permissions.every((permission) => typeof permission === 'string')
                  ? calendarData.permissions as string[]
                  : item.permissions,
              errorMessage: typeof calendarData.errorMessage === 'string' ? calendarData.errorMessage : null,
            };
            saveConnectorRecord('google-calendar', updated);
            return updated;
          }

          if (item.id === 'browser' && browserData) {
            const updated: ConnectorRecord = {
              ...item,
              state: browserData.connected === true ? 'connected' : 'not_connected',
              accountEmail: null,
              lastSyncAt: null,
              permissions:
                Array.isArray(browserData.permissions) && browserData.permissions.every((permission) => typeof permission === 'string')
                  ? browserData.permissions as string[]
                  : item.permissions,
              tools:
                Array.isArray(browserData.tools) && browserData.tools.every((tool) => typeof tool === 'string')
                  ? browserData.tools as string[]
                  : item.tools,
              errorMessage: typeof browserData.errorMessage === 'string' ? browserData.errorMessage : null,
            };
            saveConnectorRecord('browser', updated);
            return updated;
          }

          return item;
        }),
      );
    } catch {
      // keep locally hydrated state
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setDetailId(null);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    void hydrateConnectors();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (detailId) {
        setDetailId(null);
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailId, hydrateConnectors, onClose, open]);

  const resolvedConnectors = useMemo(
    () =>
      connectors.map((connector) => {
        const runtime = runtimeState[connector.id];
        if (!runtime) return connector;
        return { ...connector, state: runtime.state };
      }),
    [connectors, runtimeState],
  );

  const detailConnector = useMemo(
    () => (detailId ? resolvedConnectors.find((item) => item.id === detailId) ?? getConnectorRecord(detailId) : null),
    [detailId, resolvedConnectors],
  );

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 650) onClose();
  };

  const updateConnector = useCallback((id: ConnectorId, state: ConnectorState, extra?: Partial<ConnectorRecord>) => {
    setConnectors((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...extra, state };
        saveConnectorRecord(id, updated);
        return updated;
      });
      return next;
    });
    setRuntimeState((prev) => ({
      ...prev,
      [id]: { state, busy: state === 'connecting' || state === 'reconnecting' },
    }));
  }, []);

  const handleConnectorAction = useCallback(
    (id: ConnectorId, mode: ConnectorMode) => {
      if (mode === 'connect') {
        const current = resolvedConnectors.find((item) => item.id === id);
        updateConnector(id, current?.state === 'error' ? 'reconnecting' : 'connecting', { errorMessage: null });
      }

      if (mode === 'toggle') {
        updateConnector(id, 'not_connected', { accountEmail: null, errorMessage: null, lastSyncAt: null });
      }

      onConnectorAction(id, mode);

      if (mode === 'toggle' || mode === 'manage') {
        setTimeout(() => {
          void hydrateConnectors();
        }, 500);
      }
    },
    [hydrateConnectors, onConnectorAction, resolvedConnectors, updateConnector],
  );

  const title = detailConnector ? detailConnector.name : 'Connectors';
  const subtitle = detailConnector ? DETAIL_SUBTITLE[detailConnector.id] : 'Connect apps and services';
  const connectedCount = resolvedConnectors.filter((item) => item.state === 'connected').length;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[#0f172a]/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-hidden rounded-t-[30px] border border-[#e5eaf2] bg-[#f8faff] shadow-[0_-20px_48px_rgba(15,23,42,0.16)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full max-h-[92dvh] min-h-[56dvh] flex-col">
              <header className="sticky top-0 z-10 border-b border-[#e8edf5] bg-[#f8faff]/95 px-4 pb-3 pt-2 backdrop-blur-xl sm:px-5">
                <button
                  type="button"
                  onPointerDown={(event) => dragControls.start(event)}
                  className="mx-auto mb-2 block w-full touch-none"
                  aria-label="Drag to dismiss"
                >
                  <span className="mx-auto block h-1.5 w-14 rounded-full bg-[#d3dae6]" />
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={detailId ? () => setDetailId(null) : onClose}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dde5f0] bg-white text-[#546173]"
                    aria-label={detailId ? 'Back to connectors' : 'Close connectors'}
                  >
                    {detailId ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0">
                    <h2 className="truncate text-[22px] font-semibold tracking-[-0.03em] text-[#101827]">{title}</h2>
                    <p className="truncate text-[13px] text-[#667085]">{subtitle}</p>
                  </div>
                </div>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(20px,env(safe-area-inset-bottom))] pt-4 sm:px-5">
                {detailConnector ? (
                  <section className="space-y-4 pb-2">
                    <div className="rounded-2xl border border-[#e3e9f2] bg-white p-4 shadow-[0_6px_20px_rgba(16,24,40,0.06)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[13px] font-semibold text-[#1f2937]">Status</p>
                          <p className="mt-1 text-[12px] text-[#6b7280]">{CONNECTOR_STATUS_LABEL[detailConnector.state]}</p>
                        </div>
                        {detailConnector.state === 'error' ? <AlertTriangle className="h-4 w-4 text-[#a34a4a]" /> : <CheckCircle2 className="h-4 w-4 text-[#3c8f5b]" />}
                      </div>

                      <dl className="mt-3 space-y-1.5 text-[12px] text-[#4b5563]">
                        <div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Account</dt><dd className="truncate text-right">{detailConnector.accountEmail || 'Not connected'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Last sync</dt><dd className="text-right">{formatSyncLabel(detailConnector.lastSyncAt)}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-[#6b7280]">Permissions</dt><dd className="text-right">{detailConnector.permissions.length}</dd></div>
                      </dl>
                    </div>

                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleConnectorAction(
                            detailConnector.id,
                            detailConnector.state === 'connected' ? 'connected' : 'connect',
                          )
                        }
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white"
                      >
                        {detailConnector.state === 'connecting' || detailConnector.state === 'reconnecting' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PlugZap className="h-4 w-4" />
                        )}
                        {detailConnector.id === 'browser'
                          ? detailConnector.state === 'connected'
                            ? 'Open browser search'
                            : 'Enable browser search'
                          : detailConnector.state === 'connected'
                            ? 'Open tools'
                            : 'Connect'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectorAction(detailConnector.id, detailConnector.state === 'connected' ? 'manage' : 'connect')}
                        className="w-full rounded-2xl border border-[#dce3ee] bg-white px-4 py-3 text-sm font-semibold text-[#334155]"
                      >
                        {detailConnector.state === 'connected' ? 'Manage' : 'Reconnect'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConnectorAction(detailConnector.id, 'toggle')}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f1d2d2] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[#923f3f]"
                      >
                        <Unplug className="h-4 w-4" />
                        Disconnect
                      </button>
                    </div>
                  </section>
                ) : (
                  <section className="space-y-4">
                    <div className="rounded-2xl border border-[#e4eaf3] bg-white p-2 shadow-[0_8px_24px_rgba(17,24,39,0.06)]">
                      <button
                        type="button"
                        onClick={() => setDetailId('gmail')}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[#f8fbff]"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f2937]"><PlugZap className="h-4 w-4" />Add connectors</span>
                        <span className="text-xs text-[#6b7280]">Start with Gmail</span>
                      </button>

                      <div className="mx-3 h-px bg-[#edf1f7]" />

                      <button
                        type="button"
                        onClick={() => handleConnectorAction('gmail', 'manage')}
                        className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-[#f8fbff]"
                      >
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1f2937]"><Settings2 className="h-4 w-4" />Manage connectors</span>
                        <span className="text-xs text-[#6b7280]">Permissions and tools</span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-[#e4eaf3] bg-[#fbfdff] p-2 shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
                      <ul className="space-y-2">
                        {resolvedConnectors.map((connector) => (
                          <ConnectorListRow
                            key={connector.id}
                            connector={{ ...CONNECTOR_META[connector.id], ...connector }}
                            onOpen={setDetailId}
                            onAction={(id) =>
                              handleConnectorAction(id, connector.state === 'connected' ? 'manage' : 'connect')
                            }
                          />
                        ))}
                      </ul>
                    </div>

                    <p className="px-1 text-[12px] text-[#6b7280]">Connect your tools to unlock real operator actions.</p>
                    <p className="px-1 text-[11px] text-[#9aa4b2]">{connectedCount} connected</p>
                  </section>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
