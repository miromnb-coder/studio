'use client';

import { useSyncExternalStore } from 'react';

export type AgentName = 'Research Agent' | 'Analysis Agent' | 'Memory Agent';
export type AgentStatus = 'idle' | 'running' | 'completed';
export type MessageRole = 'user' | 'assistant' | 'system';
export type HistoryType = 'message' | 'agent' | 'alert' | 'memory' | 'account';
export type AlertType = 'billing' | 'risk' | 'digest';

export type Message = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  agent?: AgentName;
  isStreaming?: boolean;
  error?: string;
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
  status: 'running' | 'completed';
};

type AppState = {
  hydrated: boolean;
  user: UserProfile | null;
  messages: Message[];
  agents: Record<AgentName, Agent>;
  alerts: Alert[];
  history: HistoryEntry[];
  draftPrompt: string;
  activeAgent: AgentName | null;
  isAgentResponding: boolean;
  activeRequestId: string | null;
  streamError: string | null;
  activeSteps: AgentStep[];
};

type AppActions = {
  hydrate: () => void;
  setDraftPrompt: (prompt: string) => void;
  sendMessage: (prompt: string) => Promise<void>;
  retryLastPrompt: () => Promise<void>;
  enqueuePromptAndGoToChat: (prompt: string) => void;
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'resolved' | 'snoozedUntil'>) => void;
  resolveAlert: (alertId: string) => void;
  snoozeAlert: (alertId: string, minutes?: number) => void;
  markAlertFalsePositive: (alertId: string) => void;
  openAlertInChat: (alertId: string, mode?: 'analyze' | 'open') => void;
  setUser: (user: UserProfile) => void;
  updateUserName: (name: string) => void;
  logout: () => void;
};

const STORAGE_KEY = 'nova_operator_store_v4';
const SESSION_DRAFT_KEY = 'nova-operator-chat-draft';

const AGENT_ORDER: AgentName[] = ['Research Agent', 'Analysis Agent', 'Memory Agent'];
const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const nowIso = () => new Date().toISOString();

const defaultAgents = (): Record<AgentName, Agent> => ({
  'Research Agent': { name: 'Research Agent', status: 'idle', lastRun: null, lastTask: null },
  'Analysis Agent': { name: 'Analysis Agent', status: 'idle', lastRun: null, lastTask: null },
  'Memory Agent': { name: 'Memory Agent', status: 'idle', lastRun: null, lastTask: null },
});

const initialState: AppState = {
  hydrated: false,
  user: null,
  messages: [],
  agents: defaultAgents(),
  alerts: [
    {
      id: 'alert-renewal',
      title: 'Subscription renewal due soon',
      description: 'A high-cost annual subscription renews in 3 days.',
      type: 'billing',
      createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
      resolved: false,
      snoozedUntil: null,
    },
    {
      id: 'alert-duplicate',
      title: 'Potential duplicate billing',
      description: 'Two similar charges were detected in the last 48 hours.',
      type: 'risk',
      createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      resolved: false,
      snoozedUntil: null,
    },
  ],
  history: [],
  draftPrompt: '',
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
    messages: state.messages,
    history: state.history,
    alerts: state.alerts,
    agents: state.agents,
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
};

const setState = (updater: (prev: AppState) => AppState) => {
  state = updater(state);
  persist();
  emit();
};

const addHistory = (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
  state = {
    ...state,
    history: [{ id: createId(), createdAt: nowIso(), ...entry }, ...state.history].slice(0, 200),
  };
};

const AGENT_TERMS: Record<AgentName, string[]> = {
  'Research Agent': ['research', 'find', 'latest', 'news', 'trend', 'look up', 'investigate', 'discover'],
  'Analysis Agent': ['compare', 'numbers', 'percent', 'ratio', 'analysis', 'difference', 'forecast', 'optimize'],
  'Memory Agent': ['summarize', 'remember', 'context', 'history', 'recap', 'retain', 'store'],
};

const detectAgent = (input: string): AgentName => {
  const value = input.toLowerCase();
  const scores = AGENT_ORDER.map((name) => ({
    name,
    score: AGENT_TERMS[name].reduce((acc, term) => acc + (value.includes(term) ? 1 : 0), 0),
  }));

  const best = scores.sort((a, b) => b.score - a.score)[0];
  return best.score > 0 ? best.name : 'Research Agent';
};

const getConversationWindow = (messages: Message[]) =>
  messages.slice(-10).map((message) => ({ role: message.role, content: message.content }));

