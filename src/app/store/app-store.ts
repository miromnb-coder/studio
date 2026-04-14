'use client';

import { useSyncExternalStore } from 'react';
import { trackEvent } from '@/app/lib/analytics-client';
import type {
  AgentResponse,
  AgentResponseMetadata,
} from '@/types/agent-response';
import type { FinanceActionType } from '@/lib/finance/types';

export type AgentName =
  | 'Supervisor Agent'
  | 'Research Agent'
  | 'Analysis Agent'
  | 'Memory Agent'
  | 'Response Agent';

export type AgentStatus = 'idle' | 'running' | 'completed';
export type MessageRole = 'user' | 'assistant' | 'system';
export type HistoryType = 'message' | 'agent' | 'alert' | 'memory' | 'account';
export type AlertType = 'billing' | 'risk' | 'digest';
export type MessageAttachmentKind = 'image' | 'file';

export type MessageAttachment = {
  id: string;
  name: string;
  kind: MessageAttachmentKind;
  mimeType: string;
  size: number;
  previewUrl?: string;
};

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: MessageAttachment[];
  agent?: AgentName;
  isStreaming?: boolean;
  error?: string;
  agentMetadata?: AgentResponseMetadata;
};

export type Conversation = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessagePreview: string;
  messageCount: number;
};

export type Agent = {
  name: AgentName;
  status: AgentStatus;
  lastRun: string | null;
  lastTask: string | null;
};

export type Alert = {
  id: string;
  title: string;
  description: string;
  type: AlertType;
  createdAt: string;
  resolved: boolean;
  snoozedUntil: string | null;
};

export type HistoryEntry = {
  id: string;
  title: string;
  description: string;
  type: HistoryType;
  createdAt: string;
  prompt?: string;
};

export type UserProfile = {
  id: string;
  email: string;
  name: string;
};

export type AgentStep = {
  id: string;
  label: string;
  status: 'running' | 'completed' | 'failed';
};

type AppState = {
  hydrated: boolean;
  user: UserProfile | null;
  conversationList: Conversation[];
  activeConversationId: string;
  messageState: Record<string, Message[]>;
  draftState: Record<string, string>;
  messages: Message[];
  draftPrompt: string;
  agents: Record<AgentName, Agent>;
  alerts: Alert[];
  history: HistoryEntry[];
  activeAgent: AgentName | null;
  isAgentResponding: boolean;
  activeRequestId: string | null;
  streamError: string | null;
  activeSteps: AgentStep[];
};

type AppActions = {
  hydrate: () => void;
  setDraftPrompt: (prompt: string) => void;
  sendMessage: (
    prompt: string,
    options?: { attachments?: MessageAttachment[] },
  ) => Promise<void>;
  retryLastPrompt: () => Promise<void>;
  enqueuePromptAndGoToChat: (prompt: string) => void;
  addAlert: (
    alert: Omit<Alert, 'id' | 'createdAt' | 'resolved' | 'snoozedUntil'>,
  ) => void;
  resolveAlert: (alertId: string) => void;
  snoozeAlert: (alertId: string, minutes?: number) => void;
  markAlertFalsePositive: (alertId: string) => void;
  openAlertInChat: (alertId: string, mode?: 'analyze' | 'open') => void;
  setUser: (user: UserProfile) => void;
  clearUser: () => void;
  updateUserName: (name: string) => void;
  logout: () => void;
  createConversation: () => string;
  openConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => void;
  runFinanceAction: (
    sourceMessageId: string,
    actionType: FinanceActionType,
  ) => Promise<{ ok: boolean; errorCode?: string }>;
};

const STORAGE_KEY = 'nova_operator_store_v5';
const LEGACY_STORAGE_KEY = 'nova_operator_store_v4';
const SESSION_DRAFT_KEY = 'nova-operator-chat-draft';

const AGENT_ORDER: AgentName[] = [
  'Supervisor Agent',
  'Research Agent',
  'Analysis Agent',
  'Memory Agent',
  'Response Agent',
];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();
const DEFAULT_NEW_CHAT_TITLE = 'New chat';
const DEFAULT_ACTIVE_AGENT: AgentName = 'Supervisor Agent';

type AgentStepLike = {
  action?: string;
  label?: string;
  status?: string;
  summary?: string;
  error?: string;
};

type AgentStructuredDataLike = {
  route?: { confidence?: number };
  evaluation?: { score?: number; passed?: boolean; issues?: string[] };
  toolResults?: Array<{ tool?: string; ok?: boolean }>;
  memory?: { items?: unknown[] };
};

type ChatStreamEvent =
  | {
      type:
        | 'router_started'
        | 'router_completed'
        | 'planning_started'
        | 'planning_completed'
        | 'memory_started'
        | 'memory_completed'
        | 'tool_started'
        | 'tool_completed';
      stepId?: string;
      label?: string;
      summary?: string;
      tool?: string;
      status?: string;
      error?: string;
      requestId?: string;
    }
  | {
      type: 'answer_delta';
      delta?: string;
      emittedChars?: number;
      requestId?: string;
    }
  | {
      type: 'answer_completed';
      content?: string;
      metadata?: AgentResponseMetadata;
      metrics?: { ttfbMs?: number; completionMs?: number; charCount?: number };
      requestId?: string;
    };

const STREAM_STEP_EVENT_TYPES = new Set<ChatStreamEvent['type']>([
  'router_started',
  'router_completed',
  'planning_started',
  'planning_completed',
  'memory_started',
  'memory_completed',
  'tool_started',
  'tool_completed',
]);

function eventStatusToStepStatus(
  type: ChatStreamEvent['type'],
  explicitStatus?: string,
): 'running' | 'completed' | 'failed' {
  if (explicitStatus === 'failed') return 'failed';
  if (type.endsWith('_completed')) return 'completed';
  return 'running';
}

