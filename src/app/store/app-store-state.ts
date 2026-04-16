import type { Agent, AgentName, AppState, Conversation } from './app-store-types';

export const DEFAULT_NEW_CHAT_TITLE = 'New chat';
export const DEFAULT_ACTIVE_AGENT: AgentName = 'Supervisor Agent';

export function nowIso() {
  return new Date().toISOString();
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const AGENT_ORDER: AgentName[] = [
  'Supervisor Agent',
  'Research Agent',
  'Analysis Agent',
  'Memory Agent',
  'Response Agent',
];

export function defaultAgents(): Record<AgentName, Agent> {
  return {
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
  };
}

export function createConversation(title = DEFAULT_NEW_CHAT_TITLE): Conversation {
  const now = nowIso();

  return {
    id: createId(),
    title,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: '',
    messageCount: 0,
  };
}

export function syncActiveConversationView(next: AppState): AppState {
  const messages = next.messageState[next.activeConversationId] ?? [];
  const draftPrompt = next.draftState[next.activeConversationId] ?? '';
  return { ...next, messages, draftPrompt };
}

export function ensureConversationInState(prev: AppState): AppState {
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
}

const initialConversation = createConversation();

export const initialState: AppState = {
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