function providerSafeErrorMessage(raw: string): string {
  if (/Groq is selected but not configured/i.test(raw) || /GROQ_API_KEY/i.test(raw)) {
    return 'Groq is not configured yet. Add AI_PROVIDER=groq, GROQ_API_KEY, and optionally GROQ_MODEL on the server, then retry.';
  }

  if (/OPENAI_API_KEY/i.test(raw)) {
    return 'OpenAI key is missing, but this chat can run with Groq. Set AI_PROVIDER=groq with GROQ_API_KEY on the server.';
  }

  return raw;
}

async function streamAssistantResponse(requestId: string, assistantMessageId: string, agent: AgentName) {
  const payload = {
    messages: getConversationWindow(state.messages).filter((message) => message.content.trim()),
    agent,
  };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok || !response.body) {
    const reason = await response.text();
    throw new Error(providerSafeErrorMessage(reason || `Request failed (${response.status})`));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const chunk = line.trim();
      if (!chunk) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(chunk) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (state.activeRequestId !== requestId) return;

      if (event.type === 'step') {
        const label = String(event.label ?? 'Processing…');
        const status: AgentStep['status'] = event.status === 'completed' ? 'completed' : 'running';
        setState((prev) => {
          const existing = prev.activeSteps.find((item) => item.label === label);
          const next = existing
            ? prev.activeSteps.map((item) => (item.label === label ? { ...item, status } : item))
            : [...prev.activeSteps, { id: createId(), label, status }];
          return { ...prev, activeSteps: next };
        });
      }

      if (event.type === 'text-delta') {
        const delta = typeof event.delta === 'string' ? event.delta : '';
        if (!delta) continue;

        setState((prev) => ({
          ...prev,
          messages: prev.messages.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: `${message.content}${delta}` }
              : message,
          ),
        }));
      }

      if (event.type === 'error') {
        const message = typeof event.message === 'string' ? event.message : 'Streaming failed.';
        throw new Error(providerSafeErrorMessage(message));
      }
    }
  }
}

