'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Calendar,
  CalendarDays,
  Crown,
  FileText,
  FolderKanban,
  Github,
  Globe,
  Inbox,
  Mail,
  MessageSquare,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  Wand2,
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

const QUICK_START_PROMPTS = [
  'Review my monthly subscriptions and tell me what to cancel first.',
  'Create a 30-day savings plan based on my current spending.',
  'Check my recent billing risks and suggest next actions.',
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

function formatUsageLine(current: number, limit: number, unlimited: boolean) {
  return unlimited ? 'Unlimited (Dev Mode)' : `${Math.max(limit - current, 0)} / ${limit} uses left today`;
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
    <AppShell className="relative isolate overflow-hidden pb-64 sm:pb-60">
      <div className="pointer-events-none absolute inset-x-0 top-[-180px] z-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.14),transparent_58%),radial-gradient(circle_at_72%_18%,rgba(167,139,250,0.14),transparent_48%)]" />

      <header className="sticky top-0 z-30 mb-4 rounded-[24px] border border-white/[0.06] bg-[linear-gradient(160deg,rgba(17,20,30,0.92),rgba(10,11,16,0.84))] px-4 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03]">
                <Bot className="h-4 w-4 text-zinc-200" />
              </span>
              <div>
                <h1 className="text-[18px] font-semibold tracking-[-0.024em] text-zinc-100">Kivo Operator</h1>
                <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">Premium AI Workspace</p>
              </div>
            </div>
            <p className="mt-2 truncate text-[11px] tracking-[0.01em] text-zinc-500">
              {formatUsageLine(usage.current, usage.limit, usage.unlimited)}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-300">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isAgentResponding ? 'animate-pulse bg-sky-300' : 'bg-emerald-300'
                }`}
              />
              {isAgentResponding ? 'Agent running' : 'Agent ready'}
            </span>

            <button
              type="button"
              onClick={() => setOpenPanel((prev) => (prev === 'conversations' ? null : 'conversations'))}
              className="inline-flex min-w-0 max-w-[56vw] items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-zinc-300 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.05]"
              aria-label="Open conversations"
            >
              <span className="truncate text-xs font-medium text-zinc-100">
                {activeConversation?.title || 'Conversations'}
              </span>
              <span className="rounded-full border border-white/[0.08] bg-black/20 px-1.5 py-0.5 text-[10px] text-zinc-500">
                {conversationList.length}
              </span>
              <MoreHorizontal className="h-4 w-4 shrink-0" />
            </button>
          </div>
        </div>

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
                className="flex min-h-[66vh] flex-col items-center justify-center px-5 text-center"
              >
                <div className="rounded-3xl border border-white/[0.07] bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.016))] px-5 py-4 shadow-[0_16px_42px_rgba(0,0,0,0.26)] backdrop-blur-xl">
                  <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] text-zinc-400">
                    <Sparkles className="h-3 w-3" />
                    Kivo Agent Mode
                  </p>
                  <h2 className="mt-3 text-[34px] font-semibold leading-[1.06] tracking-[-0.04em] text-zinc-100">
                    Ask once. Get a real plan.
                  </h2>
                  <p className="mt-3 max-w-[30ch] text-sm leading-6 text-zinc-500">
                    Kivo thinks in visible steps, compares options, and returns structured recommendations you can act on immediately.
                  </p>
                </div>

                <div className="mt-6 flex w-full max-w-sm flex-col gap-2.5">
                  {QUICK_START_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => applyTemplate(prompt, 'Prompt added. You can edit before sending.')}
                      className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(155deg,rgba(255,255,255,0.04),rgba(255,255,255,0.014))] px-4 py-3 text-left text-xs leading-5 text-zinc-300 transition hover:border-white/[0.14] hover:bg-white/[0.05]"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
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
                    <div className="ml-auto w-full max-w-[88%] rounded-[24px] border border-sky-200/18 bg-[linear-gradient(152deg,rgba(90,175,255,0.25),rgba(255,255,255,0.1)_52%,rgba(255,255,255,0.04))] px-4 py-3.5 text-[15px] leading-7 tracking-[-0.01em] text-zinc-100 shadow-[0_18px_36px_rgba(8,16,32,0.38)]">
                      <p>{message.content}</p>
                      <p className="mt-2 text-right text-[10px] uppercase tracking-[0.16em] text-sky-100/55">You · #{index + 1}</p>
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
                    className="rounded-[24px] border border-white/[0.06] bg-[linear-gradient(155deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-4 py-3.5 shadow-[0_14px_32px_rgba(0,0,0,0.24)] backdrop-blur-xl"
                  >
                    <p className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-zinc-400">
                      <Wand2 className="h-3 w-3" />
                      Live reasoning
                    </p>
                    <p className="mt-2 text-[15px] leading-7 tracking-[-0.012em] text-zinc-100/95">
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
            <div className="mx-1 mt-4 rounded-[20px] border border-rose-300/18 bg-rose-300/10 px-3.5 py-2.5 text-sm text-rose-100/90 shadow-[0_12px_28px_rgba(0,0,0,0.2)] backdrop-blur-xl">
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
              className="sticky bottom-3 left-1/2 z-20 ml-auto mr-2 block rounded-full border border-white/[0.1] bg-black/58 px-3 py-1.5 text-xs text-zinc-100 backdrop-blur-xl transition hover:border-white/[0.16] hover:bg-black/66"
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
          <div className="rounded-2xl border border-white/[0.08] bg-black/68 px-3 py-2.5 text-xs text-zinc-300 shadow-[0_14px_28px_rgba(0,0,0,0.38)] backdrop-blur-xl">
            You&apos;ve reached your daily limit. Upgrade for higher limits and file tools.
            <button
              type="button"
              onClick={openUpgrade}
              className="ml-2 inline-flex rounded-full border border-white/[0.14] bg-white/[0.04] px-2 py-0.5 text-[11px] font-medium"
            >
              Upgrade
            </button>
          </div>
        </div>
      ) : null}

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#111111] p-4 shadow-xl">
            <h2 className="text-base font-semibold text-zinc-100">Sign in required</h2>
            <p className="mt-1 text-sm text-zinc-400">
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
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/45 px-4 pb-20 pt-8">
          <div className="w-full max-w-md rounded-[24px] border border-white/[0.08] bg-[#111111] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.45)]">
            <div className="mb-3 flex items-center gap-2 text-zinc-100">
              <Crown className="h-5 w-5" />
              <h2 className="text-base font-semibold">Daily limit reached</h2>
            </div>
            <p className="text-sm text-zinc-400">
              You&apos;ve used all free runs for today. Upgrade to unlock more daily runs and file attachments.
            </p>

            <div className="mt-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm">
              <p className="font-medium text-zinc-100">Free vs Premium</p>
              <ul className="mt-1 space-y-1 text-zinc-400">
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
