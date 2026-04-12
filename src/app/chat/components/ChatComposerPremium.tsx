'use client';

import {
  ArrowUp,
  ClipboardPaste,
  ImagePlus,
  Link2,
  MessageCircle,
  Mic,
  NotebookPen,
  Paperclip,
  Plus,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RefObject } from 'react';
import { ConnectorsSheet } from './ConnectorsSheet';
import type { ConnectorItem } from './ConnectorRow';

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
  connectorsOpen: boolean;
  connectors: ConnectorItem[];
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTextareaFocus: () => void;
  onTogglePanel: (panel: Exclude<ComposerPanel, null>) => void;
  onToggleConnectors: () => void;
  onCloseConnectors: () => void;
  onSpeechToText: () => void;
  onAttachFile: () => void;
  onAddImagePrompt: () => void;
  onStartTaskTemplate: () => void;
  onAddNoteTemplate: () => void;
  onOpenAddConnector: () => void;
  onOpenManageConnector: () => void;
  onToggleConnector: (id: string, enabled: boolean) => void;
  onConnectConnector: (id: string) => void;
  onRetryConnector: (id: string) => void;
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
    connectorsOpen,
    connectors,
    onDraftChange,
    onSend,
    onTextareaFocus,
    onTogglePanel,
    onToggleConnectors,
    onCloseConnectors,
    onSpeechToText,
    onAttachFile,
    onAddImagePrompt,
    onStartTaskTemplate,
    onAddNoteTemplate,
    onOpenAddConnector,
    onOpenManageConnector,
    onToggleConnector,
    onConnectConnector,
    onRetryConnector,
  } = props;

  return (
    <div
      ref={composerRef}
      className="fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-3.5"
    >
      <AnimatePresence>
        {notice ? (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#d9dee6] bg-[#f8f9fb] px-3 py-1.5 text-[11px] tracking-wide text-[#5f6875]"
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
            className="mb-2 rounded-[18px] border border-[#dce1e8] bg-white p-1.5 shadow-sm"
          >
            <button type="button" onClick={onAttachFile} className="composer-menu-btn"><Paperclip className="h-4 w-4" /><span>Attach file</span></button>
            <button type="button" onClick={onAddImagePrompt} className="composer-menu-btn"><ImagePlus className="h-4 w-4" /><span>Use image context</span></button>
            <button type="button" onClick={onStartTaskTemplate} className="composer-menu-btn"><NotebookPen className="h-4 w-4" /><span>Start structured task</span></button>
            <button type="button" onClick={onAddNoteTemplate} className="composer-menu-btn"><ClipboardPaste className="h-4 w-4" /><span>Add quick note</span></button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="rounded-[38px] border border-[#d8d9dd] bg-[#f3f3f4] px-4 pb-3 pt-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
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
          rows={1}
          onFocus={onTextareaFocus}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          placeholder={userPresent ? 'Assign a task or ask anything' : 'Sign in to start chatting'}
          className="mb-5 max-h-[130px] min-h-[56px] w-full resize-none border-none bg-transparent text-[17px] leading-7 tracking-[-0.01em] text-[#2f3238] placeholder:text-[#b2b4ba] focus:outline-none"
        />

        <div className="flex items-end justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onTogglePanel('add')}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d6d7db] bg-[#efeff1] text-[#36383d] transition hover:bg-[#ebebee]"
              aria-label="Open add menu"
            >
              <Plus className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={onToggleConnectors}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d6d7db] bg-[#efeff1] text-[#36383d] transition hover:bg-[#ebebee]"
              aria-label="Open connectors"
            >
              <Link2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onSpeechToText}
              disabled={!voiceSupported}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d6d7db] bg-[#efeff1] text-[#36383d] transition hover:bg-[#ebebee] disabled:opacity-55"
              aria-label="Voice input"
            >
              <MessageCircle className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onSpeechToText}
              disabled={!voiceSupported}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#d6d7db] bg-[#efeff1] text-[#36383d] transition hover:bg-[#ebebee] disabled:opacity-55"
              aria-label="Start speech to text"
            >
              <Mic className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={onSend}
              disabled={!draft.trim() || isAgentResponding || isLimitReached}
              className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition ${
                draft.trim() && !isAgentResponding && !isLimitReached
                  ? 'border-[#cfd1d6] bg-[#d7d8dd] text-[#4f535a] hover:bg-[#cfd1d7]'
                  : 'border-[#d6d7db] bg-[#e2e3e6] text-[#a5a7ad] disabled:opacity-60 disabled:hover:bg-[#e2e3e6]'
              }`}
              aria-label="Send message"
            >
              {isSending ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-slate-700" /> : <ArrowUp className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <ConnectorsSheet
        open={connectorsOpen}
        connectors={connectors}
        onClose={onCloseConnectors}
        onOpenAddConnector={onOpenAddConnector}
        onOpenManageConnector={onOpenManageConnector}
        onToggleConnected={onToggleConnector}
        onConnect={onConnectConnector}
        onRetry={onRetryConnector}
      />
    </div>
  );
}
