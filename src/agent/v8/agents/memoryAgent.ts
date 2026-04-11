import { upsertUserMemory } from '../tools/memory-store';
import { AgentContextV8, UserMemoryTypeV8 } from '../types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type MemoryAgentInput = {
  supabase: SupabaseClient;
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
  if (
    intent === 'finance' ||
    /\b(subscription|budget|saving|expense|debt|income|money|finance|raha|sääst|saast|tilaus|kulu|lasku|talous|sijoit|hinta|halpa)\b/.test(lower)
  ) {
    return { type: 'finance', importance: 0.88 };
  }
  if (
    /\b(prefer|like|language|suomeksi|englanniksi|always|never|pidän|pidan|tykkään|tykkaan|haluan vastaukset|vastaa suomeksi|vastaa englanniksi|lyhy(?:t|istä)|prefiero|preferisco)\b/.test(
      lower,
    )
  ) {
    return { type: 'preference', importance: 0.82 };
  }
  if (/\b(goal|plan to|want to|target|deadline|haluan|aion|rakennan|tavoite|quiero|voglio|je veux)\b/.test(lower)) {
    return { type: 'goal', importance: 0.8 };
  }
  if (/\b(my name is|i am|i work|i live|important|olen|asun|työskentelen|nimeni on|trabajo|vivo|sono)\b/.test(lower)) {
    return { type: 'fact', importance: 0.74 };
  }
  return { type: 'other', importance: 0.55 };
}

function isHighSignalMemorySentence(message: string): boolean {
  const lower = message.toLowerCase();
  const firstPersonSignal =
    /\b(i|i'm|my|me|minä|mina|minun|mä|ma|yo|je|ich|io|mi|mon|haluan|tykkään|tykkaan|pidän|pidan|rakennan|aion|säästän|saastan)\b/.test(
      lower,
    );
  const preferenceGoalSignal =
    /\b(like|prefer|want|need|always|never|remember|muista|haluan|tykkään|tykkaan|pidän|pidan|rakennan|lyhy(?:t|istä)|suomeksi|quiero|prefiero|j'aime)\b/.test(
      lower,
    );
  return firstPersonSignal && preferenceGoalSignal;
}

function extractCandidates(message: string): string[] {
  const trimmed = message.trim();
  if (trimmed.length < 10) return [];

  const clauses = trimmed
    .split(/(?<=[.!?])\s+|\s+(?:ja|sekä|että|and|also|y|et)\s+/i)
    .map((part) => part.trim())
    .filter((part) => part.length >= 10 && (part.length >= 20 || isHighSignalMemorySentence(part)))
    .slice(0, 3);

  return clauses;
}

export async function runMemoryAgent(input: MemoryAgentInput): Promise<MemoryAgentOutput> {
  const candidates = extractCandidates(input.userMessage);
  if (!candidates.length) {
    return { stored: [], skippedReason: 'No high-signal candidate content found.' };
  }

  const stored: Array<{ content: string; type: UserMemoryTypeV8; importance: number }> = [];

  for (const candidate of candidates) {
    console.info('MEMORY_CANDIDATE_FOUND', {
      userId: input.userId,
      intent: input.intent,
      candidate,
    });

    const { type, importance } = classifyMemory(candidate, input.intent);
    console.info('MEMORY_CLASSIFIED', {
      userId: input.userId,
      intent: input.intent,
      candidate,
      type,
      importance,
    });

    if (importance < 0.7) continue;

    const saved = await upsertUserMemory({
      supabase: input.supabase,
      userId: input.userId,
      content: candidate,
      type,
      importance,
    }).catch(() => ({ ok: false, reason: 'memory_write_failed' }));

    if (saved.ok) stored.push({ content: candidate, type, importance });
  }

  return stored.length ? { stored } : { stored: [], skippedReason: 'Candidates were low importance.' };
}
