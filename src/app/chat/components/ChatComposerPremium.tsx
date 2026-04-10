'use client';

import { ArrowUp, AudioLines, ClipboardPaste, ImagePlus, Menu, Mic, NotebookPen, Paperclip, Plus, Sparkles, X, Crown, MessageSquare } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';

export type ComposerPanel = 'add' | 'utility' | null;

type ChatComposerPremiumProps = {
  composerRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  notice: string | null;
  openPanel: ComposerPanel;
  isVoiceMode: boolean;
  voiceSupported: boolean;
  isAgentResponding: boolean;
  isLimitReached: boolean;
  userPresent: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTextareaFocus: () => void;
  onTogglePanel: (panel: Exclude<ComposerPanel, null>) => void;
  onToggleVoiceMode: () => void;
  onSpeechToText: () => void;
  onAttachFile: () => void;
  onAddImagePrompt: () => void;
  onStartTaskTemplate: () => void;
  onAddNoteTemplate: () => void;
  onNewChat: () => void;
  onViewConversations: () => void;
  onClearDraft: () => void;
  onOpenPlanInfo: () => void;
  onUpgrade: () => void;
};

export function ChatComposerPremium(props: ChatComposerPremiumProps) {
  const {
    composerRef,
    fileInputRef,
    textareaRef,
    draft,
    notice,
    openPanel,
    isVoiceMode,
    voiceSupported,
    isAgentResponding,
    isLimitReached,
    userPresent,
    onDraftChange,
    onSend,
    onTextareaFocus,
    onTogglePanel,
    onToggleVoiceMode,
    onSpeechToText,
    onAttachFile,
    onAddImagePrompt,
    onStartTaskTemplate,
    onAddNoteTemplate,
    onNewChat,
    onViewConversations,
    onClearDraft,
    onOpenPlanInfo,
    onUpgrade,
  } = props;

  return (
    <div ref={composerRef} className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2 pt-2">
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 px-2 text-xs text-[#6f6f6f]"
          >
            {notice}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openPanel === 'add' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6]/95 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] backdrop-blur-lg">
            <button type="button" onClick={onAttachFile} className="composer-menu-btn"><Paperclip className="h-4 w-4" /> Attach file</button>
            <button type="button" onClick={onAddImagePrompt} className="composer-menu-btn"><ImagePlus className="h-4 w-4" /> Insert image prompt</button>
            <button type="button" onClick={onStartTaskTemplate} className="composer-menu-btn"><NotebookPen className="h-4 w-4" /> Start task template</button>
            <button type="button" onClick={onAddNoteTemplate} className="composer-menu-btn"><ClipboardPaste className="h-4 w-4" /> Add note</button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openPanel === 'utility' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6]/95 p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)] backdrop-blur-lg">
            <button type="button" onClick={onNewChat} className="composer-menu-btn"><Plus className="h-4 w-4" /> New chat</button>
            <button type="button" onClick={onViewConversations} className="composer-menu-btn"><MessageSquare className="h-4 w-4" /> View conversations</button>
            <button type="button" onClick={onAttachFile} className="composer-menu-btn"><Paperclip className="h-4 w-4" /> Upload file</button>
            <button type="button" onClick={onClearDraft} className="composer-menu-btn"><X className="h-4 w-4" /> Clear current draft</button>
            <button type="button" onClick={onOpenPlanInfo} className="composer-menu-btn"><Sparkles className="h-4 w-4" /> Plan & usage info</button>
            <button type="button" onClick={onUpgrade} className="composer-menu-btn"><Crown className="h-4 w-4" /> Upgrade</button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-[30px] border border-black/[0.06] bg-[#f6f6f6]/95 p-2 shadow-[0_12px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl">
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              if (!fileName) return;
              onDraftChange(draft ? `${draft}\nAttached file context: ${fileName}` : `Attached file context: ${fileName}`);
            }}
          />

          <button type="button" className="composer-icon-btn" aria-label="Open add menu" onClick={() => onTogglePanel('add')}><Plus className="h-4 w-4" /></button>
          <button type="button" className="composer-icon-btn" aria-label="Open utility menu" onClick={() => onTogglePanel('utility')}><Menu className="h-4 w-4" /></button>
          <textarea
            ref={textareaRef}
            value={draft}
            onFocus={onTextareaFocus}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder={userPresent ? 'Assign a task or ask anything' : 'Sign in to start chatting'}
            className="system-input max-h-[164px] min-h-[44px] flex-1 resize-none border-none bg-[#f8f8f8] px-3 py-2.5 text-[15px]"
          />
          <button type="button" className={`composer-icon-btn ${isVoiceMode ? 'composer-icon-btn-active' : ''} ${!voiceSupported ? 'opacity-40' : ''}`} aria-label="Toggle voice mode" onClick={onToggleVoiceMode} disabled={!voiceSupported}><AudioLines className="h-4 w-4" /></button>
          <button type="button" className={`composer-icon-btn ${!voiceSupported ? 'opacity-40' : ''}`} aria-label="Start speech to text" onClick={onSpeechToText} disabled={!voiceSupported}><Mic className="h-4 w-4" /></button>
          <button type="button" onClick={onSend} className="composer-send-btn disabled:opacity-45" disabled={!draft.trim() || isAgentResponding || isLimitReached} aria-label="Send message"><ArrowUp className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
