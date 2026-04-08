'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'miro_app_store_v1';
const SCHEMA_VERSION = 1;

type ID = string;

type MessageSource = 'chat' | 'home' | 'money' | 'agents';
type AgentStatus = 'idle' | 'running' | 'updating';
type PageKey = 'home' | 'chat' | 'agents' | 'alerts' | 'history';
type ActivityFilter = 'all' | 'research' | 'memory';

type Message = {
  id: ID;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  source: MessageSource;
};

type Agent = {
  id: ID;
  name: string;
  subtitle: string;
  accent: string;
  iconKey: 'research' | 'analysis' | 'memory';
  status: AgentStatus;
};

type Alert = {
  id: ID;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  resolved: boolean;
  createdAt: string;
  resolvedAt?: string;
};

type HistoryEvent = {
  id: ID;
  type: 'message' | 'agent' | 'alert' | 'system';
  title: string;
  context: string;
  createdAt: string;
  relatedId?: ID;
};

type UserAccount = {
  id: ID;
  name: string;
  plan: 'free' | 'pro';
  email: string;
};

type OnboardingState = {
  completed: boolean;
  step: number;
};

type UISlice = {
  currentPage: PageKey;
  promptInput: string;
  activityFilter: ActivityFilter;
  systemExpanded: boolean;
  tryPromptIndex: number;
  onboarding: OnboardingState;
};

type AppState = {
  schemaVersion: number;
  hydrated: boolean;
  messages: {
    byId: Record<ID, Message>;
    allIds: ID[];
    activeChatMessageIds: ID[];
  };
  agents: {
    byId: Record<ID, Agent>;
    allIds: ID[];
    activeAgentId: ID | null;
    status: AgentStatus;
  };
  alerts: {
    byId: Record<ID, Alert>;
    allIds: ID[];
    unresolvedIds: ID[];
  };
  history: {
    byId: Record<ID, HistoryEvent>;
    allIds: ID[];
  };
  user: UserAccount;
  ui: UISlice;
};

type PersistedState = Pick<AppState, 'messages' | 'agents' | 'alerts' | 'history' | 'user' | 'ui'> & {
  schemaVersion: number;
};

const nowIso = () => new Date().toISOString();
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const defaultAgents: Agent[] = [
  {
    id: 'agent-research',
    name: 'Research Agent',
    subtitle: 'Gathering latest information',
    accent: 'bg-indigo-50 text-indigo-500',
    iconKey: 'research',
    status: 'idle',
  },
  {
    id: 'agent-analysis',
    name: 'Analysis Agent',
    subtitle: 'Processing your data',
    accent: 'bg-sky-50 text-sky-500',
    iconKey: 'analysis',
    status: 'idle',
  },
  {
    id: 'agent-memory',
    name: 'Memory Agent',
    subtitle: 'Updating knowledge base',
    accent: 'bg-amber-50 text-amber-500',
    iconKey: 'memory',
    status: 'idle',
  },
];

const seedMessages: Message[] = [
  {
    id: 'msg-system-online',
    role: 'system',
    content: 'All agents are online and ready.',
    createdAt: nowIso(),
    source: 'home',
  },
  {
    id: 'msg-system-tip',
    role: 'system',
    content: 'Tip: Start with Analyze for a weekly optimization pass.',
    createdAt: nowIso(),
    source: 'home',
  },
];

const seedAlerts: Alert[] = [
  {
    id: 'alert-renewal',
    message: 'Subscription renewal due in 3 days.',
    severity: 'warning',
    resolved: false,
    createdAt: nowIso(),
  },
  {
    id: 'alert-duplicate',
    message: 'Potential duplicate billing detected.',
    severity: 'critical',
    resolved: false,
    createdAt: nowIso(),
  },
  {
    id: 'alert-digest',
    message: 'Weekly alert digest is ready for review.',
    severity: 'info',
    resolved: false,
    createdAt: nowIso(),
  },
];

