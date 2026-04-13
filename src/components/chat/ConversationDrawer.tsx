'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { ConversationFilters, type ConversationFilter } from './ConversationFilters';
import { ConversationHeader } from './ConversationHeader';
import { ConversationSearch } from './ConversationSearch';
import { ContinueCard } from './ContinueCard';
import { ConversationList, type ConversationRow } from './ConversationList';

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
}: {
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
}) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const openAndClose = (id: string) => {
    onOpenConversation(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close conversations drawer"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#20242d]/26 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ y: '-104%', opacity: 0.75 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-104%', opacity: 0.75 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32, mass: 0.7 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 120 }}
            dragElastic={{ top: 0, bottom: 0.35 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 600) onClose();
            }}
            className="fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[88vh] w-full max-w-xl flex-col rounded-b-[30px] border-b border-[#d8dde6] bg-[#f8f9fc]/98 px-3 pb-[calc(16px+env(safe-area-inset-bottom))] pt-2.5 shadow-[0_20px_40px_rgba(56,62,75,0.16)] backdrop-blur-xl"
          >
            <ConversationHeader onClose={onClose} />
            <ConversationSearch value={search} onChange={onSearchChange} />
            <ConversationFilters value={filter} onChange={onFilterChange} />

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <ContinueCard item={continueItem} onResume={openAndClose} />
              <ConversationList title="Recent Conversations" rows={recentRows} empty="No recent conversations found." onOpen={openAndClose} onToggleSaved={onToggleSaved} />
              <ConversationList title="Agent Conversations" rows={agentRows} empty="No agent runs yet." onOpen={openAndClose} onToggleSaved={onToggleSaved} />
              <ConversationList title="Saved Threads" rows={savedRows} empty="Saved threads appear here." onOpen={openAndClose} onToggleSaved={onToggleSaved} />
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
