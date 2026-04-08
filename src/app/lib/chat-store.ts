export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  source: 'chat' | 'home' | 'money' | 'agents';
};

export const CHAT_STORAGE_KEY = 'operator_chat_thread_v1';
export const CHAT_DRAFT_KEY = 'operator_chat_draft_v1';
export const AGENT_RUNTIME_KEY = 'operator_agent_runtime_v1';
export const AGENT_RUNTIME_EVENT = 'operator-agent-runtime-updated';

export type AgentName = 'Research Agent' | 'Analysis Agent' | 'Memory Agent';
export type AgentLifecycleStatus = 'idle' | 'running' | 'completed';

export type AgentEntity = {
  name: AgentName;
  status: AgentLifecycleStatus;
  lastRun: string | null;
  lastTask: string | null;
};

export type AgentRuntimeState = {
  status: AgentLifecycleStatus;
  activeAgent: AgentName | null;
  agents: Record<AgentName, AgentEntity>;
};

const AGENT_NAMES: AgentName[] = ['Research Agent', 'Analysis Agent', 'Memory Agent'];

function createDefaultRuntime(): AgentRuntimeState {
  const agents = AGENT_NAMES.reduce(
    (acc, name) => {
      acc[name] = { name, status: 'idle', lastRun: null, lastTask: null };
      return acc;
    },
    {} as Record<AgentName, AgentEntity>,
  );

  return {
    status: 'idle',
    activeAgent: null,
    agents,
  };
}

export function readChatMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeChatMessages(messages: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
}

export function makeMessage(role: ChatMessage['role'], content: string, source: ChatMessage['source']): ChatMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    source,
  };
}

export function readAgentRuntime(): AgentRuntimeState {
  if (typeof window === 'undefined') return createDefaultRuntime();
  const raw = window.localStorage.getItem(AGENT_RUNTIME_KEY);
  if (!raw) return createDefaultRuntime();
  try {
    const parsed = JSON.parse(raw) as Partial<AgentRuntimeState>;
    const fallback = createDefaultRuntime();
    if (!parsed || !parsed.status) return fallback;

    const normalizedAgents = AGENT_NAMES.reduce(
      (acc, name) => {
        const existing = parsed.agents?.[name];
        acc[name] = {
          name,
          status: existing?.status ?? (name === parsed.activeAgent ? 'running' : 'idle'),
          lastRun: existing?.lastRun ?? null,
          lastTask: existing?.lastTask ?? null,
        };
        return acc;
      },
      {} as Record<AgentName, AgentEntity>,
    );

    return {
      status: parsed.status ?? 'idle',
      activeAgent: parsed.activeAgent ?? null,
      agents: normalizedAgents,
    };
  } catch {
    return createDefaultRuntime();
  }
}

export function writeAgentRuntime(state: AgentRuntimeState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AGENT_RUNTIME_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event(AGENT_RUNTIME_EVENT));
}
