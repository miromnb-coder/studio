'use client';

import {
  ArrowUp,
  ClipboardPaste,
  ImagePlus,
  Mic,
  NotebookPen,
  Paperclip,
  Plus,
  Sparkles,
  Wand2,
} from 'lucide-react';
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
  isSending: boolean;
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
    isSending,
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
    <div
      ref={composerRef}
      className="fixed bottom-[calc(74px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3.5 pb-2.5"
    >
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-black/35 px-3 py-1.5 text-[11px] tracking-wide text-zinc-300 backdrop-blur"
          >
            <Sparkles className="h-3 w-3" />
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
            className="mb-2 rounded-[18px] border border-white/[0.06] bg-[#0f1014]/90 p-1.5 shadow-[0_22px_42px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
          >
            <button
              type="button"
              onClick={onAttachFile}
              className="composer-menu-btn"
            >
              <Paperclip className="h-4 w-4" />
              <span>Attach file</span>
            </button>

            <button
              type="button"
              onClick={onAddImagePrompt}
              className="composer-menu-btn"
            >
              <ImagePlus className="h-4 w-4" />
              <span>Use image context</span>
            </button>

            <button
              type="button"
              onClick={onStartTaskTemplate}
              className="composer-menu-btn"
            >
              <NotebookPen className="h-4 w-4" />
              <span>Start structured task</span>
            </button>

            <button
              type="button"
              onClick={onAddNoteTemplate}
              className="composer-menu-btn"
            >
              <ClipboardPaste className="h-4 w-4" />
              <span>Add quick note</span>
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="chat-composer-shell rounded-[28px] px-3 py-2.5 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(event) => {
            const fileName = event.target.files?.[0]?.name;

            if (!fileName) return;

            onDraftChange(
              draft
                ? `${draft}\nAttached file context: ${fileName}`
                : `Attached file context: ${fileName}`
            );
          }}
        />

        <div className="mb-1.5 flex items-center justify-between px-1">
          <p className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <Wand2 className="h-3 w-3" />
            Premium composer
          </p>
          <p className="text-[10px] text-zinc-500">{isAgentResponding ? 'Agent is responding…' : 'Ready for your next instruction'}</p>
        </div>

        <div className="flex items-end gap-2 px-1">
          <textarea
            ref={textareaRef}
            value={draft}
            rows={1}
            onFocus={onTextareaFocus}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder={
              userPresent
                ? 'Ask anything, assign a task, or draft an action…'
                : 'Sign in to start chatting'
            }
            className="chat-composer-input max-h-[140px] min-h-[46px] w-full resize-none border-none bg-transparent py-1 text-[15px] leading-6 tracking-[-0.01em]"
          />

          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim() || isAgentResponding || isLimitReached}
            className="composer-send-btn h-10 w-10 shrink-0 disabled:opacity-45"
            aria-label="Send message"
          >
            {isSending ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700/50 border-t-zinc-900" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onTogglePanel('add')}
              className="composer-icon-btn"
              aria-label="Open add menu"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onSpeechToText}
              disabled={!voiceSupported}
              className={`composer-icon-btn ${!voiceSupported ? 'opacity-35' : ''}`}
              aria-label="Start speech to text"
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
          <p className="pr-1 text-[10px] text-zinc-500">↵ send · shift+↵ new line</p>
        </div>
      </div>
    </div>
  );
}