const seedHistory: HistoryEvent[] = [
  {
    id: 'hist-summary',
    type: 'system',
    title: 'Generated weekly operator summary',
    context: 'Action engine',
    createdAt: nowIso(),
  },
  {
    id: 'hist-memory',
    type: 'agent',
    title: 'Stored memory update from billing analysis',
    context: 'Memory core',
    createdAt: nowIso(),
  },
  {
    id: 'hist-review',
    type: 'agent',
    title: 'Ran subscription leak review',
    context: 'Research agent',
    createdAt: nowIso(),
  },
];

function toRecord<T extends { id: string }>(items: T[]): Record<string, T> {
  return items.reduce<Record<string, T>>((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});
}

const initialState: AppState = {
  schemaVersion: SCHEMA_VERSION,
  hydrated: false,
  messages: {
    byId: toRecord(seedMessages),
    allIds: seedMessages.map((m) => m.id),
    activeChatMessageIds: seedMessages.map((m) => m.id),
  },
  agents: {
    byId: toRecord(defaultAgents),
    allIds: defaultAgents.map((a) => a.id),
    activeAgentId: null,
    status: 'idle',
  },
  alerts: {
    byId: toRecord(seedAlerts),
    allIds: seedAlerts.map((a) => a.id),
    unresolvedIds: seedAlerts.filter((a) => !a.resolved).map((a) => a.id),
  },
  history: {
    byId: toRecord(seedHistory),
    allIds: seedHistory.map((h) => h.id),
  },
  user: {
    id: 'user-miro',
    name: 'Miro',
    plan: 'pro',
    email: 'miro@example.com',
  },
  ui: {
    currentPage: 'home',
    promptInput: '',
    activityFilter: 'all',
    systemExpanded: true,
    tryPromptIndex: 0,
    onboarding: {
      completed: false,
      step: 1,
    },
  },
};

