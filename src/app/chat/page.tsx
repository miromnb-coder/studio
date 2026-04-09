'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  Plus,
  RefreshCw,
  Mic,
  AudioLines,
  Github,
  Paperclip,
  ImagePlus,
  NotebookPen,
  ClipboardPaste,
  MessageSquare,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../store/app-store';
import { AgentStrategyCard } from './components/AgentStrategyCard';
import { StructuredResultCard } from './components/StructuredResultCard';

const formatConversationTime = (iso: string) => {
  const timestamp = new Date(iso);
  const diffMs = Date.now() - timestamp.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

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
  const conversationList = useAppStore((s) => s.conversationList);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const renameConversation = useAppStore((s) => s.renameConversation);

  const [draft, setDraft] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<'add' | 'tools' | 'conversations' | null>(null);
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
  }, [messages, isAgentResponding, activeConversationId]);

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

  const handleNewChat = () => {
    createConversation();
    setOpenPanel(null);
    setComposerNotice('Started a new chat.');
  };

  const handleDeleteConversation = (conversationId: string) => {
    const conversation = conversationList.find((item) => item.id === conversationId);
    if (!conversation) return;
    if (!window.confirm(`Delete "${conversation.title}"? This cannot be undone.`)) return;
    deleteConversation(conversationId);
    setComposerNotice('Conversation deleted.');
  };

  const handleRenameConversation = (conversationId: string, currentTitle: string) => {
    const nextTitle = window.prompt('Rename conversation', currentTitle);
    if (!nextTitle) return;
    renameConversation(conversationId, nextTitle);
    setComposerNotice('Conversation renamed.');
  };

  return (
    <main className="screen app-bg pb-48">
      <header className="mb-3 space-y-2 px-1 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-primary">Kivo</h1>
            <p className="text-sm text-secondary">Your personal AI assistant</p>
          </div>
          <button type="button" onClick={handleNewChat} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f6f6f6] px-3 py-1.5 text-xs font-medium text-[#232323]">
            <Plus className="h-3.5 w-3.5" /> New chat
          </button>
        </div>

        <button type="button" onClick={() => setOpenPanel((prev) => (prev === 'conversations' ? null : 'conversations'))} className="flex w-full items-center justify-between rounded-2xl border border-black/[0.06] bg-[#f6f6f6] px-3 py-2 text-left text-sm text-[#2f2f2f]">
          <span className="inline-flex items-center gap-2 font-medium"><MessageSquare className="h-4 w-4" /> Conversations</span>
          <span className="text-xs text-[#5e5e5e]">{conversationList.length}</span>
        </button>

        {openPanel === 'conversations' ? (
          <div className="message-appear max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#f7f7f7] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
            {conversationList.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div key={conversation.id} className={`rounded-xl border px-2.5 py-2 ${isActive ? 'border-[#6377a8]/30 bg-[#ebeff8]' : 'border-black/[0.05] bg-white'}`}>
                  <button type="button" onClick={() => { openConversation(conversation.id); setOpenPanel(null); }} className="w-full text-left">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`line-clamp-1 text-sm font-medium ${isActive ? 'text-[#24355e]' : 'text-[#252525]'}`}>{conversation.title}</p>
                      <span className="text-[11px] text-[#6a6a6a]">{formatConversationTime(conversation.updatedAt)}</span>
                    </div>
                    <p className="line-clamp-1 text-xs text-[#636363]">{conversation.lastMessagePreview || 'No messages yet'}</p>
                  </button>
                  <div className="mt-2 flex items-center justify-end gap-1">
                    <button type="button" onClick={() => handleRenameConversation(conversation.id, conversation.title)} className="composer-icon-btn" aria-label="Rename conversation">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => handleDeleteConversation(conversation.id)} className="composer-icon-btn" aria-label="Delete conversation">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </header>

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-300px)] space-y-4 overflow-y-auto pb-2">
        {empty ? (
          <div className="px-1 py-6 text-sm text-secondary">Ask anything. Kivo will think and help you move forward.</div>
        ) : (
          messages.map((message) => {
            const metadata = message.role === 'assistant' ? message.agentMetadata : undefined;

            return (
              <div key={message.id} className={`message-appear max-w-[95%] ${message.role === 'user' ? 'ml-auto' : ''}`}>
                <div className={message.role === 'user' ? 'ml-auto max-w-[90%] rounded-[18px] border border-black/[0.04] bg-[#f3f3f3] px-3.5 py-2.5 text-[15px] leading-6 text-[#1f1f1f]' : 'px-1 py-1 text-[16px] leading-[1.82] text-[#1d1d1d]'}>
                  {message.content || (message.isStreaming ? ' ' : '')}
                </div>

                {metadata ? (
                  <div className="px-1">
                    <AgentStrategyCard metadata={metadata} />
                    <StructuredResultCard data={metadata.structuredData} />
                  </div>
                ) : null}
              </div>
            );
          })
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
            <button type="button" onClick={handleNewChat} className="composer-menu-btn">
              <Plus className="h-4 w-4" /> New chat
            </button>
            <button type="button" onClick={() => setOpenPanel('conversations')} className="composer-menu-btn">
              <MessageSquare className="h-4 w-4" /> Open conversations
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-1.5 rounded-[28px] border border-black/[0.06] bg-[#f6f6f6] p-2 shadow-[0_10px_24px_rgba(0,0,0,0.04)]">
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
            <Plus className="h-4 w-4" />
          </button>
          <button type="button" className="composer-icon-btn" aria-label="Open tools menu" onClick={() => setOpenPanel((prev) => (prev === 'tools' ? null : 'tools'))}>
            <Github className="h-4 w-4" />
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
            className="system-input max-h-36 min-h-[44px] flex-1 resize-none border-none bg-[#f8f8f8] px-3 py-2.5 text-[15px]"
          />
          <button type="button" className={`composer-icon-btn ${isVoiceMode ? 'composer-icon-btn-active' : ''}`} aria-label="Toggle voice mode" onClick={toggleVoiceMode}>
            <AudioLines className="h-4 w-4" />
          </button>
          <button type="button" className="composer-icon-btn" aria-label="Start speech to text" onClick={startSpeechToText}>
            <Mic className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void send()} className="composer-send-btn disabled:opacity-45" disabled={!draft.trim() || isAgentResponding} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </main>
  );
}
