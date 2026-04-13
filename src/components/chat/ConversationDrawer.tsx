'use client';

import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect } from 'react';
import { ConversationFilters, type ConversationFilter } from './ConversationFilters';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSearch } from './ConversationSearch';
import { ContinueCard } from './ContinueCard';
import {
  ConversationList,
  type ConversationRow,
} from './ConversationList';

type ConversationDrawerProps = {
  open: boolean;
  onClose: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  filter: ConversationFilter;
  onFilterChange: (next: ConversationFilter) => void;
  continueItem: ConversationRow | null;
  recentRows: ConversationRow[];
  agentRows: ConversationRow[];
  savedRows: ConversationRow[];
  onOpenConversation: (id: string) => void;
  onToggleSaved: (id: string) => void;
};

export function ConversationDrawer({
  open,
  onClose,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  continueItem,
  recentRows,
  agentRows,
  savedRows,
  onOpenConversation,
  onToggleSaved,
}: ConversationDrawerProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouch = document.body.style.touchAction;

    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouch;
    };
  }, [open]);

  const handleOpen = (id: string) => {
    onOpenConversation(id);
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close conversations drawer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[#1f2430]/18 backdrop-blur-[3px]"
          />

          <motion.aside
            initial={{ y: '-104%', opacity: 0.78 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-104%', opacity: 0.78 }}
            transition={{
              type: 'spring',
              stiffness: 340,
              damping: 34,
              mass: 0.72,
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 120 }}
            dragElastic={{ top: 0, bottom: 0.22 }}
            onDragEnd={(_, info: PanInfo) => {
              if (info.offset.y > 90 || info.velocity.y > 650) {
                onClose();
              }
            }}
            className="fixed inset-x-0 top-0 z-50 mx-auto flex h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-b-[32px] border-b border-[#dde2ea] bg-[#f9fafd]/98 shadow-[0_22px_48px_rgba(44,50,64,0.14)] backdrop-blur-xl"
          >
            {/* Handle */}
            <div className="flex justify-center pt-2.5">
              <div className="h-1.5 w-14 rounded-full bg-[#d8dde6]" />
            </div>

            {/* Fixed Header Area */}
            <div className="shrink-0 px-3 pb-3 pt-2 sm:px-4">
              <ConversationHeader onClose={onClose} />
              <ConversationSearch
                value={search}
                onChange={onSearchChange}
              />
              <ConversationFilters
                value={filter}
                onChange={onFilterChange}
              />
            </div>

            {/* Scroll Area */}
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(20px+env(safe-area-inset-bottom))] sm:px-4">
              <div className="space-y-5">
                <ContinueCard
                  item={continueItem}
                  onResume={handleOpen}
                />

                <ConversationList
                  title="Recent Conversations"
                  rows={recentRows}
                  empty="No recent conversations found."
                  onOpen={handleOpen}
                  onToggleSaved={onToggleSaved}
                />

                <ConversationList
                  title="Agent Conversations"
                  rows={agentRows}
                  empty="No agent runs yet."
                  onOpen={handleOpen}
                  onToggleSaved={onToggleSaved}
                />

                <ConversationList
                  title="Saved Threads"
                  rows={savedRows}
                  empty="Saved threads appear here."
                  onOpen={handleOpen}
                  onToggleSaved={onToggleSaved}
                />
              </div>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
