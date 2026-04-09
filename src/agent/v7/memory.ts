import { AgentMessage, UserContext } from './types';

interface MemoryInput {
  userId?: string;
  memory?: Partial<UserContext> | null;
  history?: AgentMessage[];
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function readUserContext(input: MemoryInput): UserContext {
  const baseMemory = input.memory || {};
  const history = input.history || [];

  const inferredSummary = history
    .filter((m) => m.role === 'user')
    .slice(-2)
    .map((m) => m.content.trim())
    .join(' | ');

  return {
    userId: input.userId || baseMemory.userId || 'system_anonymous',
    preferences: normalizeStringArray(baseMemory.preferences),
    goals: normalizeStringArray(baseMemory.goals),
    summary: typeof baseMemory.summary === 'string' && baseMemory.summary.trim().length > 0
      ? baseMemory.summary.trim()
      : (inferredSummary || 'No prior context available.'),
    summaryType: baseMemory.summaryType === 'finance' ? 'finance' : 'general',
    financeProfile: (baseMemory.financeProfile as Record<string, unknown> | null) || null,
    financeEvents: Array.isArray(baseMemory.financeEvents) ? (baseMemory.financeEvents as Array<Record<string, unknown>>) : [],
    summaries: Array.isArray(baseMemory.summaries) ? (baseMemory.summaries as Array<Record<string, unknown>>) : [],
  };
}
