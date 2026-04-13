'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { WorkspaceQuickActions } from './WorkspaceQuickActions';
import { WorkspaceConnectors } from './WorkspaceConnectors';
import { WorkspaceTools } from './WorkspaceTools';
import { WorkspaceRecent } from './WorkspaceRecent';
import type { ConnectorMode } from './ConnectorRow';

type QuickActionId = 'analyze' | 'planner' | 'money-saver' | 'ask-agent';
type ToolId =
  | 'finance-scanner'
  | 'memory-search'
  | 'research-mode'
  | 'compare-tool'
  | 'automation-builder';
type RecentId = 'gmail-sync' | 'subscription-scan' | 'weekly-planner';

type ConnectorDetailView =
  | {
      type: 'connector';
      connector: string;
      title: string;
      subtitle: string;
      actions: Array<{
        id: string;
        label: string;
        detail: string;
        mode: ConnectorMode;
      }>;
    }
  | null;

type WorkspaceSheetProps = {
  open: boolean;
  onClose: () => void;
  onQuickAction: (id: QuickActionId) => void;
  onConnectorAction: (connector: string, mode: ConnectorMode) => void;
  onToolSelect: (id: ToolId) => void;
  onRecentSelect: (id: RecentId) => void;
};

const CONNECTOR_DETAILS: Record<
  string,
  NonNullable<ConnectorDetailView>
> = {
  gmail: {
    type: 'connector',
    connector: 'gmail',
    title: 'Gmail',
    subtitle: 'Email tools and inbox actions',
    actions: [
      {
        id: 'gmail-open',
        label: 'Open Gmail tools',
        detail: 'Search inbox, scan subscriptions, and summarize email.',
        mode: 'connected',
      },
      {
        id: 'gmail-manage',
        label: 'Manage connection',
        detail: 'Review sync settings and reconnect if needed.',
        mode: 'manage',
      },
    ],
  },
  'google-calendar': {
    type: 'connector',
    connector: 'google-calendar',
    title: 'Google Calendar',
    subtitle: 'Planning, schedule, and event actions',
    actions: [
      {
        id: 'calendar-open',
        label: 'Open planning tools',
        detail: 'Check schedule, free time, and calendar actions.',
        mode: 'connected',
      },
      {
        id: 'calendar-manage',
        label: 'Manage calendar',
        detail: 'Review sync settings and connected calendars.',
        mode: 'manage',
      },
    ],
  },
  'google-drive': {
    type: 'connector',
    connector: 'google-drive',
    title: 'Google Drive',
    subtitle: 'Files, docs, and search actions',
    actions: [
      {
        id: 'drive-open',
        label: 'Open Drive tools',
        detail: 'Search files and open document workflows.',
        mode: 'connected',
      },
      {
        id: 'drive-manage',
        label: 'Manage Drive',
        detail: 'Review indexing and connection settings.',
        mode: 'manage',
      },
    ],
  },
  github: {
    type: 'connector',
    connector: 'github',
    title: 'GitHub',
    subtitle: 'Repo summaries and developer actions',
    actions: [
      {
        id: 'github-toggle',
        label: 'Toggle summaries',
        detail: 'Enable or disable repository summary automation.',
        mode: 'toggle',
      },
      {
        id: 'github-manage',
        label: 'Open GitHub tools',
        detail: 'View repository and coding-related tools.',
        mode: 'manage',
      },
    ],
  },
  browser: {
    type: 'connector',
    connector: 'browser',
    title: 'Browser',
    subtitle: 'Research capture and browsing tools',
    actions: [
      {
        id: 'browser-connect',
        label: 'Connect browser',
        detail: 'Enable live research capture and browsing actions.',
        mode: 'connect',
      },
    ],
  },
  outlook: {
    type: 'connector',
    connector: 'outlook',
    title: 'Outlook',
    subtitle: 'Enterprise mailbox actions',
    actions: [
      {
        id: 'outlook-open',
        label: 'Open Outlook tools',
        detail: 'Manage mailbox tools and summary actions.',
        mode: 'manage',
      },
    ],
  },
};

export function WorkspaceSheet({
  open,
  onClose,
  onQuickAction,
  onConnectorAction,
  onToolSelect,
  onRecentSelect,
}: WorkspaceSheetProps) {
  const [detailView, setDetailView] = useState<ConnectorDetailView>(null);

  useEffect(() => {
    if (!open) {
      setDetailView(null);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (detailView) {
          setDetailView(null);
          return;
        }
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose, detailView]);

  const title = useMemo(() => {
    if (detailView) return detailView.title;
    return 'Workspace Hub';
  }, [detailView]);

  const subtitle = useMemo(() => {
    if (detailView) return detailView.subtitle;
    return 'Tools, connectors, and recent operator activity';
  }, [detailView]);

  const handleClose = () => {
    setDetailView(null);
    onClose();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 700) {
      handleClose();
    }
  };

  const handleConnectorPress = (connector: string, mode: ConnectorMode) => {
    const detail = CONNECTOR_DETAILS[connector];
    if (detail) {
      setDetailView(detail);
      return;
    }
    onConnectorAction(connector, mode);
  };

  const renderDetailView = () => {
    if (!detailView) return null;

    return (
      <section className="space-y-3">
        <div className="rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
          <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#2f3744]">
            {detailView.title}
          </p>
          <p className="mt-1 text-[12px] leading-snug text-[#8b93a1]">
            {detailView.subtitle}
          </p>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
          {detailView.actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onConnectorAction(detailView.connector, action.mode)}
              className={`flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-[#f5f7fb] active:scale-[0.995] ${
                index !== detailView.actions.length - 1 ? 'border-b border-[#e8ecf2]' : ''
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#2f3744]">
                  {action.label}
                </span>
                <span className="mt-0.5 block text-[12px] leading-snug text-[#8b93a1]">
                  {action.detail}
                </span>
              </span>

              <span className="ml-3 shrink-0 text-[12px] font-medium text-[#6f7786]">
                Open
              </span>
            </button>
          ))}
        </div>
      </section>
    );
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
            onClick={handleClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90dvh] overflow-hidden rounded-t-[34px] border border-[#dde2ea] bg-[#f6f7fb] shadow-[0_-18px_48px_rgba(39,45,58,0.16)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.16 }}
            onDragEnd={handleDragEnd}
          >
            <div className="relative flex h-full max-h-[90dvh] flex-col">
              <div className="sticky top-0 z-10 bg-[#f6f7fb]/95 px-4 pb-3 pt-3 backdrop-blur-xl sm:px-5">
                <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8dde6]" />

                <div className="mb-1 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={detailView ? () => setDetailView(null) : handleClose}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d9dee7] bg-[#f9fbfe] text-[#5d6572] shadow-[0_2px_8px_rgba(36,42,55,0.04)] transition hover:bg-white active:scale-[0.97]"
                    aria-label={detailView ? 'Back to workspace hub' : 'Close workspace hub'}
                  >
                    {detailView ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0">
                    <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2d3442]">
                      {title}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[#8b93a1]">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-5">
                {detailView ? (
                  <div className="space-y-5 pt-1">{renderDetailView()}</div>
                ) : (
                  <div className="space-y-5 pt-1">
                    <WorkspaceQuickActions onAction={onQuickAction} />

                    <WorkspaceConnectors onAction={handleConnectorPress} />

                    <div className="grid gap-4 md:grid-cols-2 md:items-start">
                      <WorkspaceTools onSelect={onToolSelect} />
                      <WorkspaceRecent onSelect={onRecentSelect} />
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
