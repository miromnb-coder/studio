'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, Clock3, Link2, ShieldCheck, Sparkles, X } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { WorkspaceConnectors } from './WorkspaceConnectors';
import type { ConnectorMode } from './ConnectorRow';
import {
  CONNECTOR_META,
  formatSyncLabel,
  getConnectorRecord,
  type ConnectorId,
  type ConnectorRecord,
} from '@/app/lib/connectors-state';

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

const CONNECTOR_DETAIL_CONTENT: Record<ConnectorId, { hero: string; quickActions: string[] }> = {
  gmail: {
    hero: 'Turn your inbox into clear actions, money insights, and fast follow-through.',
    quickActions: ['Summarize inbox', 'Show urgent emails', 'Find subscriptions', 'Search receipts'],
  },
  'google-calendar': {
    hero: 'Use your calendar to plan days, find focus windows, and remove schedule chaos.',
    quickActions: ['View today', 'Free time finder', 'Add reminder', 'Weekly plan'],
  },
  browser: {
    hero: 'Use live browsing for current research, source capture, and decision support.',
    quickActions: ['Live research', 'Capture sources', 'Compare options', 'Save findings'],
  },
  'google-drive': {
    hero: 'Search docs, PDFs, and project files instantly inside your operator workflows.',
    quickActions: ['Search files', 'Open recent docs', 'Find PDFs', 'Summarize document'],
  },
  github: {
    hero: 'Track repo activity, ship faster, and turn code context into practical actions.',
    quickActions: ['View repo activity', 'Recent commits', 'Open project', 'Analyze codebase'],
  },
  outlook: {
    hero: 'Bring enterprise email and calendar workflows into one premium command center.',
    quickActions: ['Summarize mailbox', 'Check priorities', 'Open meetings', 'Search messages'],
  },
};

function statusLabel(connector: ConnectorRecord) {
  if (connector.state === 'connected') return 'Connected';
  if (connector.state === 'connecting' || connector.state === 'reconnecting') return 'Connecting';
  if (connector.state === 'error') return 'Needs attention';
  return 'Not connected';
}

