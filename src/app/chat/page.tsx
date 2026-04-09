'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Plus, RefreshCw, Mic, AudioLines, Github, Paperclip, ImagePlus, NotebookPen, ClipboardPaste, Wrench } from 'lucide-react';
import { useAppStore } from '../store/app-store';

export default function ChatPage() {
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const messages = useAppStore((s) => s.messages);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const retryLastPrompt = useAppStore((s) => s.retryLastPrompt);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const streamError = useAppStore((s) => s.streamError);

  const [draft, setDraft] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<'add' | 'tools' | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    setDraft(draftPrompt);
  }, [draftPrompt]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isAgentResponding]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 144)}px`;
  }, [draft]);

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (!composerRef.current) return;
      const target = event.target as Node;
      if (!composerRef.current.contains(target)) {
        setOpenPanel(null);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  useEffect(() => {
    if (!composerNotice) return;
    const timeout = window.setTimeout(() => setComposerNotice(null), 2600);
    return () => window.clearTimeout(timeout);
  }, [composerNotice]);

  useEffect(() => {
    if (!hydrated) return;
    const shouldAutoSend =
      typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('autosend') === '1';
    if (shouldAutoSend && draftPrompt.trim()) {
      void sendMessage(draftPrompt);
      setDraftPrompt('');
      setDraft('');
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem('nova-operator-chat-draft');
        window.history.replaceState({}, '', '/chat');
      }
    }
  }, [draftPrompt, hydrated, sendMessage, setDraftPrompt]);

  const send = async () => {
    if (!draft.trim() || isAgentResponding) return;
    await sendMessage(draft);
    setDraftPrompt('');
    setDraft('');
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('nova-operator-chat-draft');
  };

  const empty = useMemo(() => messages.length === 0, [messages]);
  const activeAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const showTyping = isAgentResponding && !!activeAssistantMessage && !activeAssistantMessage.content;

  const applyTemplate = (template: string, notice: string) => {
    const nextValue = draft ? `${draft}\n${template}` : template;
    setDraft(nextValue);
    setDraftPrompt(nextValue);
    setComposerNotice(notice);
    setOpenPanel(null);
  };

  const toggleVoiceMode = () => {
    setIsVoiceMode((prev) => {
      const next = !prev;
      setComposerNotice(next ? 'Voice mode ready.' : 'Voice mode turned off.');
      return next;
    });
  };

  const startSpeechToText = () => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        onerror: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onstart: (() => void) | null;
        onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript?: string }>> }) => void) | null;
        onerror: (() => void) | null;
        start: () => void;
      };
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setComposerNotice('Speech input is not available on this device.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setComposerNotice('Listening…');
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        setComposerNotice('No speech detected. Please try again.');
        return;
      }
      const nextValue = draft ? `${draft} ${transcript}` : transcript;
      setDraft(nextValue);
      setDraftPrompt(nextValue);
      setComposerNotice('Speech added to your message.');
    };
    recognition.onerror = () => setComposerNotice('Microphone permission is required to transcribe speech.');
    recognition.start();
  };

  return (
    <main className="screen app-bg pb-48">
      <header className="mb-4 px-1 pt-1">
        <h1 className="text-xl font-semibold text-primary">Kivo</h1>
        <p className="text-sm text-secondary">Your personal AI assistant</p>
      </header>

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-250px)] space-y-4 overflow-y-auto pb-2">
        {empty ? (
          <div className="px-1 py-6 text-sm text-secondary">Ask anything. Kivo will think and help you move forward.</div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`message-appear max-w-[95%] ${message.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={message.role === 'user' ? 'ml-auto max-w-[90%] rounded-[18px] border border-black/[0.04] bg-[#f3f3f3] px-3.5 py-2.5 text-[15px] leading-6 text-[#1f1f1f]' : 'px-1 py-1 text-[16px] leading-[1.82] text-[#1d1d1d]'}>
                {message.content || (message.isStreaming ? ' ' : '')}
              </div>
            </div>
          ))
        )}

        {showTyping ? (
          <div className="message-appear px-1 pt-1 text-sm">
            <div className="inline-flex items-center gap-2 text-[#6b7ba7]">
              <span className="kivo-thinking-orb" />
              <p className="text-xs tracking-[0.01em]">Kivo is thinking…</p>
            </div>
          </div>
        ) : null}

        {streamError ? (
          <div className="rounded-xl border border-black/5 bg-[#f7f7f7] px-3 py-2.5 text-sm text-[#373737]">
            Something went wrong. Please try again.
            <button type="button" onClick={() => void retryLastPrompt()} className="btn-secondary ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}
      </section>

      <div ref={composerRef} className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 pb-2 pt-2">
        {composerNotice ? (
          <p className="message-appear mb-2 px-2 text-xs text-[#6f6f6f]">{composerNotice}</p>
        ) : null}

        {openPanel === 'add' ? (
          <div className="message-appear mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6] p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="composer-menu-btn">
              <Paperclip className="h-4 w-4" /> Attach file
            </button>
            <button type="button" onClick={() => applyTemplate('Please use this image as context:', 'Image template added.')} className="composer-menu-btn">
              <ImagePlus className="h-4 w-4" /> Insert image
            </button>
            <button type="button" onClick={() => applyTemplate('Start a structured task template for: ', 'Task template added.')} className="composer-menu-btn">
              <NotebookPen className="h-4 w-4" /> Start task template
            </button>
            <button type="button" onClick={() => applyTemplate('Quick note: ', 'Note template added.')} className="composer-menu-btn">
              <ClipboardPaste className="h-4 w-4" /> Add note
            </button>
          </div>
        ) : null}

        {openPanel === 'tools' ? (
          <div className="message-appear mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6] p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => applyTemplate('Use GitHub context from repository: ', 'GitHub context prompt added.')} className="composer-menu-btn">
              <Github className="h-4 w-4" /> Use GitHub context
            </button>
            <button type="button" onClick={() => applyTemplate('Add repository context and summarize key open work in: ', 'Repo context prompt added.')} className="composer-menu-btn">
              <NotebookPen className="h-4 w-4" /> Add repo context
            </button>
          </div>
        ) : null}

        <div className="composer-shell flex items-end gap-2 rounded-[32px] border border-black/[0.045] bg-[#f6f6f6] px-2.5 py-3 shadow-[0_6px_16px_rgba(0,0,0,0.025)]">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(event) => {
              const fileName = event.target.files?.[0]?.name;
              if (!fileName) return;
              applyTemplate(`Attached file context: ${fileName}`, 'File attached to prompt context.');
            }}
          />

          <button type="button" className="composer-icon-btn" aria-label="Open add menu" onClick={() => setOpenPanel((prev) => (prev === 'add' ? null : 'add'))}>
            <Plus className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className="composer-icon-btn" aria-label="Open tools menu" onClick={() => setOpenPanel((prev) => (prev === 'tools' ? null : 'tools'))}>
            <Wrench className="h-[18px] w-[18px]" />
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setDraftPrompt(e.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Assign a task or ask anything"
            className="composer-textarea max-h-36 min-h-[46px] flex-1 resize-none border-none bg-transparent px-2.5 py-2.5 text-[15px]"
          />
          <button type="button" className={`composer-icon-btn ${isVoiceMode ? 'composer-icon-btn-active' : ''}`} aria-label="Toggle voice mode" onClick={toggleVoiceMode}>
            <AudioLines className="h-[18px] w-[18px]" />
          </button>
          <button type="button" className="composer-icon-btn" aria-label="Start speech to text" onClick={startSpeechToText}>
            <Mic className="h-[18px] w-[18px]" />
          </button>
          <button type="button" onClick={() => void send()} className="composer-send-btn disabled:opacity-45" disabled={!draft.trim() || isAgentResponding} aria-label="Send message">
            <ArrowUp className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </main>
  );
}
