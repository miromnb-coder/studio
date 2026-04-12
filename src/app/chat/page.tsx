'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bot,
  Calendar,
  CalendarDays,
  ChevronRight,
  Crown,
  FileText,
  FolderKanban,
  Github,
  Globe,
  Inbox,
  Mail,
  Menu,
  MessageSquare,
  RefreshCw,
  Wand2,
  X,
} from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import type { FinanceActionType } from '@/lib/finance/types';
import { AgentThinkingSurface } from './components/AgentThinkingSurface';
import { AssistantResponseSurface } from './components/AssistantResponseSurface';
import { ChatComposerPremium } from './components/ChatComposerPremium';
import { ConversationSwitcherSheet } from './components/ConversationSwitcherSheet';
import type { ExecutionStep } from './components/AgentExecutionTimeline';
import type { ConnectorItem } from './components/ConnectorRow';
import { AppShell } from '../components/premium-ui';
import { trackEvent } from '@/app/lib/analytics-client';

const PREMIUM_UPLOAD_MESSAGE = 'File upload is a Premium feature. Upgrade to attach files.';
const DRAFT_STORAGE_KEY = 'nova-operator-chat-draft';

const THINKING_STEPS = [
  'Understanding your request',
  'Reviewing memory',
  'Running tools',
  'Comparing options',
  'Finalizing answer',
] as const;

const INTRO_LINES = [
  'Got it. I’ll work through this and give you the strongest next move.',
  'Understood. I’m reviewing this now and narrowing the best path.',
  'I’m on it. I’ll check the most important signals first.',
] as const;

const INITIAL_CONNECTORS: ConnectorItem[] = [
  { id: 'github', name: 'GitHub', icon: Github, status: 'connected' },
  { id: 'browser', name: 'Browser', icon: Globe, status: 'not_connected' },
  { id: 'gmail', name: 'Gmail', icon: Mail, status: 'not_connected' },
  { id: 'google-calendar', name: 'Google Calendar', icon: CalendarDays, status: 'not_connected' },
  { id: 'google-drive', name: 'Google Drive', icon: FolderKanban, status: 'not_connected' },
  { id: 'outlook-mail', name: 'Outlook Mail', icon: Inbox, status: 'error' },
  { id: 'outlook-calendar', name: 'Outlook Calendar', icon: Calendar, status: 'loading' },
  { id: 'notion', name: 'Notion', icon: FileText, status: 'not_connected' },
  { id: 'slack', name: 'Slack', icon: MessageSquare, status: 'not_connected' },
  { id: 'dropbox', name: 'Dropbox', icon: Bot, status: 'not_connected' },
];

function formatConversationTime(iso: string) {
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
}

function formatCompactUsage(current: number, limit: number, unlimited: boolean) {
  return unlimited ? '∞' : `${Math.max(limit - current, 0)} left`;
}

function pickIntroLine(input: string) {
  const normalized = input.toLowerCase();

  if (/\b(overwhelmed|stressed|anxious|worried)\b/.test(normalized)) {
    return 'I’ve got this. I’ll keep it simple and focus on the clearest next step.';
  }

  if (/\b(review|analy[sz]e|compare|audit|subscriptions?|billing|expenses?)\b/.test(normalized)) {
    return 'Understood. I’m reviewing the key signals first so I can rank the best move.';
  }

  if (/\b(plan|roadmap|strategy|next step|what should i do)\b/.test(normalized)) {
    return 'Got it. I’m mapping the strongest path before I answer.';
  }

  return INTRO_LINES[Math.abs(input.length) % INTRO_LINES.length];
}

