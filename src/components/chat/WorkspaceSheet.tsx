'use client';

import { X } from 'lucide-react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { WorkspaceQuickActions } from './WorkspaceQuickActions';
import { WorkspaceConnectors } from './WorkspaceConnectors';
import { WorkspaceTools } from './WorkspaceTools';
import { WorkspaceRecent } from './WorkspaceRecent';
import type { ConnectorMode } from './ConnectorRow';

type WorkspaceSheetProps = {
  open: boolean;
  onClose: () => void;
  onQuickAction: (id: 'analyze' | 'planner' | 'money-saver' | 'ask-agent') => void;
  onConnectorAction: (connector: string, mode: ConnectorMode) => void;
  onToolSelect: (
    id:
      | 'finance-scanner'
      | 'memory-search'
      | 'research-mode'
      | 'compare-tool'
      | 'automation-builder'
  ) => void;
  onRecentSelect: (id: 'gmail-sync' | 'subscription-scan' | 'weekly-planner') => void;
};

export function WorkspaceSheet({
  open,
  onClose,
  onQuickAction,
  onConnectorAction,
  onToolSelect,
  onRecentSelect,
}: WorkspaceSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close Workspace Hub"
            className="fixed inset-0 z-40 bg-[#6f7787]/18 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            <div className="px-4 pt-3 sm:px-5">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8dde6]" />

              <div className="mb-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#d9dee7] bg-[#f9fbfe] text-[#5d6572] shadow-[0_2px_8px_rgba(36,42,55,0.04)]"
                  aria-label="Close workspace hub"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="min-w-0">
                  <h2 className="text-[22px] font-semibold tracking-[-0.03em] text-[#2d3442]">
                    Workspace Hub
                  </h2>
                  <p className="mt-0.5 text-[13px] text-[#8b93a1]">
                    Tools, connectors, and recent operator activity
                  </p>
                </div>
              </div>

              <div className="max-h-[calc(90dvh-96px)] overflow-y-auto pb-[max(18px,env(safe-area-inset-bottom))]">
                <div className="space-y-5">
                  <WorkspaceQuickActions onAction={onQuickAction} />

                  <WorkspaceConnectors onAction={onConnectorAction} />

                  <div className="grid gap-4 md:grid-cols-2 md:items-start">
                    <WorkspaceTools onSelect={onToolSelect} />
                    <WorkspaceRecent onSelect={onRecentSelect} />
                  </div>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
