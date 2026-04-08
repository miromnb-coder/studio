export type HistoryEventType = 'chat' | 'analysis' | 'alert' | 'memory';

export type HistoryEvent = {
  id: string;
  title: string;
  description: string;
  type: HistoryEventType;
  createdAt: string;
  prompt?: string;
  context?: string;
};

export const HISTORY_STORAGE_KEY = 'operator_history_events_v1';
const CHAT_STORAGE_KEY = 'operator_chat_thread_v1';
const CHAT_DRAFT_KEY = 'operator_chat_draft_v1';

function makeHistoryId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function readHistoryEvents(): HistoryEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as HistoryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeHistoryEvents(events: HistoryEvent[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(events));
}

export function emitHistoryEvent(input: Omit<HistoryEvent, 'id' | 'createdAt'> & { createdAt?: string }) {
  const nextEvent: HistoryEvent = {
    id: makeHistoryId(),
    createdAt: input.createdAt ?? new Date().toISOString(),
    ...input,
  };

  const events = readHistoryEvents();
  writeHistoryEvents([nextEvent, ...events].slice(0, 250));
  return nextEvent;
}

export function restoreHistoryToChat(event: HistoryEvent) {
  if (typeof window === 'undefined') return;

  if (event.prompt) {
    window.localStorage.setItem(CHAT_DRAFT_KEY, event.prompt);
  }

  if (!event.context) return;

  const existingRaw = window.localStorage.getItem(CHAT_STORAGE_KEY);
  const existing = existingRaw ? JSON.parse(existingRaw) : [];
  const systemMessage = {
    id: makeHistoryId(),
    role: 'system',
    content: `Restored context: ${event.context}`,
    createdAt: new Date().toISOString(),
    source: 'agents',
  };

  const list = Array.isArray(existing) ? existing : [];
  window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([...list, systemMessage]));
}
