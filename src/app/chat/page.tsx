'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  AudioLines,
  ClipboardPaste,
  Crown,
  Edit3,
  FilePlus2,
  FolderOpen,
  Menu,
  Mic,
  NotebookPen,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '../store/app-store';
import { AgentStrategyCard } from './components/AgentStrategyCard';
import { StructuredResultCard } from './components/StructuredResultCard';

const MAX_TEXTAREA_HEIGHT = 168;

export default function ChatPage() {
  const router = useRouter();
  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const messages = useAppStore((s) => s.messages);
  const draftPrompt = useAppStore((s) => s.draftPrompt);
  const setDraftPrompt = useAppStore((s) => s.setDraftPrompt);
  const clearConversationDraft = useAppStore((s) => s.clearConversationDraft);
  const conversations = useAppStore((s) => s.conversations);
  const activeConversationId = useAppStore((s) => s.activeConversationId);
  const createConversation = useAppStore((s) => s.createConversation);
  const openConversation = useAppStore((s) => s.openConversation);
  const renameConversation = useAppStore((s) => s.renameConversation);
  const deleteConversation = useAppStore((s) => s.deleteConversation);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const retryLastPrompt = useAppStore((s) => s.retryLastPrompt);
  const isAgentResponding = useAppStore((s) => s.isAgentResponding);
  const streamError = useAppStore((s) => s.streamError);
  const plan = useAppStore((s) => s.plan);
  const usageCount = useAppStore((s) => s.usageCount);
  const usageLimit = useAppStore((s) => s.usageLimit);

  const [draft, setDraft] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<'add' | 'menu' | 'conversations' | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const formatRelativeTime = (iso: string) => {
    const deltaMs = Date.now() - new Date(iso).getTime();
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    if (deltaMs < minute) return 'now';
    if (deltaMs < hour) return `${Math.floor(deltaMs / minute)}m`;
    if (deltaMs < day) return `${Math.floor(deltaMs / hour)}h`;
    return `${Math.floor(deltaMs / day)}d`;
  };

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    const loadUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      const authUser = data.user;
      if (!authUser) return;
      const name =
        (authUser.user_metadata?.full_name as string | undefined) ||
        authUser.email?.split('@')[0] ||
        'User';
      setUser({ id: authUser.id, email: authUser.email ?? '', name });
    };
    void loadUser();
  }, [setUser]);

  useEffect(() => {
    const speechWindow = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setSpeechSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

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
    const nextHeight = Math.min(textareaRef.current.scrollHeight, MAX_TEXTAREA_HEIGHT);
    textareaRef.current.style.height = `${nextHeight}px`;
    textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > MAX_TEXTAREA_HEIGHT ? 'auto' : 'hidden';
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
    const timeout = window.setTimeout(() => setComposerNotice(null), 2500);
    return () => window.clearTimeout(timeout);
  }, [composerNotice]);

  const requireAuth = () => {
    if (user) return false;
    setShowAuthPrompt(true);
    return true;
  };

  const send = async () => {
    if (!draft.trim() || isAgentResponding) return;
    if (requireAuth()) return;
    try {
      await sendMessage(draft);
      setDraftPrompt('');
      setDraft('');
      if (typeof window !== 'undefined') window.sessionStorage.removeItem('nova-operator-chat-draft');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send message.';
      if (message.includes('LIMIT_REACHED')) {
        setComposerNotice('Daily free limit reached. Upgrade to keep chatting.');
        return;
      }
      if (message.includes('AUTH_REQUIRED')) {
        setShowAuthPrompt(true);
      }
    }
  };

  const empty = useMemo(() => messages.length === 0, [messages]);
  const activeAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const showTyping = isAgentResponding && !!activeAssistantMessage && !activeAssistantMessage.content;
  const canSend = !!draft.trim() && !isAgentResponding && !!user && (plan === 'PRO' || usageCount < usageLimit);

  const applyTemplate = (template: string, notice: string) => {
    if (requireAuth()) return;
    const nextValue = draft ? `${draft}\n${template}` : template;
    setDraft(nextValue);
    setDraftPrompt(nextValue);
    setComposerNotice(notice);
    setOpenPanel(null);
  };

  const startSpeechToText = () => {
    if (!speechSupported) {
      setComposerNotice('Speech input is not available on this device.');
      return;
    }

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
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setComposerNotice('Listening…');
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (!transcript) return;
      const nextValue = draft ? `${draft} ${transcript}` : transcript;
      setDraft(nextValue);
      setDraftPrompt(nextValue);
      setComposerNotice('Speech added to your draft.');
    };
    recognition.onerror = () => setComposerNotice('Microphone permission is required to transcribe speech.');
    recognition.start();
  };

  return (
    <main className="screen app-bg pb-52">
      <header className="mb-3 flex items-start justify-between px-1 pt-1">
        <div>
          <h1 className="text-xl font-semibold text-primary">Kivo</h1>
          <p className="text-sm text-secondary">Your personal AI assistant</p>
        </div>
        <button type="button" onClick={() => router.push('/settings?upgrade=1')} className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
          <Crown className="h-3.5 w-3.5" /> Upgrade
        </button>
      </header>

      <section className="mb-3 flex items-center gap-2 px-1">
        <button type="button" onClick={() => createConversation()} className="btn-secondary px-3 py-1.5 text-xs">
          + New chat
        </button>
        <button type="button" onClick={() => setOpenPanel('conversations')} className="btn-secondary px-3 py-1.5 text-xs">
          Conversations
        </button>
      </section>

      {plan === 'FREE' ? (
        <section className="mb-3 rounded-2xl border border-black/10 bg-[#f5f5f5] px-3 py-2 text-xs text-secondary">
          Free usage: <span className="font-semibold text-primary">{Math.max(usageLimit - usageCount, 0)}</span> messages left today.
          {usageCount >= usageLimit ? (
            <button type="button" onClick={() => router.push('/settings?upgrade=1')} className="ml-2 font-semibold text-primary underline-offset-2 hover:underline">
              Upgrade for more
            </button>
          ) : null}
        </section>
      ) : null}

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-310px)] space-y-4 overflow-y-auto pb-2">
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
        {composerNotice ? <p className="message-appear mb-2 px-2 text-xs text-[#6f6f6f]">{composerNotice}</p> : null}

        {openPanel === 'add' ? (
          <div className="message-appear mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6] p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="composer-menu-btn">
              <FilePlus2 className="h-4 w-4" /> Upload file
            </button>
            <button type="button" onClick={() => applyTemplate('Start a structured task template for: ', 'Task template added.')} className="composer-menu-btn">
              <NotebookPen className="h-4 w-4" /> Task template
            </button>
            <button type="button" onClick={() => applyTemplate('Quick note: ', 'Note template added.')} className="composer-menu-btn">
              <ClipboardPaste className="h-4 w-4" /> Add note
            </button>
          </div>
        ) : null}

        {openPanel === 'menu' ? (
          <div className="message-appear mb-2 rounded-2xl border border-black/[0.06] bg-[#f6f6f6] p-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <button type="button" onClick={() => { createConversation(); setOpenPanel(null); }} className="composer-menu-btn">
              <Plus className="h-4 w-4" /> New chat
            </button>
            <button type="button" onClick={() => setOpenPanel('conversations')} className="composer-menu-btn">
              <FolderOpen className="h-4 w-4" /> View conversations
            </button>
            <button type="button" onClick={() => { clearConversationDraft(); setDraft(''); setOpenPanel(null); }} className="composer-menu-btn">
              <ClipboardPaste className="h-4 w-4" /> Clear current draft
            </button>
            <button type="button" onClick={() => { setComposerNotice(`Plan: ${plan}. Used ${usageCount}/${usageLimit} today.`); setOpenPanel(null); }} className="composer-menu-btn">
              <Sparkles className="h-4 w-4" /> Plan & usage info
            </button>
            <button type="button" onClick={() => router.push('/settings?upgrade=1')} className="composer-menu-btn">
              <Crown className="h-4 w-4" /> Upgrade
            </button>
          </div>
        ) : null}

        {openPanel === 'conversations' ? (
          <div className="message-appear mb-2 max-h-72 overflow-y-auto rounded-2xl border border-black/[0.06] bg-[#f6f6f6] p-2 shadow-[0_8px_20px_rgba(0,0,0,0.05)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs font-semibold text-secondary">Conversations</p>
              <button
                type="button"
                onClick={() => {
                  createConversation();
                  setOpenPanel(null);
                }}
                className="btn-secondary px-2.5 py-1 text-[11px]"
              >
                + New
              </button>
            </div>
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`mb-1.5 rounded-xl border p-2 ${conversation.id === activeConversationId ? 'border-black/25 bg-[#ededed]' : 'border-black/10 bg-[#f3f3f3]'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    openConversation(conversation.id);
                    setOpenPanel(null);
                  }}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-primary">{conversation.title}</p>
                    <p className="text-[11px] text-secondary">{formatRelativeTime(conversation.updatedAt)}</p>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-secondary">
                    {conversation.lastMessagePreview || 'No messages yet'}
                  </p>
                  <p className="mt-1 text-[11px] text-secondary">{conversation.messageCount} messages</p>
                </button>
                <div className="mt-1.5 flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextTitle = window.prompt('Rename conversation', conversation.title);
                      if (!nextTitle) return;
                      renameConversation(conversation.id, nextTitle);
                    }}
                    className="composer-icon-btn h-7 w-7"
                    aria-label="Rename conversation"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const shouldDelete = window.confirm('Delete this conversation? This cannot be undone.');
                      if (!shouldDelete) return;
                      deleteConversation(conversation.id);
                    }}
                    className="composer-icon-btn h-7 w-7"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2 rounded-[30px] border border-black/[0.06] bg-[#f6f6f6] p-2.5 shadow-[0_12px_28px_rgba(0,0,0,0.06)]">
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
          <button type="button" className="composer-icon-btn" aria-label="Open utility menu" onClick={() => setOpenPanel((prev) => (prev === 'menu' ? null : 'menu'))}>
            <Menu className="h-4 w-4" />
          </button>
          <textarea
            ref={textareaRef}
            value={draft}
            onFocus={() => {
              if (requireAuth()) return;
              setTimeout(() => textareaRef.current?.scrollIntoView({ block: 'nearest' }), 120);
            }}
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
            placeholder={user ? 'Ask anything or assign a task' : 'Sign in to start chatting'}
            className="system-input min-h-[46px] flex-1 resize-none border-none bg-[#f8f8f8] px-3 py-2.5 text-[15px]"
            readOnly={!user}
          />
          <button
            type="button"
            className={`composer-icon-btn ${isVoiceMode ? 'composer-icon-btn-active' : ''}`}
            aria-label="Toggle voice mode"
            onClick={() => setIsVoiceMode((prev) => !prev)}
            disabled={!speechSupported}
          >
            <AudioLines className="h-4 w-4" />
          </button>
          <button type="button" className="composer-icon-btn" aria-label="Start speech to text" onClick={startSpeechToText} disabled={!speechSupported}>
            <Mic className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => void send()} className="composer-send-btn disabled:opacity-45" disabled={!canSend} aria-label="Send message">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/25 p-4">
          <div className="w-full rounded-2xl border border-black/10 bg-[#f6f6f6] p-4">
            <p className="text-sm font-semibold text-primary">Sign in required</p>
            <p className="mt-1 text-sm text-secondary">Please sign in or create an account before sending messages.</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setShowAuthPrompt(false)} className="btn-secondary flex-1 px-3 py-2 text-sm">Not now</button>
              <button type="button" onClick={() => router.push('/login?next=/chat')} className="btn-primary flex-1 px-3 py-2 text-sm">Go to login</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
