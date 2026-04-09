import type { StoredMemory } from './types';

const MAX_ITEMS = 60;
const memoryStore = new Map<string, StoredMemory[]>();

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

function scoreRelevance(queryTokens: string[], candidate: StoredMemory): number {
  const text = `${candidate.key} ${candidate.value}`.toLowerCase();
  const overlap = queryTokens.reduce((sum, token) => (text.includes(token) ? sum + 1 : sum), 0);
  return overlap + candidate.score * 0.25;
}

export function retrieveMemory(sessionId: string, input: string): StoredMemory[] {
  const items = memoryStore.get(sessionId) ?? [];
  if (!items.length) return [];

  const queryTokens = tokenize(input);
  if (!queryTokens.length) return items.slice(-3);

  return [...items]
    .map((item) => ({ item, relevance: scoreRelevance(queryTokens, item) }))
    .filter((row) => row.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 4)
    .map((row) => row.item);
}

export function storeMemory(sessionId: string, input: string, result: string): StoredMemory[] {
  const normalizedInput = input.toLowerCase();
  const nextEntries: StoredMemory[] = [];

  if (/prefer|preference|always|never/.test(normalizedInput)) {
    nextEntries.push({
      key: 'user_preference',
      value: input.slice(0, 180),
      score: 3,
      source: 'preference',
      updatedAt: new Date().toISOString(),
    });
  }

  if (/choose|decision|pick|selected/.test(normalizedInput)) {
    nextEntries.push({
      key: 'important_decision',
      value: input.slice(0, 180),
      score: 2,
      source: 'decision',
      updatedAt: new Date().toISOString(),
    });
  }

  if (/again|repeat|every time|usually/.test(normalizedInput)) {
    nextEntries.push({
      key: 'repeated_pattern',
      value: input.slice(0, 180),
      score: 2,
      source: 'pattern',
      updatedAt: new Date().toISOString(),
    });
  }

  if (result.length > 500) {
    nextEntries.push({
      key: 'long_form_topic',
      value: result.slice(0, 200),
      score: 1,
      source: 'pattern',
      updatedAt: new Date().toISOString(),
    });
  }

  if (!nextEntries.length) return [];

  const existing = memoryStore.get(sessionId) ?? [];
  const merged = [...nextEntries, ...existing].slice(0, MAX_ITEMS);
  memoryStore.set(sessionId, merged);
  return nextEntries;
}
