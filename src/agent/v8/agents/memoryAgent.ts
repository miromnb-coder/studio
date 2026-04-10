import { upsertUserMemory } from '../tools/memory-store';
import { AgentContextV8, UserMemoryTypeV8 } from '../types';

export type MemoryAgentInput = {
  userId: string;
  userMessage: string;
  assistantReply: string;
  context: AgentContextV8;
  intent: string;
};

export type MemoryAgentOutput = {
  stored: Array<{ content: string; type: UserMemoryTypeV8; importance: number }>;
  skippedReason?: string;
};

function classifyMemory(content: string, intent: string): { type: UserMemoryTypeV8; importance: number } {
  const lower = content.toLowerCase();
  if (intent === 'finance' || /\b(subscription|budget|saving|expense|debt|income)\b/.test(lower)) {
    return { type: 'finance', importance: 0.88 };
  }
  if (/\bprefer|like|language|suomeksi|always|never\b/.test(lower)) {
    return { type: 'preference', importance: 0.82 };
  }
  if (/\bgoal|plan to|want to|target|deadline\b/.test(lower)) {
    return { type: 'goal', importance: 0.8 };
  }
  if (/\bmy name is|i am|i work|i live|important\b/.test(lower)) {
    return { type: 'fact', importance: 0.74 };
  }
  return { type: 'other', importance: 0.55 };
}

function extractCandidates(message: string): string[] {
  const trimmed = message.trim();
  if (trimmed.length < 20) return [];

  const clauses = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 24)
    .slice(0, 2);

  return clauses;
}

export async function runMemoryAgent(input: MemoryAgentInput): Promise<MemoryAgentOutput> {
  const candidates = extractCandidates(input.userMessage);
  if (!candidates.length) {
    return { stored: [], skippedReason: 'No high-signal candidate content found.' };
  }

  const stored: Array<{ content: string; type: UserMemoryTypeV8; importance: number }> = [];

  for (const candidate of candidates) {
    const { type, importance } = classifyMemory(candidate, input.intent);
    if (importance < 0.7) continue;

    const saved = await upsertUserMemory({
      userId: input.userId,
      content: candidate,
      type,
      importance,
    }).catch(() => ({ ok: false, reason: 'memory_write_failed' }));

    if (saved.ok) stored.push({ content: candidate, type, importance });
  }

  return stored.length ? { stored } : { stored: [], skippedReason: 'Candidates were low importance.' };
}
