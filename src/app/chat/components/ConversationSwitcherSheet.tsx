'use client';

import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import type { Conversation } from '@/app/store/app-store';

type ConversationSwitcherSheetProps = {
  conversations: Conversation[];
  activeConversationId: string;
  onOpenConversation: (id: string) => void;
  onRenameConversation: (id: string, currentTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  formatConversationTime: (iso: string) => string;
};

export function ConversationSwitcherSheet({
  conversations,
  activeConversationId,
  onOpenConversation,
  onRenameConversation,
  onDeleteConversation,
  formatConversationTime,
}: ConversationSwitcherSheetProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#f7f7f7]/95 p-2 shadow-[0_10px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl"
    >
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
    </motion.div>
  );
}
