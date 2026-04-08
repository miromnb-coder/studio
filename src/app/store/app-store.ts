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
};

type AppActions = {
  hydrate: () => void;
  setDraftPrompt: (prompt: string) => void;
  sendMessage: (prompt: string) => void;
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

const STORAGE_KEY = 'nova_operator_store_v2';
const SESSION_DRAFT_KEY = 'nova-operator-chat-draft';

const AGENT_ORDER: AgentName[] = ['Research Agent', 'Analysis Agent', 'Memory Agent'];

const createId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const nowIso = () => new Date().toISOString();

const defaultAgents = (): Record<AgentName, Agent> => ({
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

const detectAgent = (input: string): AgentName => {
  const value = input.toLowerCase();
  if (['summarize', 'remember', 'context', 'history', 'recap'].some((term) => value.includes(term))) {
    return 'Memory Agent';
  }
  if (['compare', 'numbers', 'percent', 'ratio', 'analysis', 'difference'].some((term) => value.includes(term))) {
    return 'Analysis Agent';
  }
  if (['research', 'find', 'latest', 'news', 'trend', 'look up'].some((term) => value.includes(term))) {
    return 'Research Agent';
  }
  return 'Research Agent';
};

const assistantTemplate = (agent: AgentName): string => {
  if (agent === 'Research Agent') return `I’m reviewing recent patterns and relevant signals.`;
  if (agent === 'Analysis Agent') return `I’m comparing the data and identifying meaningful differences.`;
  return `I’m summarizing prior context and storing the key points.`;
};

const addHistory = (entry: Omit<HistoryEntry, 'id' | 'createdAt'>) => {
  state = {
    ...state,
    history: [
      {
        id: createId(),
        createdAt: nowIso(),
        ...entry,
      },
      ...state.history,
    ].slice(0, 200),
  };
};

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
          draftPrompt: sessionDraft || state.draftPrompt,
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

  sendMessage: (prompt) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;

    const agent = detectAgent(cleanPrompt);
    const userMessage: Message = {
      id: createId(),
      role: 'user',
      content: cleanPrompt,
      createdAt: nowIso(),
      agent,
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
        messages: [...prev.messages, userMessage],
        activeAgent: agent,
        isAgentResponding: true,
        agents: nextAgents,
      };
    });

    addHistory({
      title: 'Message sent',
      description: cleanPrompt,
      type: 'message',
      prompt: cleanPrompt,
    });
    persist();
    emit();

    window.setTimeout(() => {
      const assistantMessage: Message = {
        id: createId(),
        role: 'assistant',
        content: `${assistantTemplate(agent)}\n\nTask: ${cleanPrompt}`,
        createdAt: nowIso(),
        agent,
      };

      setState((prev) => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        activeAgent: agent,
        isAgentResponding: false,
        agents: {
          ...prev.agents,
          [agent]: {
            ...prev.agents[agent],
            status: 'completed',
            lastRun: nowIso(),
          },
        },
      }));

      addHistory({
        title: `${agent} completed task`,
        description: cleanPrompt,
        type: agent === 'Memory Agent' ? 'memory' : 'agent',
        prompt: cleanPrompt,
      });
      persist();
      emit();
    }, 950);
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
    addHistory({ title: 'Alert created', description: alert.title, type: 'alert' });
    persist();
    emit();
  },

  resolveAlert: (alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) => (item.id === alertId ? { ...item, resolved: true } : item)),
    }));
    addHistory({ title: 'Alert resolved', description: alertId, type: 'alert' });
    persist();
    emit();
  },

  snoozeAlert: (alertId, minutes = 60) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) => (item.id === alertId ? { ...item, snoozedUntil: until } : item)),
    }));
    addHistory({ title: 'Alert snoozed', description: `${alertId} until ${until}`, type: 'alert' });
    persist();
    emit();
  },

  markAlertFalsePositive: (alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((item) =>
        item.id === alertId ? { ...item, resolved: true, description: `${item.description} (marked false positive)` } : item,
      ),
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
    setState((prev) => ({
      ...prev,
      user: prev.user ? { ...prev.user, name: nextName } : prev.user,
    }));
  },

  logout: () => {
    setState((prev) => ({ ...prev, user: null }));
    addHistory({ title: 'User logged out', description: 'Session ended on this device', type: 'account' });
    persist();
    emit();
  },
};

export const useAppStore = <T,>(selector: (state: AppState & AppActions) => T): T => {
  return useSyncExternalStore(
    subscribe,
    () => selector({ ...state, ...actions }),
    () => selector({ ...state, ...actions }),
  );
};
