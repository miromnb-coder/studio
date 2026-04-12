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
            className="absolute inset-0 z-20 bg-[#788091]/25"
            aria-label="Close Workspace Hub"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            className="absolute inset-x-0 bottom-0 z-30 max-h-[85vh] overflow-hidden rounded-t-[30px] border border-[#d9dde5] bg-[#f5f7fb] shadow-[0_-10px_30px_rgba(66,72,88,0.14)]"
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
              <div className="mx-auto mb-2 h-1.5 w-14 rounded-full bg-[#dce1ea]" />
              <div className="mb-4 grid grid-cols-[40px_1fr_40px] items-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dde1e8] bg-[#f8f9fc] text-[#5d6572]"
                  aria-label="Close workspace hub"
                >
                  <X className="h-5 w-5" />
                </button>
                <h2 className="text-center text-[34px] leading-none font-semibold tracking-[-0.02em] text-[#2d3441]">Workspace Hub</h2>
                <span />
              </div>

              <div className="max-h-[calc(85vh-82px)] space-y-5 overflow-y-auto pb-[max(8px,env(safe-area-inset-bottom))]">
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