type Action =
  | { type: 'hydrate'; payload: PersistedState }
  | { type: 'setPage'; payload: PageKey }
  | { type: 'setPrompt'; payload: string }
  | { type: 'setActivityFilter'; payload: ActivityFilter }
  | { type: 'setSystemExpanded'; payload: boolean }
  | { type: 'setTryPromptIndex'; payload: number }
  | { type: 'completeOnboarding' }
  | { type: 'sendMessage'; payload: { content: string; source: MessageSource } }
  | { type: 'runAgentsForIntent'; payload: { intent: string } }
  | { type: 'resolveAlert'; payload: { alertId: string } }
  | { type: 'logHistoryEvent'; payload: Omit<HistoryEvent, 'id' | 'createdAt'> }
  | { type: 'clearConversation' }
  | { type: 'openChatWithPrompt'; payload: { prompt: string } };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return {
        ...state,
        ...action.payload,
        schemaVersion: SCHEMA_VERSION,
        hydrated: true,
      };
    case 'setPage':
      return { ...state, ui: { ...state.ui, currentPage: action.payload } };
    case 'setPrompt':
      return { ...state, ui: { ...state.ui, promptInput: action.payload } };
    case 'setActivityFilter':
      return { ...state, ui: { ...state.ui, activityFilter: action.payload } };
    case 'setSystemExpanded':
      return { ...state, ui: { ...state.ui, systemExpanded: action.payload } };
    case 'setTryPromptIndex':
      return { ...state, ui: { ...state.ui, tryPromptIndex: action.payload } };
    case 'completeOnboarding':
      return {
        ...state,
        ui: {
          ...state.ui,
          onboarding: { completed: true, step: 999 },
        },
      };
    case 'sendMessage': {
      const userMessage: Message = {
        id: makeId('msg-user'),
        role: 'user',
        content: action.payload.content,
        createdAt: nowIso(),
        source: action.payload.source,
      };
      const assistantMessage: Message = {
        id: makeId('msg-assistant'),
        role: 'assistant',
        content: `Working on "${action.payload.content}" now.`,
        createdAt: nowIso(),
        source: action.payload.source,
      };
      const historyEvent: HistoryEvent = {
        id: makeId('hist-msg'),
        type: 'message',
        title: action.payload.content,
        context: `${action.payload.source} conversation`,
        createdAt: nowIso(),
        relatedId: userMessage.id,
      };
      return {
        ...state,
        messages: {
          byId: {
            ...state.messages.byId,
            [userMessage.id]: userMessage,
            [assistantMessage.id]: assistantMessage,
          },
          allIds: [...state.messages.allIds, userMessage.id, assistantMessage.id],
          activeChatMessageIds: [
            ...state.messages.activeChatMessageIds,
            userMessage.id,
            assistantMessage.id,
          ],
        },
        history: {
          byId: { ...state.history.byId, [historyEvent.id]: historyEvent },
          allIds: [historyEvent.id, ...state.history.allIds],
        },
        ui: {
          ...state.ui,
          promptInput: '',
        },
      };
    }
    case 'runAgentsForIntent': {
      const intent = action.payload.intent.toLowerCase();
      const activeAgentId = intent.includes('memory')
        ? 'agent-memory'
        : intent.includes('analy')
          ? 'agent-analysis'
          : 'agent-research';
      const updatedAgents = Object.fromEntries(
        state.agents.allIds.map((id) => {
          const current = state.agents.byId[id];
          const status: AgentStatus = id === activeAgentId ? 'running' : 'idle';
          return [id, { ...current, status }];
        }),
      ) as Record<string, Agent>;
      const historyEvent: HistoryEvent = {
        id: makeId('hist-agent'),
        type: 'agent',
        title: `Ran ${updatedAgents[activeAgentId].name}`,
        context: `Intent: ${action.payload.intent}`,
        createdAt: nowIso(),
        relatedId: activeAgentId,
      };

      return {
        ...state,
        agents: {
          ...state.agents,
          byId: updatedAgents,
          activeAgentId,
          status: 'running',
        },
        history: {
          byId: { ...state.history.byId, [historyEvent.id]: historyEvent },
          allIds: [historyEvent.id, ...state.history.allIds],
        },
      };
    }
    case 'resolveAlert': {
      const existing = state.alerts.byId[action.payload.alertId];
      if (!existing || existing.resolved) return state;
      const updated: Alert = {
        ...existing,
        resolved: true,
        resolvedAt: nowIso(),
      };
      const historyEvent: HistoryEvent = {
        id: makeId('hist-alert'),
        type: 'alert',
        title: `Resolved alert: ${existing.message}`,
        context: 'Alert center',
        createdAt: nowIso(),
        relatedId: existing.id,
      };
      return {
        ...state,
        alerts: {
          ...state.alerts,
          byId: { ...state.alerts.byId, [updated.id]: updated },
          unresolvedIds: state.alerts.unresolvedIds.filter((id) => id !== updated.id),
        },
        history: {
          byId: { ...state.history.byId, [historyEvent.id]: historyEvent },
          allIds: [historyEvent.id, ...state.history.allIds],
        },
      };
    }
    case 'logHistoryEvent': {
      const historyEvent: HistoryEvent = {
        ...action.payload,
        id: makeId('hist-custom'),
        createdAt: nowIso(),
      };
      return {
        ...state,
        history: {
          byId: { ...state.history.byId, [historyEvent.id]: historyEvent },
          allIds: [historyEvent.id, ...state.history.allIds],
        },
      };
    }
    case 'clearConversation':
      return {
        ...state,
        messages: {
          byId: {},
          allIds: [],
          activeChatMessageIds: [],
        },
      };
    case 'openChatWithPrompt': {
      const historyEvent: HistoryEvent = {
        id: makeId('hist-open-chat'),
        type: 'system',
        title: 'Opened chat from dashboard prompt',
        context: action.payload.prompt,
        createdAt: nowIso(),
      };
      return {
        ...state,
        ui: {
          ...state.ui,
          currentPage: 'chat',
          promptInput: action.payload.prompt,
        },
        history: {
          byId: { ...state.history.byId, [historyEvent.id]: historyEvent },
          allIds: [historyEvent.id, ...state.history.allIds],
        },
      };
    }
    default:
      return state;
  }
}

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<PersistedState>;
  return candidate.schemaVersion === SCHEMA_VERSION;
}

function getPersistedSnapshot(state: AppState): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    messages: state.messages,
    agents: state.agents,
    alerts: state.alerts,
    history: state.history,
    user: state.user,
    ui: state.ui,
  };
}