function upsertLiveStep(
  steps: AgentResponseMetadata['steps'],
  event: Extract<ChatStreamEvent, { stepId?: string; label?: string }>,
): AgentResponseMetadata['steps'] {
  const label = String(event.label || '').trim();
  if (!label) return steps;

  const status = eventStatusToStepStatus(event.type, event.status);
  const findIndex = steps.findIndex((step) => {
    const action = String(step.action || '').trim().toLowerCase();
    return action === label.toLowerCase();
  });

  const nextStep = {
    action: label,
    status,
    summary: event.summary,
    tool: event.tool,
    error: event.error,
  } as const;

  if (findIndex === -1) {
    return [...steps, nextStep];
  }

  return steps.map((step, index) => {
    if (index !== findIndex) return step;
    const existingStatus = normalizeStepStatus(step.status);
    const mergedStatus =
      status === 'failed' || existingStatus === 'failed'
        ? 'failed'
        : status === 'completed' || existingStatus === 'completed'
          ? 'completed'
          : 'running';

    return {
      ...step,
      ...nextStep,
      action: label,
      status: mergedStatus,
      summary: nextStep.summary || step.summary,
      tool: nextStep.tool || step.tool,
      error: nextStep.error || step.error,
    };
  });
}

const defaultAgents = (): Record<AgentName, Agent> => ({
  'Supervisor Agent': {
    name: 'Supervisor Agent',
    status: 'idle',
    lastRun: null,
    lastTask: null,
  },
  'Research Agent': {
    name: 'Research Agent',
    status: 'idle',
    lastRun: null,
    lastTask: null,
  },
  'Analysis Agent': {
    name: 'Analysis Agent',
    status: 'idle',
    lastRun: null,
    lastTask: null,
  },
  'Memory Agent': {
    name: 'Memory Agent',
    status: 'idle',
    lastRun: null,
    lastTask: null,
  },
  'Response Agent': {
    name: 'Response Agent',
    status: 'idle',
    lastRun: null,
    lastTask: null,
  },
});

const createConversation = (title = DEFAULT_NEW_CHAT_TITLE): Conversation => {
  const now = nowIso();

  return {
    id: createId(),
    title,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: '',
    messageCount: 0,
  };
};

const summarizePreview = (messages: Message[]) => {
  const latest = [...messages]
    .reverse()
    .find((message) => message.content.trim());

  if (!latest) return '';
  return latest.content.trim().slice(0, 120);
};

const deriveTitleFromPrompt = (prompt: string) => {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  if (!clean) return DEFAULT_NEW_CHAT_TITLE;

  const stripped = clean.replace(/^[^a-zA-Z0-9]+/, '');
  const firstSentence = stripped.split(/[.!?]\s/)[0] || stripped;
  const trimmed = firstSentence.trim();

  if (!trimmed) return DEFAULT_NEW_CHAT_TITLE;
  if (trimmed.length <= 52) return trimmed;
  return `${trimmed.slice(0, 49).trimEnd()}…`;
};

const sortConversations = (conversations: Conversation[]) =>
  [...conversations].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

const syncActiveConversationView = (next: AppState): AppState => {
  const messages = next.messageState[next.activeConversationId] ?? [];
  const draftPrompt = next.draftState[next.activeConversationId] ?? '';
  return { ...next, messages, draftPrompt };
};

const ensureConversationInState = (prev: AppState): AppState => {
  if (prev.conversationList.length > 0 && prev.activeConversationId) return prev;

  const fallbackConversation = createConversation();

  return {
    ...prev,
    conversationList: [fallbackConversation],
    activeConversationId: fallbackConversation.id,
    messageState: {
      ...prev.messageState,
      [fallbackConversation.id]: [],
    },
    draftState: {
      ...prev.draftState,
      [fallbackConversation.id]: '',
    },
  };
};

const initialConversation = createConversation();

const initialState: AppState = {
  hydrated: false,
  user: null,
  conversationList: [initialConversation],
  activeConversationId: initialConversation.id,
  messageState: { [initialConversation.id]: [] },
  draftState: { [initialConversation.id]: '' },
  messages: [],
  draftPrompt: '',
  agents: defaultAgents(),
  alerts: [],
  history: [],
  activeAgent: null,
  isAgentResponding: false,
  activeRequestId: null,
  streamError: null,
  activeSteps: [],
};

let state: AppState = initialState;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

const persist = () => {
  if (typeof window === 'undefined') return;

  const persistable = {
    user: state.user,
    conversationList: state.conversationList,
    activeConversationId: state.activeConversationId,
    messageState: state.messageState,
    draftState: state.draftState,
    history: state.history,
    alerts: state.alerts,
    agents: state.agents,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
};

const setState = (updater: (prev: AppState) => AppState) => {
  const next = ensureConversationInState(updater(state));
  state = syncActiveConversationView(next);
  persist();
  emit();
};

const addHistory = (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
  state = {
    ...state,
    history: [
      { id: createId(), createdAt: nowIso(), ...entry },
      ...state.history,
    ].slice(0, 200),
  };
};

const getConversationWindow = (messages: Message[]) =>
  messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));

function normalizeStepStatus(
  status: unknown,
): 'running' | 'completed' | 'failed' {
  if (status === 'failed') return 'failed';
  if (status === 'running' || status === 'pending') return 'running';
  return 'completed';
}

function asStepArray(value: unknown): AgentStepLike[] {
  return Array.isArray(value)
    ? value.filter((item): item is AgentStepLike => Boolean(item && typeof item === 'object'))
    : [];
}

