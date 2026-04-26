import type { KernelRequest } from '../kernel/types';
import type { KernelToolContext } from '../kernel/tool-registry';

export type MemoryV2Item = {
  id: string;
  type: 'project' | 'goal' | 'preference' | 'workflow' | 'fact' | 'task';
  text: string;
  score: number;
  reason: string;
  source: 'static_profile' | 'request' | 'metadata';
};

export type MemoryV2SearchResult = {
  query: string;
  items: MemoryV2Item[];
  summary: string;
};

export type MemoryV2WriteCandidate = {
  type: MemoryV2Item['type'];
  text: string;
  confidence: number;
  reason: string;
};

const STATIC_PROFILE: Array<Omit<MemoryV2Item, 'score' | 'reason'>> = [
  { id: 'kivo-product', type: 'project', text: 'Kivo is the user’s Personal AI OS / operator-style AI project.', source: 'static_profile' },
  { id: 'kivo-current-agent', type: 'workflow', text: 'Current active agent path is src/agent/kernel using runKernel and runKernelStream.', source: 'static_profile' },
  { id: 'kivo-tool-layer', type: 'workflow', text: 'Kivo uses a Tool Layer through src/agent/tools and kernel tool execution.', source: 'static_profile' },
  { id: 'kivo-priority', type: 'goal', text: 'Important product direction: make Memory, Gmail, and Calendar useful together.', source: 'static_profile' },
  { id: 'kivo-ui', type: 'preference', text: 'The user prefers premium, mobile-first, Apple-like UI with smooth animations and minimal clutter.', source: 'static_profile' },
  { id: 'kivo-pwa', type: 'fact', text: 'Kivo is intended to work as a PWA installed from iPhone home screen.', source: 'static_profile' },
];

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9åäö\s]/gi, ' ').replace(/\s+/g, ' ').trim();
}

function words(text: string) {
  return new Set(normalize(text).split(' ').filter((word) => word.length > 2));
}

function score(query: string, text: string) {
  const q = words(query);
  const t = words(text);
  if (!q.size || !t.size) return 0;
  let hits = 0;
  for (const word of q) if (t.has(word)) hits += 1;
  return hits / Math.max(1, Math.min(q.size, 8));
}

function inferReason(item: Omit<MemoryV2Item, 'score' | 'reason'>, query: string) {
  if (item.type === 'project') return 'Relevant project context for this request.';
  if (item.type === 'workflow') return 'Relevant implementation/workflow context.';
  if (item.type === 'goal') return 'Relevant user/product goal.';
  if (item.type === 'preference') return 'Relevant user preference.';
  return `Matched query: ${query.slice(0, 80)}`;
}

export function searchMemoryV2(request: KernelRequest, context: KernelToolContext): MemoryV2SearchResult {
  const query = request.message || String(request.metadata?.query || '');
  const metadataText = request.metadata ? JSON.stringify(request.metadata).slice(0, 600) : '';
  const combinedQuery = `${query} ${metadataText}`.trim();

  const items = STATIC_PROFILE
    .map((item) => {
      const baseScore = score(combinedQuery, item.text);
      const boost = item.text.toLowerCase().includes('kivo') && /kivo|agent|kernel|tool|memory|gmail|calendar|pwa|ui|app|sovellus/i.test(combinedQuery) ? 0.35 : 0;
      return { ...item, score: Math.min(1, baseScore + boost), reason: inferReason(item, query) };
    })
    .filter((item) => item.score > 0.12)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const summary = items.length
    ? `Found ${items.length} relevant memory item${items.length === 1 ? '' : 's'} for this request.`
    : 'No strong Memory v2 match found.';

  return { query: combinedQuery, items, summary };
}

export function extractMemoryV2WriteCandidates(request: KernelRequest): MemoryV2WriteCandidate[] {
  const text = request.message.trim();
  const candidates: MemoryV2WriteCandidate[] = [];
  const patterns: Array<{ pattern: RegExp; type: MemoryV2Item['type']; reason: string }> = [
    { pattern: /(?:remember this|muista tämä)[:\s]+(.+)/i, type: 'fact', reason: 'Explicit remember request.' },
    { pattern: /(?:save this|tallenna tämä)[:\s]+(.+)/i, type: 'fact', reason: 'Explicit save request.' },
    { pattern: /(?:my goal is|tavoitteeni on)[:\s]+(.+)/i, type: 'goal', reason: 'User stated a goal.' },
    { pattern: /(?:i prefer|haluan mieluummin|pidän siitä että)[:\s]+(.+)/i, type: 'preference', reason: 'User stated a preference.' },
    { pattern: /(?:next time|jatkossa)[:\s]+(.+)/i, type: 'workflow', reason: 'Future workflow preference.' },
  ];

  for (const item of patterns) {
    const match = text.match(item.pattern);
    if (match?.[1]) candidates.push({ type: item.type, text: match[1].trim().slice(0, 500), confidence: 0.9, reason: item.reason });
  }

  if (!candidates.length && /kivo|project|projekti|goal|prefer|memory|kernel|tool layer/i.test(text)) {
    candidates.push({ type: /goal|tavoite/i.test(text) ? 'goal' : 'project', text: text.slice(0, 500), confidence: 0.55, reason: 'Project-related durable context candidate.' });
  }

  return Array.from(new Map(candidates.map((item) => [`${item.type}:${item.text}`, item])).values()).slice(0, 6);
}
