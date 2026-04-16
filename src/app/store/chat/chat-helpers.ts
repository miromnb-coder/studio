import type { AgentResponse } from '@/types/agent-response';
import type { Conversation, Message } from '../app-store-types';
import { DEFAULT_NEW_CHAT_TITLE } from '../app-store-state';

export function summarizePreview(messages: Message[]) {
  const latest = [...messages]
    .reverse()
    .find((message) => message.content.trim());

  if (!latest) return '';
  return latest.content.trim().slice(0, 120);
}

export function deriveTitleFromPrompt(prompt: string) {
  const clean = prompt.replace(/\s+/g, ' ').trim();
  if (!clean) return DEFAULT_NEW_CHAT_TITLE;

  const stripped = clean.replace(/^[^a-zA-Z0-9]+/, '');
  const firstSentence = stripped.split(/[.!?]\s/)[0] || stripped;
  const trimmed = firstSentence.trim();

  if (!trimmed) return DEFAULT_NEW_CHAT_TITLE;
  if (trimmed.length <= 52) return trimmed;
  return `${trimmed.slice(0, 49).trimEnd()}…`;
}

export function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function getConversationWindow(messages: Message[]) {
  return messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

export function providerSafeErrorMessage(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  if (raw.startsWith('LIMIT_REACHED:')) return raw;
  if (raw.startsWith('AUTH_REQUIRED:')) return raw;
  if (raw.startsWith('PREMIUM_REQUIRED:')) return raw;

  console.error('Kivo chat error:', raw);
  return 'I ran into an issue, but here’s what I could analyze so far.';
}

export function normalizeAgentResponse(result: Partial<AgentResponse>): AgentResponse {
  return {
    reply: typeof result.reply === 'string' ? result.reply : '',
    metadata: result.metadata,
  } as AgentResponse;
}

export function emitUsageUpdate(payload: {
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