function mergeAgentMetadata(
  incoming?: AgentResponseMetadata,
  fallbackSteps?: Array<{ action: string; status: string; summary?: string }>,
): AgentResponseMetadata {
  const steps =
    Array.isArray(incoming?.steps) && incoming.steps.length > 0
      ? incoming.steps
      : fallbackSteps ?? [];

  const structuredData =
    incoming?.structuredData && typeof incoming.structuredData === 'object'
      ? incoming.structuredData
      : {};

  return {
    intent: incoming?.intent ?? 'general',
    plan: incoming?.plan ?? 'No plan provided.',
    steps,
    structuredData,
    suggestedActions: Array.isArray(incoming?.suggestedActions)
      ? incoming.suggestedActions
      : [],
    operatorModules: Array.isArray(incoming?.operatorModules)
      ? incoming.operatorModules
      : [],
    memoryUsed: incoming?.memoryUsed,
    iterationCount: incoming?.iterationCount,
    verificationPassed: incoming?.verificationPassed,
  };
}

function deriveActiveStepsFromMetadata(
  metadata?: AgentResponseMetadata,
  fallback: AgentStep[] = [],
): AgentStep[] {
  const rawSteps = asStepArray(metadata?.steps);

  if (rawSteps.length > 0) {
    return rawSteps.map((step, index) => ({
      id: createId(),
      label: step.action || step.label || `Step ${index + 1}`,
      status: normalizeStepStatus(step.status),
    }));
  }

  return fallback.map((step) => ({
    ...step,
    status: normalizeStepStatus(step.status),
  }));
}

function mapOperatorAlertToUI(alert: Record<string, any>): Alert {
  const status = String(alert.status || 'active');
  const type = String(alert.type || '').includes('billing')
    ? 'billing'
    : String(alert.type || '').includes('risk')
      ? 'risk'
      : 'digest';

  return {
    id: String(alert.id || createId()),
    title: String(alert.title || 'Operator alert'),
    description: String(
      alert.summary || alert.suggested_action || 'Review this item.',
    ),
    type,
    createdAt: String(alert.created_at || nowIso()),
    resolved: status !== 'active',
    snoozedUntil: null,
  };
}

async function fetchServerAlerts() {
  const response = await fetch('/api/operator/alerts?include=all');
  if (!response.ok) return [];

  const data = (await response.json().catch(() => ({}))) as {
    alerts?: Array<Record<string, any>>;
  };

  return Array.isArray(data.alerts)
    ? data.alerts.map(mapOperatorAlertToUI)
    : [];
}

function normalizeAgentResponse(result: Partial<AgentResponse>): AgentResponse {
  const metadata = result.metadata;

  return {
    reply: typeof result.reply === 'string' ? result.reply : '',
    metadata: mergeAgentMetadata(metadata),
  };
}

function providerSafeErrorMessage(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  if (raw.startsWith('LIMIT_REACHED:')) return raw;
  if (raw.startsWith('AUTH_REQUIRED:')) return raw;
  if (raw.startsWith('PREMIUM_REQUIRED:')) return raw;

  console.error('Kivo chat error:', raw);
  return 'I ran into an issue, but here’s what I could analyze so far.';
}

function emitUsageUpdate(payload: {
  usage?: {
    current: number;
    limit: number;
    remaining: number;
    unlimited?: boolean;
    unlimitedReason?: 'dev' | 'admin' | null;
  };
  plan?: string;
}) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('kivo-usage-updated', {
      detail: {
        usage: payload.usage,
        plan: payload.plan === 'PREMIUM' ? 'PREMIUM' : 'FREE',
      },
    }),
  );
}

