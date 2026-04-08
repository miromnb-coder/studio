export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  source: 'chat' | 'home' | 'money' | 'agents';
};

export const CHAT_STORAGE_KEY = 'operator_chat_thread_v1';
export const CHAT_DRAFT_KEY = 'operator_chat_draft_v1';

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
