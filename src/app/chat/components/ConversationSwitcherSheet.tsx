'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Conversation } from '@/app/store/app-store';

type ConversationSwitcherSheetProps = {
  conversations: Conversation[];
  activeConversationId: string;
  onOpenConversation: (id: string) => void;
  onRenameConversation: (id: string, currentTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  formatConversationTime: (iso: string) => string;
  onClose: () => void;
  onNewChat: () => void;
};

export function ConversationSwitcherSheet({
  conversations,
  activeConversationId,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
  formatConversationTime,
  onClose,
  onNewChat,
}: ConversationSwitcherSheetProps) {
  return (
    <>
      <motion.button
        type="button"
        aria-label="Close conversation panel"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/25"
      />

      <motion.aside
        initial={{ x: '-102%' }}
        animate={{ x: 0 }}
        exit={{ x: '-102%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-black/[0.07] bg-[#f7f7f7]/95 p-3 shadow-[0_18px_42px_rgba(0,0,0,0.18)] backdrop-blur-xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#2f2f2f]">
            <MessageSquare className="h-4 w-4" /> Conversations
          </div>
          <button type="button" onClick={onClose} className="composer-icon-btn" aria-label="Close panel">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mb-3 inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.08] bg-white/90 px-3 py-2 text-sm font-medium text-[#242424] shadow-[0_6px_14px_rgba(0,0,0,0.04)]"
        >
          <Plus className="h-4 w-4" /> New chat
        </button>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div key={conversation.id} className={`rounded-xl border px-2.5 py-2 transition-colors ${isActive ? 'border-[#6377a8]/30 bg-[#ebeff8]' : 'border-black/[0.05] bg-white/90'}`}>
                <button type="button" onClick={() => onOpenConversation(conversation.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`line-clamp-1 text-sm font-medium ${isActive ? 'text-[#24355e]' : 'text-[#252525]'}`}>{conversation.title}</p>
                    <span className="text-[11px] text-[#6a6a6a]">{formatConversationTime(conversation.updatedAt)}</span>
                  </div>
                  <p className="line-clamp-1 text-xs text-[#636363]">{conversation.lastMessagePreview || 'No messages yet'}</p>
                </button>
                <div className="mt-2 flex items-center justify-end gap-1">
                  <button type="button" onClick={() => onRenameConversation(conversation.id, conversation.title)} className="composer-icon-btn" aria-label="Rename conversation">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => onDeleteConversation(conversation.id)} className="composer-icon-btn" aria-label="Delete conversation">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {conversations.length === 0 ? (
            <div className="rounded-xl border border-black/[0.06] bg-white/80 px-3 py-4 text-sm text-[#5a5a5a]">No conversations yet. Start your first chat.</div>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}