async function streamAssistantResponse(
  requestId: string,
  assistantMessageId: string,
  conversationId: string,
) {
  const conversationMessages = state.messageState[conversationId] ?? [];

  const payload = {
    messages: getConversationWindow(conversationMessages).filter((message) =>
      message.content.trim(),
    ),
    userId: state.user?.id || 'system_anonymous',
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await response.json().catch(() => null);
    const errorCode = reason?.error;

    if (errorCode === 'LIMIT_REACHED') {
      if (reason?.usage) {
        emitUsageUpdate({
          usage: {
            current:
              typeof reason.usage.current === 'number'
                ? reason.usage.current
                : 0,
            limit:
              typeof reason.usage.limit === 'number'
                ? reason.usage.limit
                : 10,
            remaining:
              typeof reason.usage.remaining === 'number'
                ? reason.usage.remaining
                : 0,
            unlimited: Boolean(reason.usage.unlimited),
            unlimitedReason:
              reason.usage.unlimitedReason === 'dev' ||
              reason.usage.unlimitedReason === 'admin'
                ? reason.usage.unlimitedReason
                : null,
          },
          plan: reason?.plan,
        });
      }

      throw new Error(`LIMIT_REACHED:${JSON.stringify(reason?.usage ?? {})}`);
    }

    if (errorCode === 'AUTH_REQUIRED') {
      throw new Error('AUTH_REQUIRED:Please sign in to use chat.');
    }

    throw new Error(
      providerSafeErrorMessage(
        reason?.message || `Request failed (${response.status})`,
      ),
    );
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Missing streaming body.');

  const decoder = new TextDecoder();
  let buffer = '';
  let streamedText = '';
  let firstTokenMarked = false;
  let streamComplete = false;
  let rafPending = false;
  let bufferedDelta = '';
  const streamStartedAt = Date.now();

  const flushDelta = () => {
    if (!bufferedDelta) return;

    const delta = bufferedDelta;
    bufferedDelta = '';

    setState((prev) => {
      const messages = prev.messageState[conversationId] ?? [];

      return {
        ...prev,
        messageState: {
          ...prev.messageState,
          [conversationId]: messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: (message.content || '') + delta,
                }
              : message,
          ),
        },
      };
    });
  };

  const queueDeltaFlush = () => {
    if (rafPending) return;

    rafPending = true;
    requestAnimationFrame(() => {
      flushDelta();
      rafPending = false;
    });
  };

  const handleStreamEvent = (event: ChatStreamEvent) => {
    if (STREAM_STEP_EVENT_TYPES.has(event.type)) {
      const label = String(event.label || '').trim();
      if (!label) return;

      trackEvent('chat_phase_transition', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: { phase: event.type, label },
      });

      setState((prev) => {
        const messages = prev.messageState[conversationId] ?? [];
        const assistantMessage = messages.find(
          (message) => message.id === assistantMessageId,
        );
        const existingMetadata = assistantMessage?.agentMetadata;
        const existingSteps = Array.isArray(existingMetadata?.steps)
          ? existingMetadata.steps
          : [];
        const nextSteps = upsertLiveStep(existingSteps, event);

        return {
          ...prev,
          activeSteps: deriveActiveStepsFromMetadata(
            { ...(existingMetadata ?? mergeAgentMetadata()), steps: nextSteps },
            prev.activeSteps,
          ),
          messageState: {
            ...prev.messageState,
            [conversationId]: messages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    agentMetadata: {
                      ...mergeAgentMetadata(message.agentMetadata),
                      steps: nextSteps,
                    },
                  }
                : message,
            ),
          },
        };
      });
      return;
    }

    if (event.type === 'answer_delta' && event.delta) {
      streamedText += event.delta;
      bufferedDelta += event.delta;
      queueDeltaFlush();

      if (!firstTokenMarked) {
        firstTokenMarked = true;

        trackEvent('chat_stream_first_token', {
          conversationId,
          messageId: assistantMessageId,
          requestId,
          properties: { ttfbMs: Date.now() - streamStartedAt },
        });
      }

      return;
    }

    if (event.type === 'answer_completed') {
      flushDelta();
      streamComplete = true;

      setState((prev) => {
        const messages = prev.messageState[conversationId] ?? [];
        const content =
          event.content || streamedText || 'I could not generate a response.';

        const inFlightSteps =
          messages.find((message) => message.id === assistantMessageId)
            ?.agentMetadata?.steps ?? [];
        const fallbackSteps = inFlightSteps.map((step) => ({
          action: step.action,
          status: step.status === 'running' ? 'completed' : step.status,
          summary: step.summary,
        }));

        const mergedMetadata = mergeAgentMetadata(
          event.metadata,
          fallbackSteps,
        );

        return {
          ...prev,
          activeAgent: DEFAULT_ACTIVE_AGENT,
          activeSteps: deriveActiveStepsFromMetadata(
            mergedMetadata,
            prev.activeSteps,
          ),
          messageState: {
            ...prev.messageState,
            [conversationId]: messages.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content,
                    agentMetadata: mergedMetadata,
                  }
                : message,
            ),
          },
        };
      });

      trackEvent('chat_stream_completed', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: {
          completionMs:
            event.metrics?.completionMs ?? Date.now() - streamStartedAt,
          chars: event.metrics?.charCount ?? streamedText.length,
        },
      });
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;
      const parsed = JSON.parse(line) as ChatStreamEvent;
      handleStreamEvent(parsed);
    }
  }

  if (!streamComplete) {
    trackEvent('chat_stream_interrupted', {
      conversationId,
      messageId: assistantMessageId,
      requestId,
      properties: {
        chars: streamedText.length,
      },
    });

    throw new Error('Streaming interrupted before completion.');
  }

  setState((prev) => {
    const messages = prev.messageState[conversationId] ?? [];
    const nextConversationMessages = messages;

    return {
      ...prev,
      messageState: {
        ...prev.messageState,
        [conversationId]: nextConversationMessages,
      },
      conversationList: sortConversations(
        prev.conversationList.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: nowIso(),
                lastMessagePreview: summarizePreview(nextConversationMessages),
                messageCount: nextConversationMessages.length,
              }
            : conversation,
        ),
      ),
    };
  });
}

