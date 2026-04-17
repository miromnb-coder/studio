'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  Clock3,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
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
      eyebrow: string;
      highlights: string[];
      actions: Array<{
        id: string;
        label: string;
        detail: string;
        mode: ConnectorMode;
        cta?: string;
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

const CONNECTOR_DETAILS: Record<string, NonNullable<ConnectorDetailView>> = {
  gmail: {
    type: 'connector',
    connector: 'gmail',
    eyebrow: 'Email Operator',
    title: 'Gmail',
    subtitle: 'Turn your inbox into clear actions, money insights, and fast follow-through.',
    highlights: [
      'Summarize inbox',
      'Show urgent emails',
      'Find subscriptions and savings',
    ],
    actions: [
      {
        id: 'gmail-open',
        label: 'Open Email Operator',
        detail: 'Summaries, urgent items, subscription scans, and draft replies.',
        mode: 'connected',
        cta: 'Open',
      },
      {
        id: 'gmail-manage',
        label: 'Manage connection',
        detail: 'Review status, reconnect, or adjust how Kivo uses Gmail.',
        mode: 'manage',
        cta: 'Manage',
      },
    ],
  },
  'google-calendar': {
    type: 'connector',
    connector: 'google-calendar',
    eyebrow: 'Calendar Operator',
    title: 'Google Calendar',
    subtitle: 'Use your real schedule to find focus time, reduce overload, and plan better.',
    highlights: [
      'Today Planner',
      'Find Focus Time',
      'Check Busy Week',
    ],
    actions: [
      {
        id: 'calendar-open',
        label: 'Open Calendar Operator',
        detail: 'Today planning, focus windows, overload detection, and weekly reset.',
        mode: 'connected',
        cta: 'Open',
      },
      {
        id: 'calendar-manage',
        label: 'Manage calendar',
        detail: 'Review sync status, calendars, and connection settings.',
        mode: 'manage',
        cta: 'Manage',
      },
    ],
  },
  'google-drive': {
    type: 'connector',
    connector: 'google-drive',
    eyebrow: 'Knowledge Operator',
    title: 'Google Drive',
    subtitle: 'Search files, surface useful context, and continue work without digging.',
    highlights: ['Search files', 'Open docs faster', 'Reuse project context'],
    actions: [
      {
        id: 'drive-open',
        label: 'Open Drive tools',
        detail: 'Search files and launch document workflows.',
        mode: 'connected',
        cta: 'Open',
      },
      {
        id: 'drive-manage',
        label: 'Manage Drive',
        detail: 'Review indexing and connection settings.',
        mode: 'manage',
        cta: 'Manage',
      },
    ],
  },
  github: {
    type: 'connector',
    connector: 'github',
    eyebrow: 'Dev Operator',
    title: 'GitHub',
    subtitle: 'Keep repos, summaries, and coding workflows closer to the operator layer.',
    highlights: ['Repo summaries', 'Coding context', 'Development actions'],
    actions: [
      {
        id: 'github-toggle',
        label: 'Toggle summaries',
        detail: 'Enable or disable repository summary automation.',
        mode: 'toggle',
        cta: 'Update',
      },
      {
        id: 'github-manage',
        label: 'Open GitHub tools',
        detail: 'View repository and coding-related tools.',
        mode: 'manage',
        cta: 'Open',
      },
    ],
  },
  browser: {
    type: 'connector',
    connector: 'browser',
    eyebrow: 'Research Operator',
    title: 'Browser',
    subtitle: 'Capture research, compare options, and keep live browsing in your workflow.',
    highlights: ['Live research', 'Capture findings', 'Faster comparisons'],
    actions: [
      {
        id: 'browser-connect',
        label: 'Connect browser',
        detail: 'Enable live research capture and browsing actions.',
        mode: 'connect',
        cta: 'Connect',
      },
    ],
  },
  outlook: {
    type: 'connector',
    connector: 'outlook',
    eyebrow: 'Enterprise Mail',
    title: 'Outlook',
    subtitle: 'Bring enterprise email into the same operator flow when needed.',
    highlights: ['Mailbox tools', 'Priority summaries', 'Enterprise workflows'],
    actions: [
      {
        id: 'outlook-open',
        label: 'Open Outlook tools',
        detail: 'Manage mailbox tools and summary actions.',
        mode: 'manage',
        cta: 'Open',
      },
    ],
  },
};

function OperatorPreviewCards() {
  const cards = [
    {
      id: 'email',
      icon: MailCheck,
      title: 'Email Operator',
      detail: 'Inbox summaries, urgent emails, and savings scans.',
    },
    {
      id: 'calendar',
      icon: Clock3,
      title: 'Calendar Operator',
      detail: 'Today planning, focus time, and overload detection.',
    },
    {
      id: 'money',
      icon: Wallet,
      title: 'Money Operator',
      detail: 'Find leaks, recurring costs, and practical savings moves.',
    },
  ];

  return (
    <section className="space-y-3">
      <div className="rounded-[28px] border border-[#dde3ec] bg-[linear-gradient(180deg,#fbfcfe_0%,#f7f9fc_100%)] p-4 shadow-[0_10px_24px_rgba(64,72,88,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b93a1]">
              Operator Hub
            </p>
            <h3 className="mt-1 text-[24px] font-semibold tracking-[-0.04em] text-[#2d3442]">
              Your connected workspace
            </h3>
            <p className="mt-2 max-w-[420px] text-[13px] leading-6 text-[#707887]">
              Launch the parts of Kivo that already know your tools, schedule, and recent context.
            </p>
          </div>

          <div className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#dbe3ee] bg-white/88 px-3 py-1.5 text-[11px] font-medium text-[#5f6876]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Real status
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="rounded-[20px] border border-[#e3e9f1] bg-white/84 p-3 shadow-[0_4px_14px_rgba(64,72,88,0.04)]"
              >
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#e2e8f0] bg-[#f9fbfe] text-[#4c5562]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-[13px] font-semibold text-[#2f3744]">{card.title}</p>
                <p className="mt-1 text-[12px] leading-snug text-[#8b93a1]">{card.detail}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
    return 'Operator Hub';
  }, [detailView]);

  const subtitle = useMemo(() => {
    if (detailView) return detailView.subtitle;
    return 'Launch tools, connected services, and recent operator workflows';
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
        <div className="rounded-[28px] border border-[#dde3ec] bg-[linear-gradient(180deg,#fbfcfe_0%,#f7f9fc_100%)] p-4 shadow-[0_10px_24px_rgba(64,72,88,0.06)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8b93a1]">
            {detailView.eyebrow}
          </p>
          <p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#2f3744]">
            {detailView.title}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[#7c8594]">
            {detailView.subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {detailView.highlights.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-[#dfe6ef] bg-white/88 px-3 py-1.5 text-[11px] font-medium text-[#5f6876]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
          {detailView.actions.map((action, index) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onConnectorAction(detailView.connector, action.mode)}
              className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-[#f5f7fb] active:scale-[0.995] ${
                index !== detailView.actions.length - 1 ? 'border-b border-[#e8ecf2]' : ''
              }`}
            >
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#2f3744]">
                  {action.label}
                </span>
                <span className="mt-1 block text-[12px] leading-snug text-[#8b93a1]">
                  {action.detail}
                </span>
              </span>

              <span className="ml-3 shrink-0 rounded-full border border-[#dde4ed] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#5f6876]">
                {action.cta ?? 'Open'}
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
                    aria-label={detailView ? 'Back to operator hub' : 'Close operator hub'}
                  >
                    {detailView ? <ChevronLeft className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </button>

                  <div className="min-w-0">
                    <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2d3442]">
                      {title}
                    </h2>
                    <p className="mt-0.5 text-[13px] text-[#8b93a1]">{subtitle}</p>
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:px-5">
                {detailView ? (
                  <div className="space-y-5 pt-1">{renderDetailView()}</div>
                ) : (
                  <div className="space-y-5 pt-1">
                    <OperatorPreviewCards />

                    <WorkspaceQuickActions onAction={onQuickAction} />

                    <WorkspaceConnectors onAction={handleConnectorPress} />

                    <div className="grid gap-4 md:grid-cols-2 md:items-start">
                      <WorkspaceTools onSelect={onToolSelect} />
                      <WorkspaceRecent onSelect={onRecentSelect} />
                    </div>

                    <div className="rounded-[24px] border border-[#dde3ec] bg-[#fbfcfe] p-4 shadow-[0_8px_18px_rgba(64,72,88,0.06)]">
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#e1e7ef] bg-white text-[#596170]">
                          <Sparkles className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold tracking-[-0.01em] text-[#2f3744]">
                            Built for real operator work
                          </p>
                          <p className="mt-1 text-[12px] leading-6 text-[#8b93a1]">
                            Connect services once, then let Kivo turn inboxes, schedules, and workflows
                            into clear next moves.
                          </p>
                        </div>
                      </div>
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
