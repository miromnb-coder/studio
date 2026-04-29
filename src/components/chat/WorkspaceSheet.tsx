'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronRight, Plus, Settings2, X } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo, useDragControls } from 'framer-motion';
import { ConnectorLogo } from '@/app/components/connector-logos';
import {
  getConnectorRecord,
  saveConnectorRecord,
  type ConnectorId,
  type ConnectorRecord,
  type ConnectorState,
} from '@/app/lib/connectors-state';
import type { ConnectorMode } from './ConnectorRow';
import { haptic } from '@/lib/haptics';

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

type RuntimeState = {
  state: ConnectorState;
  busy: boolean;
};

type ConnectorSheetItem = {
  id: ConnectorId | 'my-browser' | 'outlook-calendar' | 'instagram' | 'meta-ads-manager';
  connectorId?: ConnectorId;
  name: 'Gmail' | 'Google Calendar' | 'GitHub' | 'My Browser' | 'Google Drive' | 'Outlook' | 'Outlook Calendar' | 'Instagram' | 'Meta Ads Manager';
  state: ConnectorState;
  beta?: boolean;
  canToggle?: boolean;
};

const CONNECTOR_ORDER: ConnectorId[] = ['gmail', 'google-calendar', 'github', 'browser', 'google-drive', 'outlook'];
const TOGGLE_AFTER_CONNECTED = new Set<ConnectorId>(['gmail', 'google-calendar', 'github']);

const CONNECTOR_NAME_MAP: Partial<Record<ConnectorId, ConnectorSheetItem['name']>> = {
  gmail: 'Gmail',
  'google-calendar': 'Google Calendar',
  github: 'GitHub',
  browser: 'My Browser',
  'google-drive': 'Google Drive',
  outlook: 'Outlook',
};