function normalizeStepLabel(label?: string) {
  if (!label) return 'Finalizing answer';
  return label;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hydrated = useAppStore((s) => s.hydrated);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
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
  const runFinanceAction = useAppStore((s) => s.runFinanceAction);
  const activeSteps = useAppStore((s) => s.activeSteps);

  const { usage, isPremium, isLimitReached, isUnlimited, refresh } = useUserEntitlements();

  const [draft, setDraft] = useState('');
  const [openPanel, setOpenPanel] = useState<'add' | 'conversations' | null>(null);
  const [connectorsOpen, setConnectorsOpen] = useState(false);
  const [connectors, setConnectors] = useState<ConnectorItem[]>(INITIAL_CONNECTORS);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [financeActionLoadingForMessage, setFinanceActionLoadingForMessage] = useState<Record<string, FinanceActionType | null>>({});
  const [simulatedStepIndex, setSimulatedStepIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [chatMenuOpen, setChatMenuOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user');
  const empty = messages.length === 0;
  const showThinkingSurface = isAgentResponding;

  const activeConversation = useMemo(
    () => conversationList.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversationList, activeConversationId],
  );

  const derivedExecutionSteps = useMemo<ExecutionStep[]>(() => {
    if (activeSteps.length) {
      return activeSteps.map((step, idx) => ({
        id: `${step.label}-${idx}`,
        label: normalizeStepLabel(step.label),
        summary: step.summary,
        status: step.status,
      }));
    }

    if (activeAssistantMessage?.agentMetadata?.steps?.length) {
      return activeAssistantMessage.agentMetadata.steps.map((step, idx) => ({
        id: `${activeAssistantMessage.id}-${idx}`,
        label: normalizeStepLabel(step.action),
        summary: step.summary || step.error,
        status: step.status,
      }));
    }

    return THINKING_STEPS.map((label, idx) => ({
      id: `sim-${idx}`,
      label,
      status: !isAgentResponding
        ? 'completed'
        : idx < simulatedStepIndex
          ? 'completed'
          : idx === simulatedStepIndex
            ? 'running'
            : 'pending',
    }));
  }, [activeAssistantMessage, activeSteps, isAgentResponding, simulatedStepIndex]);

  const thinkingStatus = useMemo(() => {
    const running = derivedExecutionSteps.find((step) => step.status === 'running');
    if (running) return running.label;

    const completed = [...derivedExecutionSteps].reverse().find((step) => step.status === 'completed');
    if (completed && isAgentResponding) return completed.label;

    return 'Preparing recommendation';
  }, [derivedExecutionSteps, isAgentResponding]);

  const liveIntro = useMemo(() => {
    const latestUserInput = lastUserMessage?.content || draftPrompt || draft;
    return pickIntroLine(latestUserInput || 'help');
  }, [draft, draftPrompt, lastUserMessage?.content]);

  const requireAuth = () => {
    if (user) return false;
    setShowAuthPrompt(true);
    return true;
  };

  const persistDraft = (value: string) => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(DRAFT_STORAGE_KEY, value);
  };

  const clearPersistedDraft = () => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const openUpgrade = () => {
    setOpenPanel(null);
    router.push('/upgrade');
  };

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrate, hydrated]);

  useEffect(() => {
    const panel = searchParams.get('panel');
    const shouldStartNew = searchParams.get('new') === '1';

    if (!panel && !shouldStartNew) return;

    if (panel === 'conversations') {
      setOpenPanel('conversations');
      setConnectorsOpen(false);
    }

    if (shouldStartNew) {
      if (!user) {
        setShowAuthPrompt(true);
      } else {
        createConversation();
        setOpenPanel(null);
        setComposerNotice('Started a new chat.');
      }
    }

    router.replace('/chat');
  }, [createConversation, router, searchParams, user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const speechWindow = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
    setVoiceSupported(Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    setDraft(draftPrompt);
  }, [draftPrompt, activeConversationId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const persisted = window.sessionStorage.getItem(DRAFT_STORAGE_KEY);

    if (persisted && !draftPrompt) {
      setDraft(persisted);
      setDraftPrompt(persisted);
    }
  }, [draftPrompt, setDraftPrompt]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isAgentResponding, activeConversationId, simulatedStepIndex, activeSteps.length]);

  useEffect(() => {
    const listEl = listRef.current;
    if (!listEl) return;

    const onScroll = () => {
      const distance = listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight;
      setIsNearBottom(distance < 90);
    };

    onScroll();
    listEl.addEventListener('scroll', onScroll, { passive: true });

    return () => listEl.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 140 ? 'auto' : 'hidden';
  }, [draft]);

  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      if (!composerRef.current) return;

      const target = event.target as Node;
      if (!composerRef.current.contains(target)) {
        setOpenPanel((prev) => (prev === 'conversations' ? prev : null));
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
    if (!streamError?.startsWith('LIMIT_REACHED:')) return;
    setShowPaywall(true);
    void refresh();
  }, [streamError, refresh]);

  useEffect(() => {
    if (!isAgentResponding || activeSteps.length > 0) {
      setSimulatedStepIndex(0);
      return;
    }

    setSimulatedStepIndex(0);

    const interval = window.setInterval(() => {
      setSimulatedStepIndex((current) =>
        current >= THINKING_STEPS.length - 1 ? current : current + 1,
      );
    }, 920);

    return () => window.clearInterval(interval);
  }, [isAgentResponding, activeConversationId, activeSteps.length]);

  useEffect(() => {
    if (!draft.trim()) return;

    const handler = () => {
      if (!draft.trim() || isAgentResponding) return;
      trackEvent('chat_abandoned_send', {
        conversationId: activeConversationId,
        properties: { draftLength: draft.trim().length },
      });
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [draft, isAgentResponding, activeConversationId]);

  const applyTemplate = (template: string, notice: string) => {
    trackEvent('chat_prompt_template_used', { conversationId: activeConversationId, properties: { template } });
    if (requireAuth()) return;

    const nextValue = draft ? `${draft}\n${template}` : template;
    setDraft(nextValue);
    setDraftPrompt(nextValue);
    persistDraft(nextValue);
    setComposerNotice(notice);
    setOpenPanel(null);
  };

  const handleSend = async () => {
    const trimmedDraft = draft.trim();
    if (requireAuth()) return;

    if (isLimitReached) {
      trackEvent('chat_paywall_hit', { conversationId: activeConversationId, properties: { source: 'composer_send' } });
      setShowPaywall(true);
      return;
    }

    if (!trimmedDraft || isAgentResponding) return;

    setIsSending(true);

    try {
      await sendMessage(trimmedDraft);
    } finally {
      setIsSending(false);
    }

    setDraftPrompt('');
    setDraft('');
    clearPersistedDraft();
    await refresh();
  };

  const startSpeechToText = () => {
    if (!voiceSupported) {
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

      if (!transcript) {
        setComposerNotice('No speech detected. Please try again.');
        return;
      }

      const nextValue = draft ? `${draft} ${transcript}` : transcript;
      setDraft(nextValue);
      setDraftPrompt(nextValue);
      persistDraft(nextValue);
      setComposerNotice('Speech added to your message.');
    };
    recognition.onerror = () => setComposerNotice('Microphone permission is required to transcribe speech.');
    recognition.start();
  };

  const handleNewChat = () => {
    if (requireAuth()) return;
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

  const handleFinanceAction = async (messageId: string, actionType: FinanceActionType) => {
    if (!isPremium) {
      setShowPaywall(true);
      return;
    }

    setFinanceActionLoadingForMessage((prev) => ({ ...prev, [messageId]: actionType }));
    const result = await runFinanceAction(messageId, actionType);
    setFinanceActionLoadingForMessage((prev) => ({ ...prev, [messageId]: null }));

    if (!result.ok && result.errorCode === 'PREMIUM_REQUIRED') {
      setShowPaywall(true);
      return;
    }

    if (!result.ok) setComposerNotice('Action completed with partial result.');
  };

  const jumpToBottom = () => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  };

  const setConnectorStatus = (id: string, status: ConnectorItem['status']) => {
    setConnectors((current) =>
      current.map((connector) => (connector.id === id ? { ...connector, status } : connector)),
    );
  };

  const connectConnector = (id: string) => {
    setConnectorStatus(id, 'loading');

    window.setTimeout(() => {
      const shouldError = id === 'outlook-mail';
      setConnectorStatus(id, shouldError ? 'error' : 'connected');
      setComposerNotice(shouldError ? 'Connection failed. Please retry.' : 'Connector linked successfully.');
    }, 820);
  };

  return (
    <AppShell className="relative isolate overflow-hidden bg-[#ededee] pb-44 sm:pb-42">
      <header className="sticky top-0 z-30 mb-3 px-4 pb-2 pt-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOpenPanel((prev) => (prev === 'conversations' ? null : 'conversations'))}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d3d4d8] bg-[#f1f1f2] px-3 text-xs font-medium text-[#2d2f34]"
              aria-label="Open conversations"
            >
              Conversations
            </button>
            <button
              type="button"
              onClick={() => router.push('/activity')}
              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#d3d4d8] bg-[#f1f1f2] px-3 text-xs font-medium text-[#2d2f34]"
            >
              Workspace
            </button>
          </div>
          <p className="text-[22px] font-medium tracking-[-0.02em] text-[#2b2d31]">Kivo</p>

          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setChatMenuOpen(true)} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#d3d4d8] bg-[#f1f1f2] text-[#3a3d43]" aria-label="Open menu">
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>
        <p className="mt-2 text-center text-[11px] text-[#666b74]">{formatCompactUsage(usage.current, usage.limit, usage.unlimited)}</p>

        <AnimatePresence>
          {openPanel === 'conversations' ? (
            <ConversationSwitcherSheet
              conversations={conversationList}
              activeConversationId={activeConversationId}
              onOpenConversation={(id) => {
                openConversation(id);
                setOpenPanel(null);
              }}
              onRenameConversation={handleRenameConversation}
              onDeleteConversation={handleDeleteConversation}
              formatConversationTime={formatConversationTime}
              onClose={() => setOpenPanel(null)}
              onNewChat={handleNewChat}
            />
          ) : null}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {chatMenuOpen ? (
          <>
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setChatMenuOpen(false)} className="fixed inset-0 z-40 bg-black/20" />
            <motion.aside initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 30 }} className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-[30px] border border-[#dde1e8] bg-[#f6f7f9] px-4 pb-[calc(20px+env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_30px_rgba(17,24,39,0.12)]">
              <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[#c8ced8]" />
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#22262c]">Menu</h2>
                <button type="button" onClick={() => setChatMenuOpen(false)} className="composer-icon-btn"><X className="h-4 w-4" /></button>
              </div>
              {[
                ['Primary', [['New Chat', '/chat?new=1'], ['Conversations', '/chat?panel=conversations'], ['Tasks', '/tasks'], ['Alerts', '/alerts']]],
                ['Secondary', [['Profile', '/profile'], ['Settings', '/settings'], ['Upgrade', '/upgrade']]],
              ].map(([title, items]) => (
                <div key={title as string} className="mb-2.5 rounded-2xl border border-[#dde1e8] bg-white p-2.5">
                  <p className="px-2 pb-1 text-xs uppercase tracking-[0.16em] text-[#7a838f]">{title as string}</p>
                  {(items as string[][]).map(([label, href]) => (
                    <button key={label} type="button" onClick={() => { router.push(href); setChatMenuOpen(false); }} className="flex w-full items-center justify-between rounded-xl px-2 py-2.5 text-left text-sm text-[#2b3037] hover:bg-[#f3f5f8]">
                      <span>{label}</span><ChevronRight className="h-4 w-4 text-[#8b95a3]" />
                    </button>
                  ))}
                </div>
              ))}
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <LayoutGroup>
        <section
          ref={listRef}
          className="relative z-10 max-h-[calc(100vh-258px)] overflow-y-auto pb-10 scroll-pb-52"
        >
          <AnimatePresence mode="wait">
            {empty ? (
              <motion.div
                key="chat-empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex min-h-[68vh] flex-col items-center justify-center px-6 text-center"
              >
                <h2 className="font-serif text-[54px] font-normal leading-[1.12] tracking-[-0.015em] text-[#2d3036] sm:text-[60px]">
                  What can I do for you?
                </h2>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="space-y-7 px-1 pb-4">
            {messages
              .filter((message) => !(message.role === 'assistant' && message.isStreaming && isAgentResponding))
              .map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className={`max-w-[99%] ${message.role === 'user' ? 'ml-auto' : ''}`}
                >
                  {message.role === 'user' ? (
                    <div className="ml-auto w-full max-w-[88%] rounded-[24px] border border-[#d2d9e6] bg-[#eaf0f8] px-4 py-3.5 text-[15px] leading-7 tracking-[-0.01em] text-[#22262c] shadow-sm">
                      <p>{message.content}</p>
                      <p className="mt-2 text-right text-[10px] uppercase tracking-[0.16em] text-[#7a838f]">You · #{index + 1}</p>
                    </div>
                  ) : (
                    <AssistantResponseSurface
                      message={message}
                      isPremium={isPremium}
                      actionLoading={financeActionLoadingForMessage[message.id] || null}
                      onAction={(actionType) => void handleFinanceAction(message.id, actionType)}
                      onPremiumRequired={() => setShowPaywall(true)}
                    />
                  )}
                </motion.div>
              ))}
          </div>

          <AnimatePresence mode="wait">
            {showThinkingSurface ? (
              <motion.div
                key="thinking-surface"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="px-1 pt-0.5"
              >
                <div className="max-w-[97%] space-y-3">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.22 }}
                    className="rounded-[24px] border border-[#dce1e8] bg-white px-4 py-3.5 shadow-sm backdrop-blur-xl"
                  >
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-[#dce1e8] bg-[#f8f9fb] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#8791a0]">
                      <Wand2 className="h-3 w-3" />
                      Live reasoning
                    </p>
                    <p className="mt-2 text-[15px] leading-7 tracking-[-0.012em] text-[#22262c]/95">
                      {liveIntro}
                    </p>
                  </motion.div>

                  <AgentThinkingSurface statusText={thinkingStatus} steps={derivedExecutionSteps} />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {streamError &&
          !streamError.startsWith('LIMIT_REACHED:') &&
          !streamError.startsWith('AUTH_REQUIRED:') &&
          !streamError.startsWith('PREMIUM_REQUIRED:') ? (
            <div className="mx-1 mt-4 rounded-[20px] border border-rose-300/18 bg-rose-300/10 px-3.5 py-2.5 text-sm text-rose-700 shadow-sm backdrop-blur-xl">
              We hit a processing issue, but your conversation is still safe.
              <button
                type="button"
                onClick={() => void retryLastPrompt()}
                className="btn-secondary ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs"
              >
                <RefreshCw className="h-3 w-3" />
                Retry
              </button>
            </div>
          ) : null}

          {!isNearBottom && !empty ? (
            <button
              type="button"
              onClick={jumpToBottom}
              className="sticky bottom-3 left-1/2 z-20 ml-auto mr-2 block rounded-full border border-[#cfd6e0] bg-white/95 px-3 py-1.5 text-xs text-[#22262c] backdrop-blur-xl transition hover:border-[#c0c9d6] hover:bg-white"
            >
              Jump to latest
            </button>
          ) : null}
        </section>
      </LayoutGroup>

      <ChatComposerPremium
        composerRef={composerRef}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        draft={draft}
        notice={composerNotice}
        openPanel={openPanel === 'conversations' ? null : openPanel}
        connectorsOpen={connectorsOpen}
        connectors={connectors}
        voiceSupported={voiceSupported}
        isAgentResponding={isAgentResponding}
        isSending={isSending}
        isLimitReached={isLimitReached}
        userPresent={Boolean(user)}
        onDraftChange={(value) => {
          if (requireAuth()) return;
          setDraft(value);
          setDraftPrompt(value);
          persistDraft(value);
        }}
        onSend={() => void handleSend()}
        onTextareaFocus={() => {
          if (requireAuth()) router.push('/login?next=/chat');
        }}
        onTogglePanel={(panel) => setOpenPanel((prev) => (prev === panel ? null : panel))}
        onToggleConnectors={() => {
          setConnectorsOpen((prev) => !prev);
          setOpenPanel(null);
        }}
        onCloseConnectors={() => setConnectorsOpen(false)}
        onSpeechToText={startSpeechToText}
        onAttachFile={() => {
          if (!isPremium) {
            trackEvent('chat_paywall_hit', { conversationId: activeConversationId, properties: { source: 'file_upload' } });
            setComposerNotice(PREMIUM_UPLOAD_MESSAGE);
            setShowPaywall(true);
            return;
          }

          fileInputRef.current?.click();
          setOpenPanel(null);
        }}
        onAddImagePrompt={() => applyTemplate('Please use this image as context:', 'Image template added.')}
        onStartTaskTemplate={() => applyTemplate('Start a structured task template for: ', 'Task template added.')}
        onAddNoteTemplate={() => applyTemplate('Quick note: ', 'Note template added.')}
        onOpenAddConnector={() => setComposerNotice('Connector discovery will be wired to provider OAuth flows.')}
        onOpenManageConnector={() => setComposerNotice('Connector settings will include scopes and account switching.')}
        onToggleConnector={(id, enabled) => {
          setConnectorStatus(id, enabled ? 'connected' : 'not_connected');
        }}
        onConnectConnector={connectConnector}
        onRetryConnector={connectConnector}
      />

      {isLimitReached && !isUnlimited ? (
        <div className="fixed bottom-[calc(176px+env(safe-area-inset-bottom))] left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-2xl border border-[#dce1e8] bg-[#f8f9fb] px-3 py-2.5 text-xs text-[#4b5360] shadow-sm backdrop-blur-xl">
            You&apos;ve reached your daily limit. Upgrade for higher limits and file tools.
            <button
              type="button"
              onClick={openUpgrade}
              className="ml-2 inline-flex rounded-full border border-[#d2d8e2] bg-[#f5f7fa] px-2 py-0.5 text-[11px] font-medium"
            >
              Upgrade
            </button>
          </div>
        </div>
      ) : null}

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-[#dce1e8] bg-white p-4 shadow-xl">
            <h2 className="text-base font-semibold text-[#22262c]">Sign in required</h2>
            <p className="mt-1 text-sm text-[#8791a0]">
              Please log in before sending messages or saving conversations.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary w-full px-3 py-2 text-sm"
                onClick={() => setShowAuthPrompt(false)}
              >
                Not now
              </button>
              <button
                type="button"
                className="btn-primary w-full px-3 py-2 text-sm"
                onClick={() => router.push('/login?next=/chat')}
              >
                Continue to login
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPaywall && !isUnlimited ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/20 px-4 pb-20 pt-8">
          <div className="w-full max-w-md rounded-[24px] border border-[#dce1e8] bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center gap-2 text-[#22262c]">
              <Crown className="h-5 w-5" />
              <h2 className="text-base font-semibold">Daily limit reached</h2>
            </div>
            <p className="text-sm text-[#8791a0]">
              You&apos;ve used all free runs for today. Upgrade to unlock more daily runs and file attachments.
            </p>

            <div className="mt-3 rounded-xl border border-[#dce1e8] bg-[#f8f9fb] p-3 text-sm">
              <p className="font-medium text-[#22262c]">Free vs Premium</p>
              <ul className="mt-1 space-y-1 text-[#8791a0]">
                <li>• Free: {usage.limit} runs / day</li>
                <li>• Premium: 1000 runs / day</li>
                <li>• Premium: File uploads in chat</li>
              </ul>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-secondary w-full px-3 py-2 text-sm"
                onClick={() => setShowPaywall(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn-primary w-full px-3 py-2 text-sm"
                onClick={openUpgrade}
              >
                Upgrade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