function OperatorHubPreview({ connectors, onConnectorAction, onRecentSelect }: {
  connectors: ConnectorRecord[];
  onConnectorAction: (connector: string, mode: ConnectorMode) => void;
  onRecentSelect: (id: RecentId) => void;
}) {
  const services = CONNECTOR_ORDER.map((id) => connectors.find((c) => c.id === id) ?? getConnectorRecord(id));
  const calendar = services.find((item) => item.id === 'google-calendar');
  const nextStep = calendar?.state === 'connected'
    ? 'Calendar tools are ready. Launch your daily plan in one tap.'
    : 'Connect Calendar to unlock planning tools.';

  return (
    <section className="space-y-3">
      <div className="rounded-[28px] border border-[#dde3ec] bg-[linear-gradient(180deg,#fbfcfe_0%,#f5f8fd_100%)] p-4 shadow-[0_12px_26px_rgba(47,55,68,0.08)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-[#2d3442]">Operator Hub</h3>
            <p className="mt-1 text-[12px] text-[#7e8796]">Launch tools, connected services, and recent operator workflows.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#d8e2ef] bg-white px-2.5 py-1 text-[11px] text-[#5f6876]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Live status
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {services.slice(0, 3).map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => onConnectorAction(service.id, service.state === 'connected' ? 'connected' : 'connect')}
              className="flex w-full items-center justify-between rounded-2xl border border-[#e4ebf4] bg-white/92 px-3 py-2.5 text-left transition hover:bg-white"
            >
              <span>
                <span className="block text-[13px] font-semibold text-[#2f3744]">{service.name}</span>
                <span className="text-[12px] text-[#7f8998]">{statusLabel(service)}</span>
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${service.state === 'connected' ? 'bg-[#66b27f]' : 'bg-[#c6cedb]'}`} />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] border border-[#dde3ec] bg-white p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b93a1]">Recommended next step</p>
        <p className="mt-2 text-[14px] text-[#2f3744]">{nextStep}</p>
      </div>

      <div className="rounded-[24px] border border-[#dde3ec] bg-white p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8b93a1]">Recent workflows</p>
        <div className="mt-2 space-y-2">
          {[
            { id: 'gmail-sync', label: 'Inbox summary completed' },
            { id: 'subscription-scan', label: 'Subscription scan ready' },
            { id: 'weekly-planner', label: 'Repo insights available' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onRecentSelect(item.id as RecentId)}
              className="flex w-full items-center justify-between rounded-xl border border-[#e8edf4] bg-[#fafcff] px-3 py-2.5 text-left text-[13px] text-[#364152] transition hover:bg-white"
            >
              <span>{item.label}</span>
              <Clock3 className="h-3.5 w-3.5 text-[#9ba4b2]" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WorkspaceSheet({
  open,
  onClose,
  onQuickAction: _onQuickAction,
  onConnectorAction,
  onToolSelect: _onToolSelect,
  onRecentSelect,
}: WorkspaceSheetProps) {
  const [detailId, setDetailId] = useState<ConnectorId | null>(null);
  const [connectors, setConnectors] = useState<ConnectorRecord[]>([]);

  useEffect(() => {
    if (!open) {
      setDetailId(null);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (detailId) {
          setDetailId(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailId, onClose, open]);

  const detailConnector = useMemo(
    () => (detailId ? connectors.find((item) => item.id === detailId) ?? getConnectorRecord(detailId) : null),
    [connectors, detailId],
  );

  const title = detailConnector ? detailConnector.name : 'Connectors';
  const subtitle = detailConnector
    ? CONNECTOR_DETAIL_CONTENT[detailConnector.id].hero
    : 'Connect apps and services to unlock Kivo operators.';

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 700) {
      onClose();
    }
  };

  const executeConnect = (id: ConnectorId) => {
    onConnectorAction(id, 'connect');
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-[#6f7787]/18 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-hidden rounded-t-[34px] border border-[#dde2ea] bg-[#f6f7fb] shadow-[0_-18px_48px_rgba(39,45,58,0.16)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            onDragEnd={handleDragEnd}
          >
            <div className="relative flex h-full max-h-[92dvh] flex-col">
              <div className="sticky top-0 z-10 bg-[#f6f7fb]/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:px-5">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8dde6]" />

                <div className="mb-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={detailId ? () => setDetailId(null) : onClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d9dee7] bg-[#f9fbfe] text-[#5d6572] shadow-[0_2px_8px_rgba(36,42,55,0.04)] transition hover:bg-white active:scale-[0.97]"
                    aria-label={detailId ? 'Back to connectors' : 'Close connectors'}
                  >
                    {detailId ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0">
                    <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2d3442]">{title}</h2>
                    <p className="mt-0.5 text-[13px] text-[#8b93a1]">{subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-5">
                {detailConnector ? (
                  <section className="space-y-4 pb-4">
                    <div className="rounded-[28px] border border-[#dde3ec] bg-[linear-gradient(180deg,#fbfcfe_0%,#f7f9fc_100%)] p-4 shadow-[0_10px_24px_rgba(64,72,88,0.06)]">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8b93a1]">{detailConnector.name}</p>
                      <p className="mt-2 text-[14px] leading-6 text-[#707887]">{CONNECTOR_DETAIL_CONTENT[detailConnector.id].hero}</p>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {CONNECTOR_DETAIL_CONTENT[detailConnector.id].quickActions.map((action) => (
                          <button key={action} type="button" onClick={() => onConnectorAction(detailConnector.id, 'connected')} className="rounded-2xl border border-[#e4eaf3] bg-white/92 px-3 py-2 text-left text-[12px] font-medium text-[#334155] transition hover:bg-white">
                            {action}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[24px] border border-[#dde3ec] bg-white p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
                      <h4 className="text-[13px] font-semibold text-[#2f3744]">Status</h4>
                      <div className="mt-2 space-y-1 text-[12px] text-[#6f7887]">
                        <p>Status: <span className="font-semibold text-[#2f3744]">{statusLabel(detailConnector)}</span></p>
                        <p>Account: {detailConnector.accountEmail || 'No account connected'}</p>
                        <p>Last sync: {formatSyncLabel(detailConnector.lastSyncAt)}</p>
                        <p>Permissions: {detailConnector.permissions.join(', ')}</p>
                      </div>
                    </div>

                    <div className="space-y-2 pb-6">
                      <button type="button" onClick={() => onConnectorAction(detailConnector.id, detailConnector.state === 'connected' ? 'connected' : 'connect')} className="w-full rounded-2xl bg-[#1f242c] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(15,23,42,0.22)] transition hover:bg-[#121820]">
                        {detailConnector.state === 'connected' ? 'Open tools' : 'Connect'}
                      </button>
                      <button type="button" onClick={() => onConnectorAction(detailConnector.id, 'manage')} className="w-full rounded-2xl border border-[#d7dfeb] bg-white px-4 py-3 text-sm font-semibold text-[#2f3744] transition hover:bg-[#f7f9fd]">
                        Reconnect
                      </button>
                      <button type="button" onClick={() => onConnectorAction(detailConnector.id, 'toggle')} className="w-full rounded-2xl border border-[#f1d7d7] bg-[#fff7f7] px-4 py-3 text-sm font-semibold text-[#8e4040] transition hover:bg-[#fff0f0]">
                        Disconnect
                      </button>
                    </div>
                  </section>
                ) : (
                  <div className="space-y-5 pb-4 pt-1">
                    <WorkspaceConnectors
                      onOpenDetail={(connector) => setDetailId(connector)}
                      onConnectorAction={(connector, mode) => onConnectorAction(connector, mode)}
                      onOpenAddConnector={() => setDetailId('gmail')}
                      onOpenManageAccess={() => onConnectorAction('gmail', 'manage')}
                      onConnectorsChange={setConnectors}
                    />

                    {connectors.filter((item) => item.state === 'connected').length === 0 ? (
                      <div className="rounded-[24px] border border-[#dde3ec] bg-white p-4 text-center shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
                        <p className="text-[14px] font-semibold text-[#2f3744]">Connect your first service to unlock real operator actions.</p>
                        <button
                          type="button"
                          onClick={() => executeConnect('gmail')}
                          className="mt-3 rounded-full bg-[#1f242c] px-4 py-2 text-xs font-semibold text-white"
                        >
                          Connect Gmail
                        </button>
                      </div>
                    ) : null}

                    <OperatorHubPreview
                      connectors={connectors}
                      onConnectorAction={onConnectorAction}
                      onRecentSelect={onRecentSelect}
                    />

                    <div className="rounded-[24px] border border-[#dde3ec] bg-white/95 p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
                      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8b93a1]"><Link2 className="h-3.5 w-3.5" />Premium connector ecosystem</p>
                      <p className="mt-2 text-[13px] leading-6 text-[#6f7887]">Every connector includes direct actions, live status, sync details, and clear privacy controls designed for operator-grade workflows.</p>
                      <p className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[#5f6876]"><Sparkles className="h-3.5 w-3.5" />Polished transitions and mobile-first flow enabled.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