function IOSSwitch({ active, disabled }: { active: boolean; disabled?: boolean }) {
  return (
    <span
      className={`relative inline-flex h-[31px] w-[51px] shrink-0 items-center rounded-full transition-colors duration-200 ${
        active ? 'bg-[#0a84ff]' : 'bg-[#e5e5e7]'
      } ${disabled ? 'opacity-70' : ''}`}
    >
      <span
        className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_7px_rgba(0,0,0,0.22)] transition-transform duration-200 ${
          active ? 'translate-x-[22px]' : 'translate-x-[2px]'
        }`}
      />
    </span>
  );
}

function ConnectorSheetRow({ item, onAction }: { item: ConnectorSheetItem; onAction: (item: ConnectorSheetItem) => void }) {
  const connected = item.state === 'connected';
  const busy = item.state === 'connecting' || item.state === 'reconnecting';
  const showSwitch = item.canToggle === true && connected;

  return (
    <li className="flex min-h-[73px] items-center gap-5 border-b border-black/[0.055] last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center">
        <ConnectorLogo name={item.name as never} />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="truncate text-[22px] font-normal tracking-[-0.045em] text-[#303030]">
          {item.name === 'Outlook' ? 'Outlook Mail' : item.name}
        </span>
        {item.beta ? (
          <span className="shrink-0 rounded-full border border-black/[0.12] bg-white/38 px-3 py-0.5 text-[16px] font-normal tracking-[-0.035em] text-[#8a8a8a]">
            Beta
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onAction(item)}
        className="shrink-0 text-[20px] font-normal tracking-[-0.04em] text-[#808080] active:opacity-60"
        aria-label={`${connected ? 'Manage' : 'Connect'} ${item.name}`}
      >
        {showSwitch ? <IOSSwitch active={!busy && connected} disabled={busy} /> : busy ? 'Connecting' : 'Connect'}
      </button>
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
  const closeWithHaptic = useCallback(() => {
    haptic.selection();
    onClose();
  }, [onClose]);
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
            const updated: ConnectorRecord = {
              ...item,
              state: gmailData.connected === true ? 'connected' : 'not_connected',
              accountEmail: typeof gmailData.accountEmail === 'string' ? gmailData.accountEmail : null,
              lastSyncAt: typeof gmailData.lastSyncedAt === 'string' ? gmailData.lastSyncedAt : null,
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
    if (!open) return;
    haptic.light();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    void hydrateConnectors();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWithHaptic();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeWithHaptic, hydrateConnectors, open]);

  const resolvedConnectors = useMemo(
    () =>
      connectors.map((connector) => {
        const runtime = runtimeState[connector.id];
        if (!runtime) return connector;
        return { ...connector, state: runtime.state };
      }),
    [connectors, runtimeState],
  );

  const sheetItems = useMemo<ConnectorSheetItem[]>(() => {
    const byId = new Map(resolvedConnectors.map((connector) => [connector.id, connector]));
    const primary = CONNECTOR_ORDER.map((id) => {
      const connector = byId.get(id) ?? getConnectorRecord(id);
      return {
        id,
        connectorId: id,
        name: CONNECTOR_NAME_MAP[id] ?? connector.name,
        state: connector.state,
        canToggle: TOGGLE_AFTER_CONNECTED.has(id),
      } as ConnectorSheetItem;
    });

    return [
      ...primary,
      { id: 'outlook-calendar', name: 'Outlook Calendar', state: 'not_connected' },
      { id: 'instagram', name: 'Instagram', state: 'not_connected', beta: true },
      { id: 'meta-ads-manager', name: 'Meta Ads Manager', state: 'not_connected', beta: true },
    ];
  }, [resolvedConnectors]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 650) {
      closeWithHaptic();
    } else {
      haptic.light();
    }
  };

  const updateConnector = useCallback((id: ConnectorId, state: ConnectorState) => {
    setConnectors((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, state };
        saveConnectorRecord(id, updated);
        return updated;
      }),
    );
    setRuntimeState((prev) => ({
      ...prev,
      [id]: { state, busy: state === 'connecting' || state === 'reconnecting' },
    }));
  }, []);

  const handleConnectorAction = useCallback(
    (item: ConnectorSheetItem) => {
      haptic.selection();
      if (!item.connectorId) return;

      if (item.canToggle === true && item.state === 'connected') {
        updateConnector(item.connectorId, 'not_connected');
        onConnectorAction(item.connectorId, 'toggle');
        return;
      }

      updateConnector(item.connectorId, 'connecting');
      onConnectorAction(item.connectorId, 'connect');
    },
    [onConnectorAction, updateConnector],
  );

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/86"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWithHaptic}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 mx-auto h-[calc(100dvh-104px)] max-w-[560px] overflow-hidden rounded-t-[10px] bg-[#f6f6f4] text-[#303030] shadow-[0_-14px_30px_rgba(0,0,0,0.18)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 38, mass: 0.82 }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.18 }}
            onDragEnd={handleDragEnd}
          >
            <div className="flex h-full flex-col">
              <header className="relative h-[118px] shrink-0 px-8 pt-2">
                <button
                  type="button"
                  onPointerDown={(event) => dragControls.start(event)}
                  className="mx-auto block h-7 w-28 touch-none pt-2"
                  aria-label="Drag to dismiss"
                >
                  <span className="mx-auto block h-1.5 w-[66px] rounded-full bg-black/18" />
                </button>

                <button
                  type="button"
                  onClick={closeWithHaptic}
                  className="absolute left-8 top-[34px] grid h-9 w-9 place-items-center text-[#303030] active:opacity-55"
                  aria-label="Close connectors"
                >
                  <X className="h-8 w-8" strokeWidth={1.9} />
                </button>

                <h2 className="absolute left-1/2 top-[38px] -translate-x-1/2 text-center text-[24px] font-semibold tracking-[-0.04em] text-black">
                  Connectors
                </h2>
              </header>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-8 pb-[max(32px,env(safe-area-inset-bottom))] [-webkit-overflow-scrolling:touch]">
                <section className="overflow-hidden rounded-[28px] bg-[#ededeb] px-7 py-3">
                  <button
                    type="button"
                    onClick={() => handleConnectorAction({ id: 'gmail', connectorId: 'gmail', name: 'Gmail', state: 'not_connected' })}
                    className="flex min-h-[72px] w-full items-center gap-5 border-b border-black/[0.06] text-left active:opacity-60"
                  >
                    <Plus className="h-8 w-8 shrink-0" strokeWidth={1.9} />
                    <span className="flex flex-1 items-center justify-between gap-5">
                      <span className="text-[22px] font-normal tracking-[-0.045em]">Add connectors</span>
                      <ChevronRight className="h-7 w-7 text-[#7b7b7b]" strokeWidth={2.2} />
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleConnectorAction({ id: 'gmail', connectorId: 'gmail', name: 'Gmail', state: 'connected' })}
                    className="flex min-h-[72px] w-full items-center gap-5 text-left active:opacity-60"
                  >
                    <Settings2 className="h-8 w-8 shrink-0" strokeWidth={1.9} />
                    <span className="flex flex-1 items-center justify-between gap-5">
                      <span className="text-[22px] font-normal tracking-[-0.045em]">Manage connectors</span>
                      <ChevronRight className="h-7 w-7 text-[#7b7b7b]" strokeWidth={2.2} />
                    </span>
                  </button>
                </section>

                <section className="mt-12 overflow-hidden rounded-[28px] bg-[#ededeb] px-7 py-3">
                  <ul>
                    {sheetItems.map((item) => (
                      <ConnectorSheetRow key={item.id} item={item} onAction={handleConnectorAction} />
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
