'use client';

import { useSyncExternalStore } from 'react';
import { trackEvent } from '@/app/lib/analytics-client';
import type {
  AgentResponse,
  AgentResponseMetadata,
} from '@/types/agent-response';
import type { FinanceActionType } from '@/lib/finance/types';
import type {
  Alert,
  AppActions,
  AppState,
  AgentName,
  AgentStep,
  AgentStepLike,
  ChatStreamEvent,
  Conversation,
  HistoryEntry,
  Message,
  UserProfile,
} from './app-store-types';
import {
  AGENT_ORDER,
  DEFAULT_ACTIVE_AGENT,
  DEFAULT_NEW_CHAT_TITLE,
  createConversation as createConversationRecord,
  createId,
  defaultAgents,
  ensureConversationInState,
  initialState,
  nowIso,
  syncActiveConversationView,
} from './app-store-state';
import {
  deriveTitleFromPrompt,
  emitUsageUpdate,
  getConversationWindow,
  normalizeAgentResponse,
  providerSafeErrorMessage,
  sortConversations,
  summarizePreview,
} from './chat/chat-helpers';
import {
  asStepArray,
  deriveActiveStepsFromMetadata,
  mergeAgentMetadata,
  normalizeStepStatus,
} from './chat/chat-steps';
import { streamAssistantResponse } from './chat/chat-stream';

const STORAGE_KEY = 'nova_operator_store_v5';
const LEGACY_STORAGE_KEY = 'nova_operator_store_v4';
const SESSION_DRAFT_KEY = 'nova-operator-chat-draft';

let state: AppState = initialState;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const emit = () => listeners.forEach((listener) => listener());

function persist() {
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
}

export const setState = (updater: (prev: AppState) => AppState) => {
  const next = ensureConversationInState(updater(state));
  state = syncActiveConversationView(next);
  persist();
  emit();
};

export const getState = () => state;

function addHistory(entry: Omit<HistoryEntry, 'id' | 'createdAt'>) {
  state = {
    ...state,
    history: [
      { id: createId(), createdAt: nowIso(), ...entry },
      ...state.history,
    ].slice(0, 200),
  };
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

function migrateState(parsed: Partial<AppState>, sessionDraft: string): AppState {
  const legacyMessages = Array.isArray((parsed as any).messages)
    ? ((parsed as any).messages as Message[])
    : [];

  const rawConversationRecords = Array.isArray(
    (parsed as Record<string, unknown>).conversations,
  )
    ? ((parsed as Record<string, unknown>).conversations as Array<Record<string, unknown>>)
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
        : [createConversationRecord()],
      activeConversationId: activeConversationId ?? createConversationRecord().id,
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
        : conversationList[0]?.id ?? createConversationRecord().id;

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

  const migratedConversation = createConversationRecord(
    legacyMessages.length
      ? deriveTitleFromPrompt(legacyMessages[0]?.content ?? '')
      : DEFAULT_NEW_CHAT_TITLE,
  );

  const migratedConversations = [
    {
      ...migratedConversation,
      messageCount: legacyMessages.length,
      lastMessagePreview: summarizePreview(legacyMessages),
      updatedAt: legacyMessages.at(-1)?.createdAt ?? migratedConversation.updatedAt,
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
      structured: undefined,
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
        messageCountBefore: (state.messageState[conversationId] ?? []).length,
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
          await streamAssistantResponse({
            requestId,
            assistantMessageId: assistantMessage.id,
            conversationId,
            setState,
            getState: () => state,
          });
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
        const conversationMessages = prev.messageState[conversationId] ?? [];

        const nextConversationMessages = conversationMessages.map((message) =>
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
        const conversationMessages = prev.messageState[conversationId] ?? [];

        const nextConversationMessages = conversationMessages.map((entry) =>
          entry.id === assistantMessage.id
            ? {
                ...entry,
                isStreaming: false,
                error: message,
                content: entry.content || '',
                structured: entry.structured,
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

  runFinanceAction: async (sourceMessageId, actionType: FinanceActionType) => {
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
            sourceMessage?.content || `Run finance action: ${actionType}`,
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
                  suggestedActions: [],
                  operatorModules: [],
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
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();

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

  setUser: (user: UserProfile) => {
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
    const conversation = createConversationRecord();

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
          messageCount: (state.messageState[conversationId] || []).length,
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
        : [createConversationRecord()];

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
  selector: (store: AppState & AppActions) => T,
): T =>
  useSyncExternalStore(
    subscribe,
    () => selector({ ...state, ...actions }),
    () => selector({ ...state, ...actions }),
  );