function migrateState(parsed: Partial<AppState>, sessionDraft: string): AppState {
  const legacyMessages = Array.isArray(parsed.messages) ? parsed.messages : [];
  const rawConversationRecords = Array.isArray(
    (parsed as Record<string, unknown>).conversations,
  )
    ? ((parsed as Record<string, unknown>)
        .conversations as Array<Record<string, unknown>>)
    : [];

  const hasV5State =
    Array.isArray(parsed.conversationList) &&
    parsed.messageState &&
    typeof parsed.messageState === 'object';

  if (hasV5State) {
    const conversationList = parsed.conversationList!.map((conversation) => ({
      ...conversation,
      title: conversation.title?.trim() || DEFAULT_NEW_CHAT_TITLE,
      lastMessagePreview: conversation.lastMessagePreview ?? '',
      messageCount:
        typeof conversation.messageCount === 'number'
          ? conversation.messageCount
          : 0,
    }));

    const activeConversationId =
      parsed.activeConversationId &&
      conversationList.some((item) => item.id === parsed.activeConversationId)
        ? parsed.activeConversationId
        : conversationList[0]?.id;

    const next: AppState = {
      ...initialState,
      ...parsed,
      hydrated: true,
      agents: parsed.agents ?? defaultAgents(),
      alerts: parsed.alerts ?? initialState.alerts,
      conversationList: conversationList.length
        ? sortConversations(conversationList)
        : [createConversation()],
      activeConversationId:
        activeConversationId ?? createConversation().id,
      messageState: parsed.messageState ?? {},
      draftState: parsed.draftState ?? {},
      messages: [],
      draftPrompt: '',
    };

    if (sessionDraft.trim()) {
      next.draftState[next.activeConversationId] = sessionDraft;
    }

    return syncActiveConversationView(ensureConversationInState(next));
  }

  if (rawConversationRecords.length) {
    const hydratedConversations = rawConversationRecords.map((record) => {
      const messages = Array.isArray(record.messages)
        ? (record.messages as Message[])
        : [];

      const id =
        typeof record.id === 'string' && record.id.trim()
          ? record.id
          : createId();

      const createdAt =
        typeof record.createdAt === 'string' && record.createdAt
          ? record.createdAt
          : nowIso();

      const updatedAt =
        typeof record.updatedAt === 'string' && record.updatedAt
          ? record.updatedAt
          : messages.at(-1)?.createdAt ?? createdAt;

      const conversation: Conversation = {
        id,
        title:
          typeof record.title === 'string' && record.title.trim()
            ? record.title.trim()
            : deriveTitleFromPrompt(
                messages.find((message) => message.role === 'user')?.content ??
                  '',
              ),
        createdAt,
        updatedAt,
        lastMessagePreview: summarizePreview(messages),
        messageCount: messages.length,
      };

      return { conversation, messages };
    });

    const conversationList = sortConversations(
      hydratedConversations.map((entry) => entry.conversation),
    );

    const messageState =
      hydratedConversations.reduce<Record<string, Message[]>>((acc, entry) => {
        acc[entry.conversation.id] = entry.messages;
        return acc;
      }, {});

    const activeConversationId =
      typeof parsed.activeConversationId === 'string' &&
      conversationList.some((item) => item.id === parsed.activeConversationId)
        ? parsed.activeConversationId
        : conversationList[0]?.id ?? createConversation().id;

    const migrated: AppState = {
      ...initialState,
      ...parsed,
      hydrated: true,
      agents: parsed.agents ?? defaultAgents(),
      alerts: parsed.alerts ?? initialState.alerts,
      conversationList,
      activeConversationId,
      messageState,
      draftState: { [activeConversationId]: sessionDraft },
      messages: [],
      draftPrompt: '',
    };

    return syncActiveConversationView(ensureConversationInState(migrated));
  }

  const migratedConversation = createConversation(
    legacyMessages.length
      ? deriveTitleFromPrompt(legacyMessages[0]?.content ?? '')
      : DEFAULT_NEW_CHAT_TITLE,
  );

  const migratedConversations = [
    {
      ...migratedConversation,
      messageCount: legacyMessages.length,
      lastMessagePreview: summarizePreview(legacyMessages),
      updatedAt:
        legacyMessages.at(-1)?.createdAt ?? migratedConversation.updatedAt,
    },
  ];

  const migrated: AppState = {
    ...initialState,
    ...parsed,
    hydrated: true,
    agents: parsed.agents ?? defaultAgents(),
    alerts: parsed.alerts ?? initialState.alerts,
    conversationList: migratedConversations,
    activeConversationId: migratedConversation.id,
    messageState: { [migratedConversation.id]: legacyMessages },
    draftState: { [migratedConversation.id]: sessionDraft },
    messages: [],
    draftPrompt: '',
  };

  return syncActiveConversationView(ensureConversationInState(migrated));
}

