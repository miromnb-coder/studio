import type { StoredMemory } from './types';

const MAX_ITEMS = 80;
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
  const freshnessBoost = Math.max(0, 14 - (Date.now() - new Date(candidate.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  return overlap + candidate.score * 0.3 + freshnessBoost * 0.1;
}

export function retrieveMemory(sessionId: string, input: string): StoredMemory[] {
  const items = memoryStore.get(sessionId) ?? [];
  if (!items.length) return [];

  const queryTokens = tokenize(input);
  if (!queryTokens.length) return items.slice(0, 4);

  return [...items]
    .map((item) => ({ item, relevance: scoreRelevance(queryTokens, item) }))
    .filter((row) => row.relevance > 0.2)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 5)
    .map((row) => row.item);
}

function makeMemory(key: StoredMemory['key'], value: string, score: number, source: StoredMemory['source']): StoredMemory {
  return {
    key,
    value: value.slice(0, 220),
    score,
    source,
    updatedAt: new Date().toISOString(),
  };
}

export function storeMemory(sessionId: string, input: string, result: string): StoredMemory[] {
  const normalizedInput = input.toLowerCase();
  const nextEntries: StoredMemory[] = [];

  if (/prefer|preference|always|never|tone|style/.test(normalizedInput)) {
    nextEntries.push(makeMemory('user_preference', input, 3.2, 'preference'));
  }

  if (/choose|decision|pick|selected|going with|we decided/.test(normalizedInput)) {
    nextEntries.push(makeMemory('important_decision', input, 2.8, 'decision'));
  }

  if (/project|app|roadmap|release|launch|deadline/.test(normalizedInput)) {
    nextEntries.push(makeMemory('project_context', input, 2.4, 'project'));
  }

  if (/again|repeat|every time|usually|habit/.test(normalizedInput)) {
    nextEntries.push(makeMemory('repeated_pattern', input, 2.2, 'pattern'));
  }

  if (/goal|trying to|i want to/.test(normalizedInput)) {
    nextEntries.push(makeMemory('user_goal', input, 2.6, 'project'));
  }

  if (result.length > 650) {
    nextEntries.push(makeMemory('long_form_topic', result, 1.3, 'pattern'));
  }

  if (!nextEntries.length) return [];

  const existing = memoryStore.get(sessionId) ?? [];
  const deduped = [...nextEntries, ...existing].filter(
    (item, index, arr) => arr.findIndex((candidate) => candidate.key === item.key && candidate.value === item.value) === index,
  );
  const merged = deduped.slice(0, MAX_ITEMS);
  memoryStore.set(sessionId, merged);
  return nextEntries;
}
