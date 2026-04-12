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
        className="fixed inset-0 z-40 bg-black/16"
      />

      <motion.aside
        initial={{ y: '-104%', opacity: 0.7 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '-104%', opacity: 0.7 }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        className="fixed inset-x-0 top-0 z-50 mx-auto flex max-h-[82vh] w-full max-w-xl flex-col rounded-b-[26px] border-b border-[#dde1e8] bg-[#f8f9fb]/96 px-3 pb-3 pt-2.5 shadow-sm backdrop-blur-xl"
      >
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#ccd3dd]" />
        <div className="mb-3 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-[#242a31]">
            <MessageSquare className="h-4 w-4" /> Conversations
          </div>
          <button type="button" onClick={onClose} className="composer-icon-btn" aria-label="Close panel">
            <X className="h-4 w-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onNewChat}
          className="mb-3 inline-flex items-center justify-center gap-2 rounded-xl border border-[#dce1e8] bg-white px-3 py-2 text-sm font-medium text-[#242a31] shadow-sm"
        >
          <Plus className="h-4 w-4" /> New chat
        </button>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {conversations.map((conversation) => {
            const isActive = conversation.id === activeConversationId;
            return (
              <div key={conversation.id} className={`rounded-xl border px-2.5 py-2 transition-colors ${isActive ? 'border-[#ced6e2] bg-[#eef2f7]' : 'border-[#dde1e8] bg-white'}`}>
                <button type="button" onClick={() => onOpenConversation(conversation.id)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`line-clamp-1 text-sm font-medium ${isActive ? 'text-[#242a31]' : 'text-[#313741]'}`}>{conversation.title}</p>
                    <span className="text-[11px] text-[#8a93a1]">{formatConversationTime(conversation.updatedAt)}</span>
                  </div>
                  <p className="line-clamp-1 text-xs text-[#8a93a1]">{conversation.lastMessagePreview || 'No messages yet'}</p>
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
            <div className="rounded-xl border border-[#dde1e8] bg-white px-3 py-4 text-sm text-[#8a93a1]">No conversations yet. Start your first chat.</div>
          ) : null}
        </div>
      </motion.aside>
    </>
  );
}