const actions: AppActions = {
  hydrate: () => {
    if (typeof window === 'undefined') return;

    const raw =
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY);

    const sessionDraft =
      window.sessionStorage.getItem(SESSION_DRAFT_KEY) ?? '';

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        state = migrateState(parsed, sessionDraft);
      } catch {
        state = syncActiveConversationView({
          ...initialState,
          hydrated: true,
        });
      }
    } else {
      state = syncActiveConversationView({
        ...initialState,
        hydrated: true,
      });

      if (sessionDraft.trim()) {
        state.draftState[state.activeConversationId] = sessionDraft;
        state = syncActiveConversationView(state);
      }
    }

    persist();
    emit();

    if (state.user?.id) {
      fetchServerAlerts()
        .then((alerts) => {
          setState((prev) => ({ ...prev, alerts }));
        })
        .catch(() => {});
    }
  },

  setDraftPrompt: (prompt) => {
    setState((prev) => ({
      ...prev,
      draftState: {
        ...prev.draftState,
        [prev.activeConversationId]: prompt,
      },
    }));

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_DRAFT_KEY, prompt);
    }
  },

  sendMessage: async (prompt, options) => {
    const cleanPrompt = prompt.trim();
    const attachments = options?.attachments?.length
      ? options.attachments
      : undefined;

    if (!cleanPrompt && !attachments?.length) return;

    if (!state.user?.id) {
      setState((prev) => ({
        ...prev,
        streamError: 'AUTH_REQUIRED:Please sign in to continue.',
      }));
      return;
    }

    const conversationId = state.activeConversationId;
    const agent: AgentName = DEFAULT_ACTIVE_AGENT;
    const requestId = createId();
    const promptLabel = cleanPrompt || 'Sent attachment';

    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: cleanPrompt,
      createdAt: nowIso(),
      agent,
      attachments,
    };

    const assistantMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: nowIso(),
      agent,
      isStreaming: true,
    };

    trackEvent('chat_message_send', {
      conversationId,
      messageId: userMessage.id,
      requestId,
      properties: {
        promptLength: cleanPrompt.length,
        attachmentCount: attachments?.length ?? 0,
        messageCountBefore:
          (state.messageState[conversationId] ?? []).length,
      },
    });

    setState((prev) => {
      const currentMessages = prev.messageState[conversationId] ?? [];
      const nextConversationMessages = [
        ...currentMessages,
        userMessage,
        assistantMessage,
      ];

      const nextAgents = { ...prev.agents };

      AGENT_ORDER.forEach((name) => {
        nextAgents[name] = {
          ...nextAgents[name],
          status: name === agent ? 'running' : 'idle',
          ...(name === agent
            ? { lastTask: promptLabel, lastRun: nowIso() }
            : {}),
        };
      });

      return {
        ...prev,
        draftState: {
          ...prev.draftState,
          [conversationId]: '',
        },
        messageState: {
          ...prev.messageState,
          [conversationId]: nextConversationMessages,
        },
        conversationList: sortConversations(
          prev.conversationList.map((conversation) => {
            if (conversation.id !== conversationId) return conversation;

            const shouldRetitle =
              cleanPrompt &&
              (conversation.messageCount === 0 ||
                conversation.title === DEFAULT_NEW_CHAT_TITLE);

            return {
              ...conversation,
              title: shouldRetitle
                ? deriveTitleFromPrompt(cleanPrompt)
                : conversation.title,
              updatedAt: nowIso(),
              lastMessagePreview: summarizePreview(nextConversationMessages),
              messageCount: nextConversationMessages.length,
            };
          }),
        ),
        activeAgent: agent,
        isAgentResponding: true,
        activeRequestId: requestId,
        streamError: null,
        activeSteps: [],
        agents: nextAgents,
      };
    });

    addHistory({
      title: 'User message sent',
      description: promptLabel,
      type: 'message',
      prompt: cleanPrompt || undefined,
    });

    addHistory({
      title: `${agent} task started`,
      description: promptLabel,
      type: 'agent',
      prompt: cleanPrompt || undefined,
    });

    persist();
    emit();

    try {
      let attempts = 0;

      while (attempts < 2) {
        try {
          await streamAssistantResponse(
            requestId,
            assistantMessage.id,
            conversationId,
          );
          break;
        } catch (error) {
          attempts += 1;

          const errorMessage =
            error instanceof Error
              ? error.message
              : 'Unknown streaming error.';

          const isConfigError =
            /GROQ_API_KEY|OPENAI_API_KEY|AI_MODEL|GROQ_MODEL|OPENAI_MODEL|Unsupported AI_PROVIDER/i.test(
              errorMessage,
            );

          if (isConfigError || attempts >= 2) throw error;
        }
      }

      setState((prev) => {
        const conversationMessages =
          prev.messageState[conversationId] ?? [];

        const nextConversationMessages = conversationMessages.map(
          (message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  isStreaming: false,
                  content:
                    message.content || 'I could not generate a response.',
                }
              : message,
        );

        return {
          ...prev,
          activeRequestId: null,
          isAgentResponding: false,
          activeSteps: prev.activeSteps.map((step) => ({
            ...step,
            status: 'completed',
          })),
          messageState: {
            ...prev.messageState,
            [conversationId]: nextConversationMessages,
          },
          conversationList: sortConversations(
            prev.conversationList.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: nowIso(),
                    lastMessagePreview: summarizePreview(
                      nextConversationMessages,
                    ),
                    messageCount: nextConversationMessages.length,
                  }
                : conversation,
            ),
          ),
          agents: {
            ...prev.agents,
            [agent]: {
              ...prev.agents[agent],
              status: 'completed',
              lastRun: nowIso(),
            },
          },
        };
      });

      addHistory({
        title: `${agent} task completed`,
        description: promptLabel,
        type: 'agent',
        prompt: cleanPrompt || undefined,
      });

      trackEvent('chat_message_success', {
        conversationId,
        messageId: assistantMessage.id,
        requestId,
        properties: { attempts },
      });

      addHistory({
        title: 'Final answer delivered',
        description: `Completed with ${agent}.`,
        type: 'message',
        prompt: cleanPrompt,
      });

      persist();
      emit();
    } catch (error) {
      const rawMessage =
        error instanceof Error ? error.message : 'Unknown streaming error.';

      trackEvent('chat_message_failure', {
        conversationId,
        messageId: assistantMessage.id,
        requestId,
        properties: { error: rawMessage },
      });

      const message = providerSafeErrorMessage(rawMessage);

      setState((prev) => {
        const conversationMessages =
          prev.messageState[conversationId] ?? [];

        const nextConversationMessages = conversationMessages.map((entry) =>
          entry.id === assistantMessage.id
            ? {
                ...entry,
                isStreaming: false,
                error: message,
                content: entry.content || '',
              }
            : entry,
        );

        return {
          ...prev,
          activeRequestId: null,
          isAgentResponding: false,
          streamError: message,
          activeSteps: prev.activeSteps.map((step) => ({
            ...step,
            status: 'completed',
          })),
          messageState: {
            ...prev.messageState,
            [conversationId]: nextConversationMessages,
          },
          conversationList: sortConversations(
            prev.conversationList.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: nowIso(),
                    lastMessagePreview: summarizePreview(
                      nextConversationMessages,
                    ),
                    messageCount: nextConversationMessages.length,
                  }
                : conversation,
            ),
          ),
          agents: {
            ...prev.agents,
            [agent]: {
              ...prev.agents[agent],
              status: 'idle',
              lastRun: nowIso(),
            },
          },
        };
      });

      addHistory({
        title: `${agent} task failed`,
        description: message,
        type: 'agent',
        prompt: cleanPrompt,
      });

      actions.addAlert({
        title: `${agent} needs attention`,
        description: message,
        type: 'risk',
      });

      persist();
      emit();
    }
  },

  retryLastPrompt: async () => {
    const lastPrompt = [...state.messages]
      .reverse()
      .find((msg) => msg.role === 'user')?.content;

    trackEvent('chat_retry', {
      conversationId: state.activeConversationId,
      properties: { hasPrompt: Boolean(lastPrompt) },
    });

    if (!lastPrompt) return;
    await actions.sendMessage(lastPrompt);
  },

  runFinanceAction: async (sourceMessageId, actionType) => {
    if (!state.user?.id) {
      setState((prev) => ({
        ...prev,
        streamError: 'AUTH_REQUIRED:Please sign in to continue.',
      }));
      return { ok: false, errorCode: 'AUTH_REQUIRED' };
    }

    const conversationId = state.activeConversationId;
    const conversationMessages = state.messageState[conversationId] ?? [];
    const sourceMessage = conversationMessages.find(
      (message) => message.id === sourceMessageId,
    );

    const history = getConversationWindow(conversationMessages).filter(
      (message) => message.content.trim(),
    );

    const pendingMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: nowIso(),
      agent: DEFAULT_ACTIVE_AGENT,
      isStreaming: true,
    };

    setState((prev) => ({
      ...prev,
      isAgentResponding: true,
      activeRequestId: pendingMessage.id,
      streamError: null,
      messageState: {
        ...prev.messageState,
        [conversationId]: [
          ...(prev.messageState[conversationId] ?? []),
          pendingMessage,
        ],
      },
    }));

    try {
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input:
            sourceMessage?.content ||
            `Run finance action: ${actionType}`,
          history,
          userId: state.user.id,
          actionType,
          contextMessageId: sourceMessageId,
        }),
      });

      const reason = await response.json().catch(() => null);

      if (!response.ok) {
        const errorCode = reason?.error;

        if (errorCode === 'PREMIUM_REQUIRED') {
          throw new Error(
            'PREMIUM_REQUIRED:Upgrade required to run finance actions.',
          );
        }

        throw new Error(
          reason?.message || `Action request failed (${response.status})`,
        );
      }

      const result = normalizeAgentResponse(reason as Partial<AgentResponse>);
      const reasonWithUsage = reason as Partial<AgentResponse> & {
        usage?: {
          current?: number;
          limit?: number;
          remaining?: number;
          unlimited?: boolean;
          unlimitedReason?: 'dev' | 'admin' | null;
        };
        plan?: string;
      };

      if (
        typeof reasonWithUsage.usage?.current === 'number' &&
        typeof reasonWithUsage.usage?.limit === 'number' &&
        typeof reasonWithUsage.usage?.remaining === 'number'
      ) {
        emitUsageUpdate({
          usage: {
            current: reasonWithUsage.usage.current,
            limit: reasonWithUsage.usage.limit,
            remaining: reasonWithUsage.usage.remaining,
            unlimited: Boolean(reasonWithUsage.usage.unlimited),
            unlimitedReason:
              reasonWithUsage.usage.unlimitedReason === 'dev' ||
              reasonWithUsage.usage.unlimitedReason === 'admin'
                ? reasonWithUsage.usage.unlimitedReason
                : null,
          },
          plan: reasonWithUsage.plan,
        });
      }

      setState((prev) => {
        const nextConversationMessages = (
          prev.messageState[conversationId] ?? []
        ).map((message) =>
          message.id === pendingMessage.id
            ? {
                ...message,
                isStreaming: false,
                content:
                  result.reply || 'Action completed with partial result.',
                agentMetadata: result.metadata,
              }
            : message,
        );

        return {
          ...prev,
          activeRequestId: null,
          isAgentResponding: false,
          messageState: {
            ...prev.messageState,
            [conversationId]: nextConversationMessages,
          },
          conversationList: sortConversations(
            prev.conversationList.map((conversation) =>
              conversation.id === conversationId
                ? {
                    ...conversation,
                    updatedAt: nowIso(),
                    lastMessagePreview: summarizePreview(
                      nextConversationMessages,
                    ),
                    messageCount: nextConversationMessages.length,
                  }
                : conversation,
            ),
          ),
        };
      });

      return { ok: true };
    } catch (error) {
      const message = providerSafeErrorMessage(
        error instanceof Error ? error.message : 'Unknown action error.',
      );

      setState((prev) => {
        const nextConversationMessages = (
          prev.messageState[conversationId] ?? []
        ).map((entry) =>
          entry.id === pendingMessage.id
            ? {
                ...entry,
                isStreaming: false,
                error: message,
                content: message.startsWith('PREMIUM_REQUIRED:')
                  ? 'Upgrade to Premium to run this finance action.'
                  : 'We couldn’t complete everything, but here’s what we found.',
                agentMetadata: {
                  intent: 'finance',
                  plan: 'Partial fallback',
                  steps: [],
                  structuredData: {
                    actionResult: {
                      type: 'error',
                      title: 'Partial result',
                      summary:
                        'We couldn’t complete everything, but here’s what we found.',
                      data: {},
                    },
                  },
                } as AgentResponseMetadata,
              }
            : entry,
        );

        return {
          ...prev,
          activeRequestId: null,
          isAgentResponding: false,
          streamError: message,
          messageState: {
            ...prev.messageState,
            [conversationId]: nextConversationMessages,
          },
        };
      });

      if (message.startsWith('PREMIUM_REQUIRED:')) {
        return { ok: false, errorCode: 'PREMIUM_REQUIRED' };
      }

      return { ok: false, errorCode: 'ACTION_FAILED' };
    }
  },

  enqueuePromptAndGoToChat: (prompt) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || typeof window === 'undefined') return;
    actions.setDraftPrompt(cleanPrompt);
    window.location.href = '/chat?autosend=1';
  },

  addAlert: (alert) => {
    setState((prev) => ({
      ...prev,
      alerts: [
        {
          id: createId(),
          createdAt: nowIso(),
          resolved: false,
          snoozedUntil: null,
          ...alert,
        },
        ...prev.alerts,
      ],
    }));

    addHistory({
      title: 'Local alert created',
      description: alert.title,
      type: 'alert',
    });

    persist();
    emit();
  },

  resolveAlert: (alertId) => {
    fetch(`/api/operator/alerts/${alertId}/complete`, { method: 'POST' })
      .then(async () => {
        const alerts = await fetchServerAlerts();
        if (!alerts.length) return;

        setState((prev) => ({ ...prev, alerts }));

        addHistory({
          title: 'Alert resolved',
          description: alertId,
          type: 'alert',
        });
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          alerts: prev.alerts.map((item) =>
            item.id === alertId ? { ...item, resolved: true } : item,
          ),
        }));
      });
  },

  snoozeAlert: (alertId, minutes = 60) => {
    const until = new Date(
      Date.now() + minutes * 60 * 1000,
    ).toISOString();

    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) =>
        item.id === alertId ? { ...item, snoozedUntil: until } : item,
      ),
    }));

    addHistory({
      title: 'Alert snoozed',
      description: `${alertId} until ${until}`,
      type: 'alert',
    });

    persist();
    emit();
  },

  markAlertFalsePositive: (alertId) => {
    fetch(`/api/operator/alerts/${alertId}/dismiss`, {
      method: 'POST',
    })
      .then(async () => {
        const alerts = await fetchServerAlerts();
        if (!alerts.length) return;

        setState((prev) => ({ ...prev, alerts }));

        addHistory({
          title: 'Alert marked false positive',
          description: alertId,
          type: 'alert',
        });
      })
      .catch(() => {
        setState((prev) => ({
          ...prev,
          alerts: prev.alerts.map((item) =>
            item.id === alertId
              ? {
                  ...item,
                  resolved: true,
                  description: `${item.description} (marked false positive)`,
                }
              : item,
          ),
        }));
      });
  },

  openAlertInChat: (alertId, mode = 'open') => {
    const alert = state.alerts.find((item) => item.id === alertId);
    if (!alert) return;

    const prompt =
      mode === 'analyze'
        ? `Analyze this alert and provide an action plan: ${alert.title}. ${alert.description}`
        : `Open this alert context: ${alert.title}. ${alert.description}`;

    actions.enqueuePromptAndGoToChat(prompt);
  },

  setUser: (user) => {
    setState((prev) => ({ ...prev, user }));

    addHistory({
      title: 'User signed in',
      description: user.email,
      type: 'account',
    });

    fetchServerAlerts()
      .then((alerts) => {
        setState((prev) => ({ ...prev, alerts }));
      })
      .catch(() => {});

    persist();
    emit();
  },

  clearUser: () => {
    setState((prev) => ({ ...prev, user: null }));
    persist();
    emit();
  },

  updateUserName: (name) => {
    const nextName = name.trim();
    if (!nextName) return;

    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, name: nextName } : prev.user,
    }));
  },

  logout: () => {
    actions.clearUser();

    addHistory({
      title: 'User logged out',
      description: 'Session ended on this device',
      type: 'account',
    });
  },

  createConversation: () => {
    const conversation = createConversation();

    setState((prev) => ({
      ...prev,
      activeConversationId: conversation.id,
      conversationList: sortConversations([
        conversation,
        ...prev.conversationList,
      ]),
      messageState: {
        ...prev.messageState,
        [conversation.id]: [],
      },
      draftState: {
        ...prev.draftState,
        [conversation.id]: '',
      },
      streamError: null,
      activeRequestId: null,
      isAgentResponding: false,
    }));

    return conversation.id;
  },

  openConversation: (conversationId) => {
    const isReopen = state.activeConversationId !== conversationId;
    if (!state.messageState[conversationId]) return;

    trackEvent(
      isReopen ? 'chat_conversation_reopened' : 'chat_conversation_opened',
      {
        conversationId,
        properties: {
          messageCount:
            (state.messageState[conversationId] || []).length,
        },
      },
    );

    setState((prev) => {
      if (
        !prev.conversationList.some(
          (conversation) => conversation.id === conversationId,
        )
      ) {
        return prev;
      }

      return {
        ...prev,
        activeConversationId: conversationId,
        streamError: null,
      };
    });
  },

  deleteConversation: (conversationId) => {
    setState((prev) => {
      const remaining = prev.conversationList.filter(
        (conversation) => conversation.id !== conversationId,
      );

      const nextConversationList = remaining.length
        ? remaining
        : [createConversation()];

      const nextActiveConversationId =
        prev.activeConversationId === conversationId
          ? sortConversations(nextConversationList)[0].id
          : prev.activeConversationId;

      const nextMessageState = { ...prev.messageState };
      const nextDraftState = { ...prev.draftState };

      delete nextMessageState[conversationId];
      delete nextDraftState[conversationId];

      if (!nextMessageState[nextActiveConversationId]) {
        nextMessageState[nextActiveConversationId] = [];
      }

      if (!nextDraftState[nextActiveConversationId]) {
        nextDraftState[nextActiveConversationId] = '';
      }

      return {
        ...prev,
        conversationList: sortConversations(nextConversationList),
        activeConversationId: nextActiveConversationId,
        messageState: nextMessageState,
        draftState: nextDraftState,
        streamError: null,
        activeRequestId: null,
        isAgentResponding:
          prev.activeConversationId === conversationId
            ? false
            : prev.isAgentResponding,
      };
    });
  },

  renameConversation: (conversationId, title) => {
    const nextTitle = title.trim();
    if (!nextTitle) return;

    setState((prev) => ({
      ...prev,
      conversationList: prev.conversationList.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: nextTitle,
              updatedAt: nowIso(),
            }
          : conversation,
      ),
    }));
  },
};

export const useAppStore = <T,>(
  selector: (state: AppState & AppActions) => T,
): T =>
  useSyncExternalStore(
    subscribe,
    () => selector({ ...state, ...actions }),
    () => selector({ ...state, ...actions }),
  );
