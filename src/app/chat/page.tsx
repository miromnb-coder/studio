'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, PanelLeft, RefreshCw } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '../store/app-store';
import { useUserEntitlements } from '../hooks/use-user-entitlements';
import type { FinanceActionType } from '@/lib/finance/types';
import { AgentThinkingSurface } from './components/AgentThinkingSurface';
import { AssistantResponseSurface } from './components/AssistantResponseSurface';
import { ChatComposerPremium } from './components/ChatComposerPremium';
import { ConversationSwitcherSheet } from './components/ConversationSwitcherSheet';
import { AgentActivityBadge } from './components/AgentActivityBadge';
import type { ExecutionStep } from './components/AgentExecutionTimeline';

const PREMIUM_UPLOAD_MESSAGE = 'File upload is a Premium feature. Upgrade to attach files.';
const THINKING_STEPS = [
  'Understanding request',
  'Loading memory',
  'Running analysis',
  'Detecting subscriptions',
  'Generating savings insights',
  'Preparing response',
];

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

const formatUsageLine = (current: number, limit: number, unlimited: boolean) =>
  unlimited ? 'Unlimited (Dev Mode)' : `${Math.max(limit - current, 0)} / ${limit} uses left today`;

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
  const { plan, usage, isPremium, isLimitReached, isUnlimited, refresh } = useUserEntitlements();

  const [draft, setDraft] = useState('');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [openPanel, setOpenPanel] = useState<'add' | 'utility' | 'conversations' | null>(null);
  const [composerNotice, setComposerNotice] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [financeActionLoadingForMessage, setFinanceActionLoadingForMessage] = useState<Record<string, FinanceActionType | null>>({});
  const [simulatedStepIndex, setSimulatedStepIndex] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');
  const showThinkingSurface = isAgentResponding && !!activeAssistantMessage;
  const empty = useMemo(() => messages.length === 0, [messages]);

  const derivedExecutionSteps = useMemo<ExecutionStep[]>(() => {
    if (activeAssistantMessage?.agentMetadata?.steps?.length) {
      return activeAssistantMessage.agentMetadata.steps.map((step, idx) => ({
        id: `${activeAssistantMessage.id}-${idx}`,
        label: step.action,
        summary: step.summary || step.error,
        status: step.status,
      }));
    }

    return THINKING_STEPS.map((label, idx) => ({
      id: `sim-${idx}`,
      label,
      status: !isAgentResponding ? 'completed' : idx < simulatedStepIndex ? 'completed' : idx === simulatedStepIndex ? 'running' : 'pending',
    }));
  }, [activeAssistantMessage, isAgentResponding, simulatedStepIndex]);

  const requireAuth = () => {
    if (user) return false;
    setShowAuthPrompt(true);
    return true;
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
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isAgentResponding, activeConversationId, simulatedStepIndex]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 164)}px`;
    textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 164 ? 'auto' : 'hidden';
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
    const timeout = window.setTimeout(() => setComposerNotice(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [composerNotice]);

  useEffect(() => {
    if (!streamError?.startsWith('LIMIT_REACHED:')) return;
    setShowPaywall(true);
    void refresh();
  }, [streamError, refresh]);

  useEffect(() => {
    if (!isAgentResponding) {
      setSimulatedStepIndex(0);
      return;
    }

    setSimulatedStepIndex(0);
    const interval = window.setInterval(() => {
      setSimulatedStepIndex((current) => (current >= THINKING_STEPS.length - 1 ? current : current + 1));
    }, 900);

    return () => window.clearInterval(interval);
  }, [isAgentResponding, activeConversationId]);

  const applyTemplate = (template: string, notice: string) => {
    if (requireAuth()) return;
    const nextValue = draft ? `${draft}\n${template}` : template;
    setDraft(nextValue);
    setDraftPrompt(nextValue);
    setComposerNotice(notice);
    setOpenPanel(null);
  };

  const handleSend = async () => {
    if (requireAuth()) return;
    if (isLimitReached) {
      setShowPaywall(true);
      return;
    }
    if (!draft.trim() || isAgentResponding) return;
    await sendMessage(draft);
    setDraftPrompt('');
    setDraft('');
    if (typeof window !== 'undefined') window.sessionStorage.removeItem('nova-operator-chat-draft');
    await refresh();
  };

  const toggleVoiceMode = () => {
    if (!voiceSupported) {
      setComposerNotice('Voice is unavailable on this browser.');
      return;
    }
    setIsVoiceMode((prev) => {
      const next = !prev;
      setComposerNotice(next ? 'Voice mode ready.' : 'Voice mode turned off.');
      return next;
    });
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

  const thinkingStatus = activeSteps.length
    ? activeSteps.find((step) => step.status === 'running')?.label || 'Processing execution steps'
    : derivedExecutionSteps.find((step) => step.status === 'running')?.label || 'Preparing response';

  return (
    <main className="screen app-bg pb-56">
      <header className="mb-3 space-y-2 px-1 pt-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenPanel((prev) => (prev === 'conversations' ? null : 'conversations'))}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/[0.08] bg-[#f6f6f6] text-[#2b2b2b] shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
              aria-label="Open conversation menu"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-primary">Kivo</h1>
              <p className="text-sm text-secondary">AI operator workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={openUpgrade} className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f6f6f6] px-3 py-1.5 text-xs font-medium text-[#232323]">
              <Crown className="h-3.5 w-3.5" /> Upgrade
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-[#f6f6f6]/95 px-3 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.04)] backdrop-blur-xl">
          <div className="text-right">
            <p className="text-[11px] font-medium text-[#4c4c4c]">{plan === 'PREMIUM' ? 'Premium' : 'Free plan'}</p>
            <p className="text-[11px] text-[#6a6a6a]">{formatUsageLine(usage.current, usage.limit, usage.unlimited)}</p>
          </div>
          <div className="mt-2">
            <AgentActivityBadge isActive={isAgentResponding} label={isAgentResponding ? 'Agent actively executing' : 'Agent standing by'} />
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

      <section ref={listRef} className="relative z-10 max-h-[calc(100vh-340px)] space-y-4 overflow-y-auto pb-3 pr-1">
        {empty ? <div className="px-1 py-6 text-sm text-secondary">Assign a task to activate Kivo. The workspace will track analysis and execution automatically.</div> : null}

        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`max-w-[96%] ${message.role === 'user' ? 'ml-auto' : ''}`}
          >
            {message.role === 'user' ? (
              <div className="ml-auto max-w-[90%] rounded-[18px] border border-black/[0.04] bg-[#f3f3f3] px-3.5 py-2.5 text-[15px] leading-6 text-[#1f1f1f]">
                {message.content}
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

        <AnimatePresence>
          {showThinkingSurface ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              <AgentThinkingSurface statusText={thinkingStatus} steps={derivedExecutionSteps} />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {streamError && !streamError.startsWith('LIMIT_REACHED:') && !streamError.startsWith('AUTH_REQUIRED:') && !streamError.startsWith('PREMIUM_REQUIRED:') ? (
          <div className="rounded-xl border border-black/5 bg-[#f7f7f7] px-3 py-2.5 text-sm text-[#373737]">
            We hit a processing issue, but your conversation is still safe.
            <button type="button" onClick={() => void retryLastPrompt()} className="btn-secondary ml-2 inline-flex items-center gap-1 px-2 py-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : null}
      </section>

      <ChatComposerPremium
        composerRef={composerRef}
        fileInputRef={fileInputRef}
        textareaRef={textareaRef}
        draft={draft}
        notice={composerNotice}
        openPanel={openPanel === 'conversations' ? null : openPanel}
        isVoiceMode={isVoiceMode}
        voiceSupported={voiceSupported}
        isAgentResponding={isAgentResponding}
        isLimitReached={isLimitReached}
        userPresent={Boolean(user)}
        onDraftChange={(value) => {
          if (requireAuth()) return;
          setDraft(value);
          setDraftPrompt(value);
        }}
        onSend={() => void handleSend()}
        onTextareaFocus={() => {
          if (requireAuth()) router.push('/login?next=/chat');
        }}
        onTogglePanel={(panel) => setOpenPanel((prev) => (prev === panel ? null : panel))}
        onToggleVoiceMode={toggleVoiceMode}
        onSpeechToText={startSpeechToText}
        onAttachFile={() => {
          if (!isPremium) {
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
        onNewChat={handleNewChat}
        onViewConversations={() => setOpenPanel('conversations')}
        onClearDraft={() => {
          setDraft('');
          setDraftPrompt('');
          setComposerNotice('Draft cleared.');
          setOpenPanel(null);
        }}
        onOpenPlanInfo={() =>
          setComposerNotice(
            usage.unlimited
              ? `Usage: Unlimited (Dev Mode) • Runs today: ${usage.current} • Plan: ${plan}`
              : `Usage: ${usage.current}/${usage.limit} • Plan: ${plan}`,
          )
        }
        onUpgrade={openUpgrade}
      />

      {isLimitReached && !isUnlimited ? (
        <div className="fixed bottom-[calc(160px+env(safe-area-inset-bottom))] left-1/2 z-20 w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-2xl border border-black/10 bg-[#f6f6f6] px-3 py-2.5 text-xs text-[#444] shadow-[0_8px_18px_rgba(0,0,0,0.05)]">
            You&apos;ve reached your daily limit. Upgrade for higher limits and file tools.
            <button type="button" onClick={openUpgrade} className="ml-2 inline-flex rounded-full border border-black/15 px-2 py-0.5 text-[11px] font-medium">
              Upgrade
            </button>
          </div>
        </div>
      ) : null}

      {showAuthPrompt ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 px-6">
          <div className="w-full max-w-sm rounded-2xl border border-black/10 bg-[#f7f7f7] p-4 shadow-xl">
            <h2 className="text-base font-semibold text-primary">Sign in required</h2>
            <p className="mt-1 text-sm text-secondary">Please log in before sending messages or saving conversations.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-secondary w-full px-3 py-2 text-sm" onClick={() => setShowAuthPrompt(false)}>
                Not now
              </button>
              <button type="button" className="btn-primary w-full px-3 py-2 text-sm" onClick={() => router.push('/login?next=/chat')}>
                Continue to login
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPaywall && !isUnlimited ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 px-4 pb-20 pt-8">
          <div className="w-full max-w-md rounded-[24px] border border-black/10 bg-[#f7f7f7] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.2)]">
            <div className="mb-3 flex items-center gap-2 text-[#2f2f2f]">
              <Crown className="h-5 w-5" />
              <h2 className="text-base font-semibold">Daily limit reached</h2>
            </div>
            <p className="text-sm text-secondary">You&apos;ve used all free runs for today. Upgrade to unlock more daily runs and file attachments.</p>
            <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-sm">
              <p className="font-medium text-primary">Free vs Premium</p>
              <ul className="mt-1 space-y-1 text-secondary">
                <li>• Free: {usage.limit} runs / day</li>
                <li>• Premium: 1000 runs / day</li>
                <li>• Premium: File uploads in chat</li>
              </ul>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-secondary w-full px-3 py-2 text-sm" onClick={() => setShowPaywall(false)}>
                Close
              </button>
              <button type="button" className="btn-primary w-full px-3 py-2 text-sm" onClick={openUpgrade}>
                Upgrade
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