const actions: AppActions = {
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const sessionDraft = window.sessionStorage.getItem(SESSION_DRAFT_KEY) ?? '';

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<AppState>;
        state = {
          ...initialState,
          ...parsed,
          hydrated: true,
          draftPrompt: sessionDraft,
          agents: parsed.agents ?? defaultAgents(),
          alerts: parsed.alerts ?? initialState.alerts,
        };
      } catch {
        state = { ...initialState, hydrated: true, draftPrompt: sessionDraft };
      }
    } else {
      state = { ...initialState, hydrated: true, draftPrompt: sessionDraft };
    }

    emit();
  },

  setDraftPrompt: (prompt) => {
    setState((prev) => ({ ...prev, draftPrompt: prompt }));
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_DRAFT_KEY, prompt);
    }
  },

  sendMessage: async (prompt) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    const agent = detectAgent(cleanPrompt);
    const requestId = createId();
    const userMessage: Message = { id: createId(), role: 'user', content: cleanPrompt, createdAt: nowIso(), agent };
    const assistantMessage: Message = {
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: nowIso(),
      agent,
      isStreaming: true,
    };

    setState((prev) => {
      const nextAgents = { ...prev.agents };
      AGENT_ORDER.forEach((name) => {
        nextAgents[name] = {
          ...nextAgents[name],
          status: name === agent ? 'running' : 'idle',
          ...(name === agent ? { lastTask: cleanPrompt, lastRun: nowIso() } : {}),
        };
      });

      return {
        ...prev,
        draftPrompt: '',
        messages: [...prev.messages, userMessage, assistantMessage],
        activeAgent: agent,
        isAgentResponding: true,
        activeRequestId: requestId,
        streamError: null,
        activeSteps: [],
        agents: nextAgents,
      };
    });

    addHistory({ title: 'User message sent', description: cleanPrompt, type: 'message', prompt: cleanPrompt });
    addHistory({ title: `${agent} task started`, description: cleanPrompt, type: 'agent', prompt: cleanPrompt });
    persist();
    emit();

    try {
      let attempts = 0;
      while (attempts < 2) {
        try {
          await streamAssistantResponse(requestId, assistantMessage.id, agent);
          break;
        } catch (error) {
          attempts += 1;
          const errorMessage = error instanceof Error ? error.message : 'Unknown streaming error.';
          const isConfigError = /GROQ_API_KEY|OPENAI_API_KEY|Unsupported AI_PROVIDER/i.test(errorMessage);
          if (isConfigError || attempts >= 2) throw error;
        }
      }

      setState((prev) => ({
        ...prev,
        activeRequestId: null,
        isAgentResponding: false,
        activeSteps: prev.activeSteps.map((step) => ({ ...step, status: 'completed' })),
        messages: prev.messages.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, isStreaming: false, content: message.content || 'I could not generate a response.' }
            : message,
        ),
        agents: {
          ...prev.agents,
          [agent]: { ...prev.agents[agent], status: 'completed', lastRun: nowIso() },
        },
      }));

      addHistory({ title: `${agent} task completed`, description: cleanPrompt, type: agent === 'Memory Agent' ? 'memory' : 'agent', prompt: cleanPrompt });
      addHistory({
        title: 'Final answer delivered',
        description: `Completed with ${agent}.`,
        type: 'message',
        prompt: cleanPrompt,
      });
      persist();
      emit();
    } catch (error) {
      const message = providerSafeErrorMessage(error instanceof Error ? error.message : 'Unknown streaming error.');

      setState((prev) => ({
        ...prev,
        activeRequestId: null,
        isAgentResponding: false,
        streamError: message,
        activeSteps: prev.activeSteps.map((step) => ({ ...step, status: 'completed' })),
        messages: prev.messages.map((entry) =>
          entry.id === assistantMessage.id
            ? {
                ...entry,
                isStreaming: false,
                error: message,
                content: entry.content || 'I hit an error while streaming. Please retry.',
              }
            : entry,
        ),
        agents: {
          ...prev.agents,
          [agent]: { ...prev.agents[agent], status: 'idle', lastRun: nowIso() },
        },
      }));

      addHistory({ title: `${agent} task failed`, description: message, type: 'agent', prompt: cleanPrompt });
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
    const lastPrompt = [...state.messages].reverse().find((msg) => msg.role === 'user')?.content;
    if (!lastPrompt) return;
    await actions.sendMessage(lastPrompt);
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
      alerts: [{ id: createId(), createdAt: nowIso(), resolved: false, snoozedUntil: null, ...alert }, ...prev.alerts],
    }));
    addHistory({ title: 'Alert created', description: alert.title, type: 'alert' });
    persist();
    emit();
  },

  resolveAlert: (alertId) => {
    setState((prev) => ({ ...prev, alerts: prev.alerts.map((item) => (item.id === alertId ? { ...item, resolved: true } : item)) }));
    addHistory({ title: 'Alert resolved', description: alertId, type: 'alert' });
    persist();
    emit();
  },

  snoozeAlert: (alertId, minutes = 60) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setState((prev) => ({ ...prev, alerts: prev.alerts.map((item) => (item.id === alertId ? { ...item, snoozedUntil: until } : item)) }));
    addHistory({ title: 'Alert snoozed', description: `${alertId} until ${until}`, type: 'alert' });
    persist();
    emit();
  },

  markAlertFalsePositive: (alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) => item.id === alertId ? { ...item, resolved: true, description: `${item.description} (marked false positive)` } : item),
    }));
    addHistory({ title: 'Alert marked false positive', description: alertId, type: 'alert' });
    persist();
    emit();
  },

  openAlertInChat: (alertId, mode = 'open') => {
    const alert = state.alerts.find((item) => item.id === alertId);
    if (!alert) return;
    const prompt = mode === 'analyze'
      ? `Analyze this alert and provide an action plan: ${alert.title}. ${alert.description}`
      : `Open this alert context: ${alert.title}. ${alert.description}`;
    actions.enqueuePromptAndGoToChat(prompt);
  },

  setUser: (user) => {
    setState((prev) => ({ ...prev, user }));
    addHistory({ title: 'User signed in', description: user.email, type: 'account' });
    persist();
    emit();
  },

  updateUserName: (name) => {
    const nextName = name.trim();
    if (!nextName) return;
    setState((prev) => ({ ...prev, user: prev.user ? { ...prev.user, name: nextName } : prev.user }));
  },

  logout: () => {
    setState((prev) => ({ ...prev, user: null }));
    addHistory({ title: 'User logged out', description: 'Session ended on this device', type: 'account' });
    persist();
    emit();
  },
};

export const useAppStore = <T,>(selector: (state: AppState & AppActions) => T): T =>
  useSyncExternalStore(subscribe, () => selector({ ...state, ...actions }), () => selector({ ...state, ...actions }));
