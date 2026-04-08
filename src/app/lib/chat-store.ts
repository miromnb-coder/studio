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

type ChatStoreListener = () => void;

const listeners = new Set<ChatStoreListener>();

function notifyChatStoreListeners() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeChatStore(listener: ChatStoreListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type AgentRuntimeState = {
  status: 'idle' | 'running' | 'updating';
  activeAgent: 'Research Agent' | 'Analysis Agent' | 'Memory Agent' | 'Money Agent' | null;
};

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
  notifyChatStoreListeners();
}

export function appendChatMessage(message: ChatMessage) {
  const messages = readChatMessages();
  writeChatMessages([...messages, message]);
}

export function updateChatMessage(messageId: string, updates: Partial<ChatMessage>) {
  const updated = readChatMessages().map((message) => (
    message.id === messageId ? { ...message, ...updates } : message
  ));
  writeChatMessages(updated);
}

export function readChatDraft(): string {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(CHAT_DRAFT_KEY) || '';
}

export function writeChatDraft(draft: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CHAT_DRAFT_KEY, draft);
  notifyChatStoreListeners();
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
  if (typeof window === 'undefined') return { status: 'idle', activeAgent: null };
  const raw = window.localStorage.getItem(AGENT_RUNTIME_KEY);
  if (!raw) return { status: 'idle', activeAgent: null };
  try {
    const parsed = JSON.parse(raw) as AgentRuntimeState;
    if (!parsed.status) return { status: 'idle', activeAgent: null };
    return parsed;
  } catch {
    return { status: 'idle', activeAgent: null };
  }
}

export function writeAgentRuntime(state: AgentRuntimeState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(AGENT_RUNTIME_KEY, JSON.stringify(state));
}
