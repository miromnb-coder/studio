'use client';

import { ArrowUp, ClipboardPaste, ImagePlus, Mic, NotebookPen, Paperclip, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';

export type ComposerPanel = 'add' | null;

type ChatComposerPremiumProps = {
  composerRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  notice: string | null;
  openPanel: ComposerPanel;
  voiceSupported: boolean;
  isAgentResponding: boolean;
  isLimitReached: boolean;
  userPresent: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTextareaFocus: () => void;
  onTogglePanel: (panel: Exclude<ComposerPanel, null>) => void;
  onSpeechToText: () => void;
  onAttachFile: () => void;
  onAddImagePrompt: () => void;
  onStartTaskTemplate: () => void;
  onAddNoteTemplate: () => void;
};

export function ChatComposerPremium(props: ChatComposerPremiumProps) {
  const {
    composerRef,
    fileInputRef,
    textareaRef,
    draft,
    notice,
    openPanel,
    voiceSupported,
    isAgentResponding,
    isLimitReached,
    userPresent,
    onDraftChange,
    onSend,
    onTextareaFocus,
    onTogglePanel,
    onSpeechToText,
    onAttachFile,
    onAddImagePrompt,
    onStartTaskTemplate,
    onAddNoteTemplate,
  } = props;

  return (
    <div ref={composerRef} className="fixed bottom-[calc(82px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2">
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="mb-2 px-2 text-xs text-[#64748B]"
          >
            {notice}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openPanel === 'add' ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mb-2 rounded-2xl border border-[#E5E7EB] bg-white/95 p-1.5 shadow-[0_12px_26px_rgba(15,23,42,0.08)] backdrop-blur-xl"
          >
            <button type="button" onClick={onAttachFile} className="composer-menu-btn"><Paperclip className="h-4 w-4" /> Attach file</button>
            <button type="button" onClick={onAddImagePrompt} className="composer-menu-btn"><ImagePlus className="h-4 w-4" /> Insert image prompt</button>
            <button type="button" onClick={onStartTaskTemplate} className="composer-menu-btn"><NotebookPen className="h-4 w-4" /> Start task template</button>
            <button type="button" onClick={onAddNoteTemplate} className="composer-menu-btn"><ClipboardPaste className="h-4 w-4" /> Add note</button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-[26px] border border-[#DEE3F3] bg-white/92 p-1.5 shadow-[0_18px_40px_rgba(56,72,140,0.13)] backdrop-blur-xl">
        <div className="flex items-center gap-1.5">
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
            placeholder={userPresent ? 'Message Kivo…' : 'Sign in to start chatting'}
            className="system-input max-h-[132px] min-h-[40px] flex-1 resize-none border-none bg-transparent px-2 py-2 text-[15px] leading-6 tracking-[-0.01em]"
          />

          <button type="button" className={`composer-icon-btn ${!voiceSupported ? 'opacity-40' : ''}`} aria-label="Start speech to text" onClick={onSpeechToText} disabled={!voiceSupported}><Mic className="h-4 w-4" /></button>
          <button type="button" onClick={onSend} className="composer-send-btn disabled:opacity-45" disabled={!draft.trim() || isAgentResponding || isLimitReached} aria-label="Send message"><ArrowUp className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}
