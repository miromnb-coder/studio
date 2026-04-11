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
    <div ref={composerRef} className="fixed bottom-[calc(78px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2">
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 px-2 text-[11px] tracking-wide text-zinc-500"
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
            exit={{ opacity: 0, y: 6 }}
            className="mb-2 rounded-[20px] border border-white/10 bg-[#111111]/96 p-1.5 shadow-[0_18px_38px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <button type="button" onClick={onAttachFile} className="composer-menu-btn"><Paperclip className="h-4 w-4" /> Attach file</button>
            <button type="button" onClick={onAddImagePrompt} className="composer-menu-btn"><ImagePlus className="h-4 w-4" /> Use image context</button>
            <button type="button" onClick={onStartTaskTemplate} className="composer-menu-btn"><NotebookPen className="h-4 w-4" /> Start structured task</button>
            <button type="button" onClick={onAddNoteTemplate} className="composer-menu-btn"><ClipboardPaste className="h-4 w-4" /> Add quick note</button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-[30px] border border-white/10 bg-[#0f0f10]/94 p-2 shadow-[0_20px_54px_rgba(0,0,0,0.58)] backdrop-blur-2xl">
        <div className="rounded-[24px] border border-white/10 bg-black/30 px-3 py-2">
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
            placeholder={userPresent ? 'Ask anything, assign a task, or draft an action…' : 'Sign in to start chatting'}
            className="system-input max-h-[128px] min-h-[42px] w-full resize-none border-none bg-transparent px-1 py-1.5 text-[15px] leading-6 tracking-[-0.01em]"
          />

          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button type="button" className="composer-icon-btn" aria-label="Open add menu" onClick={() => onTogglePanel('add')}><Plus className="h-4 w-4" /></button>
              <button type="button" className={`composer-icon-btn ${!voiceSupported ? 'opacity-35' : ''}`} aria-label="Start speech to text" onClick={onSpeechToText} disabled={!voiceSupported}><Mic className="h-4 w-4" /></button>
            </div>

            <button
              type="button"
              onClick={onSend}
              className="composer-send-btn h-10 w-10 disabled:opacity-45"
              disabled={!draft.trim() || isAgentResponding || isLimitReached}
              aria-label="Send message"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
