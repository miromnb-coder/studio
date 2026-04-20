import type { AgentContext } from './types';
import { asMessageArray, normalizeText } from './helpers';

export function getContextMemory(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    memory?: unknown[];
    memories?: unknown[];
    retrievedMemory?: unknown[];
    memoryContext?: { items?: unknown[] };
  };

  return (
    ctx.memoryContext?.items ??
    ctx.memory ??
    ctx.memories ??
    ctx.retrievedMemory ??
    []
  );
}

export function getContextNotes(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    notes?: unknown[];
    userNotes?: unknown[];
  };

  return ctx.notes ?? ctx.userNotes ?? [];
}

export function getConversationMessages(context: AgentContext): Array<{
  role?: string;
  content?: string;
}> {
  const ctx = context as AgentContext & {
    messages?: unknown[];
    conversation?: { messages?: unknown[] };
    request?: { conversation?: unknown[] };
  };

  const source =
    ctx.messages ?? ctx.conversation?.messages ?? ctx.request?.conversation ?? [];

  return asMessageArray(source);
}

export function getRequestText(context: AgentContext): string {
  const request = context.request as AgentContext['request'] & {
    message?: string;
    input?: string;
    prompt?: string;
  };

  return normalizeText(request.message || request.input || request.prompt || '');
}

export function getRecentConversationSummary(context: AgentContext): string {
  return getConversationMessages(context)
    .slice(-6)
    .map((message) => `${message.role || 'user'}: ${normalizeText(message.content)}`)
    .filter(Boolean)
    .join('\n');
}

export function summarizeMemoryItem(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  return (
    normalizeText(record.content) ||
    normalizeText(record.summary) ||
    normalizeText(record.text) ||
    normalizeText(record.title)
  );
}

export function rankTextByQuery(items: string[], query: string): string[] {
  const q = normalizeText(query).toLowerCase();
  if (!q) return items;

  const tokens = q.split(/\s+/).filter(Boolean);

  return [...items].sort((a, b) => {
    const aScore = tokens.reduce(
      (sum, token) => sum + (a.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    const bScore = tokens.reduce(
      (sum, token) => sum + (b.toLowerCase().includes(token) ? 1 : 0),
      0,
    );
    return bScore - aScore;
  });
}
