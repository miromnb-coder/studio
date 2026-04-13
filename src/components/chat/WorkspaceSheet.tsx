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
  onToolSelect: (id: 'finance-scanner' | 'memory-search' | 'research-mode' | 'compare-tool' | 'automation-builder') => void;
  onRecentSelect: (id: 'gmail-sync' | 'subscription-scan' | 'weekly-planner') => void;
};

export function WorkspaceSheet({ open, onClose, onQuickAction, onConnectorAction, onToolSelect, onRecentSelect }: WorkspaceSheetProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            className="fixed inset-0 z-40 bg-[#7a8191]/30 backdrop-blur-[1px]"
            aria-label="Close Workspace Hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-[32px] border border-[#d9dee7] bg-[#f4f7fb] shadow-[0_-18px_44px_rgba(51,59,75,0.24)]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
              if (info.offset.y > 120 || info.velocity.y > 700) onClose();
            }}
          >
            <div className="px-4 pb-5 pt-3 sm:px-5">
              <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-[#d8dee8]" />
              <div className="mb-4 grid grid-cols-[40px_1fr_40px] items-center">
                <span />
                <h2 className="text-center text-[28px] font-semibold tracking-[-0.02em] text-[#2f3644]">Workspace Hub</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dde2ea] bg-[#f8fafe] text-[#5d6572]"
                  aria-label="Close workspace hub"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-[calc(88vh-88px)] space-y-5 overflow-y-auto pb-[max(10px,env(safe-area-inset-bottom))]">
                <WorkspaceQuickActions onAction={onQuickAction} />
                <WorkspaceConnectors onAction={onConnectorAction} />
                <div className="grid gap-4 md:grid-cols-2">
                  <WorkspaceTools onSelect={onToolSelect} />
                  <WorkspaceRecent onSelect={onRecentSelect} />
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