type AppStoreValue = {
  state: AppState;
  actions: {
    setCurrentPage: (page: PageKey) => void;
    setPromptInput: (prompt: string) => void;
    setActivityFilter: (filter: ActivityFilter) => void;
    setSystemExpanded: (expanded: boolean) => void;
    setTryPromptIndex: (index: number) => void;
    completeOnboarding: () => void;
    sendMessage: (content: string, source?: MessageSource) => void;
    runAgentsForIntent: (intent: string) => void;
    resolveAlert: (alertId: string) => void;
    logHistoryEvent: (event: Omit<HistoryEvent, 'id' | 'createdAt'>) => void;
    clearConversation: () => void;
    openChatWithPrompt: (prompt: string) => void;
  };
};

const AppStoreContext = createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      dispatch({ type: 'hydrate', payload: getPersistedSnapshot(initialState) });
      return;
    }
    try {
      const parsed: unknown = JSON.parse(raw);
      if (isPersistedState(parsed)) {
        dispatch({ type: 'hydrate', payload: parsed });
        return;
      }
    } catch {
      // no-op, fallback to initial state
    }
    dispatch({ type: 'hydrate', payload: getPersistedSnapshot(initialState) });
  }, []);

  useEffect(() => {
    if (!state.hydrated || typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistedSnapshot(state)));
  }, [state]);

  const actions = useMemo(
    () => ({
      setCurrentPage: (page: PageKey) => dispatch({ type: 'setPage', payload: page }),
      setPromptInput: (prompt: string) => dispatch({ type: 'setPrompt', payload: prompt }),
      setActivityFilter: (filter: ActivityFilter) => dispatch({ type: 'setActivityFilter', payload: filter }),
      setSystemExpanded: (expanded: boolean) => dispatch({ type: 'setSystemExpanded', payload: expanded }),
      setTryPromptIndex: (index: number) => dispatch({ type: 'setTryPromptIndex', payload: index }),
      completeOnboarding: () => dispatch({ type: 'completeOnboarding' }),
      sendMessage: (content: string, source: MessageSource = 'chat') => {
        const value = content.trim();
        if (!value) return;
        dispatch({ type: 'sendMessage', payload: { content: value, source } });
      },
      runAgentsForIntent: (intent: string) => dispatch({ type: 'runAgentsForIntent', payload: { intent } }),
      resolveAlert: (alertId: string) => dispatch({ type: 'resolveAlert', payload: { alertId } }),
      logHistoryEvent: (event: Omit<HistoryEvent, 'id' | 'createdAt'>) => dispatch({ type: 'logHistoryEvent', payload: event }),
      clearConversation: () => dispatch({ type: 'clearConversation' }),
      openChatWithPrompt: (prompt: string) => dispatch({ type: 'openChatWithPrompt', payload: { prompt } }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppStoreProvider');
  }

  const messages = useMemo(
    () => context.state.messages.activeChatMessageIds.map((id) => context.state.messages.byId[id]).filter(Boolean),
    [context.state.messages.activeChatMessageIds, context.state.messages.byId],
  );

  const agents = useMemo(
    () => context.state.agents.allIds.map((id) => context.state.agents.byId[id]).filter(Boolean),
    [context.state.agents.allIds, context.state.agents.byId],
  );

  const alerts = useMemo(
    () => context.state.alerts.allIds.map((id) => context.state.alerts.byId[id]).filter(Boolean),
    [context.state.alerts.allIds, context.state.alerts.byId],
  );

  const history = useMemo(
    () => context.state.history.allIds.map((id) => context.state.history.byId[id]).filter(Boolean),
    [context.state.history.allIds, context.state.history.byId],
  );

  const unresolvedAlertCount = context.state.alerts.unresolvedIds.length;

  return {
    ...context,
    selectors: {
      messages,
      agents,
      alerts,
      history,
      unresolvedAlertCount,
    },
  };
}

export function useSetPageOnMount(page: PageKey) {
  const { actions } = useAppStore();

  useEffect(() => {
    actions.setCurrentPage(page);
  }, [actions, page]);
}

export type { ActivityFilter, MessageSource };
