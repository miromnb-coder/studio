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
    (a, b) => new Date(b.updatedAt).getTime() - a.updatedAt.localeCompare(b.updatedAt),
  );
}

export function getConversationWindow(messages: Message[]) {
  return messages.slice(-10).map((message) => ({
    role: message.role,
    content: message.content,
  }));
}

function sanitizeErrorMessage(raw: string): string {
  return raw
    .replace(/sk-[A-Za-z0-9_-]+/g, 'sk-***')
    .replace(/gsk_[A-Za-z0-9_-]+/g, 'gsk_***')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer ***')
    .slice(0, 420);
}

export function providerSafeErrorMessage(raw: string): string {
  if (!raw) return 'Something went wrong. Please try again.';
  if (raw.startsWith('LIMIT_REACHED:')) return raw;
  if (raw.startsWith('AUTH_REQUIRED:')) return raw;
  if (raw.startsWith('PREMIUM_REQUIRED:')) return raw;

  const safe = sanitizeErrorMessage(raw);
  console.error('Kivo chat error:', safe);

  if (/OPENAI_API_KEY|GROQ_API_KEY|API key|api_key|401|unauthorized/i.test(safe)) {
    return `Kivo backend config error: ${safe}`;
  }

  if (/model|not found|unsupported|invalid_request|responses/i.test(safe)) {
    return `Kivo model/runtime error: ${safe}`;
  }

  if (/credit|credits|no_credits|reservation|balance/i.test(safe)) {
    return `Kivo credits error: ${safe}`;
  }

  if (/stream|Streaming|response body|interrupted/i.test(safe)) {
    return `Kivo stream error: ${safe}`;
  }

  return `Kivo runtime error: ${safe}`;
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
