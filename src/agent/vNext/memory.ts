import type {
  AgentContext,
  AgentMemoryContext,
  AgentMemoryItem,
  AgentRequest,
} from './types';

type RawConversation = {
  id?: string;
  title?: string;
  updatedAt?: string;
  createdAt?: string;
  lastMessagePreview?: string;
  pinned?: boolean;
  saved?: boolean;
  tags?: string[];
};

type RawMessage = {
  id?: string;
  role?: string;
  content?: string;
  createdAt?: string;
  agent?: boolean;
  agentMetadata?: {
    operatorModules?: unknown[];
  };
};

type RawNote = {
  id?: string;
  title?: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  tags?: string[];
};

type RawFact = {
  id?: string;
  content?: string;
  createdAt?: string;
  tags?: string[];
};

type RawMemoryContext = AgentContext & {
  memory?: unknown[];
  memories?: unknown[];
  retrievedMemory?: unknown[];
  notes?: RawNote[];
  userNotes?: RawNote[];
  facts?: RawFact[];
  savedFacts?: RawFact[];
  conversations?: RawConversation[];
  conversationList?: RawConversation[];
  messageState?: Record<string, RawMessage[]>;
  messages?: RawMessage[];
  conversation?: {
    id?: string;
    title?: string;
    messages?: RawMessage[];
  };
};

const DEFAULT_FETCH_LIMIT = 24;
const MAX_CONTEXT_ITEMS = 8;
const MAX_SUMMARY_ITEMS = 4;
const MAX_CONTENT_LENGTH = 420;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function clampText(value: string, max = MAX_CONTENT_LENGTH): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9äöåáéíóúñüß_-]+/i)
    .filter((token) => token.length > 1);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeText(value)).filter(Boolean))];
}

function overlapScore(queryTokens: string[], haystack: string): number {
  if (!queryTokens.length) return 0;

  const lowered = haystack.toLowerCase();
  const matches = queryTokens.filter((token) => lowered.includes(token)).length;

  return matches / queryTokens.length;
}

function phraseBoost(queryText: string, haystack: string): number {
  const normalizedQuery = normalizeText(queryText).toLowerCase();
  if (!normalizedQuery) return 0;

  const lowered = haystack.toLowerCase();
  if (lowered.includes(normalizedQuery)) return 1;
  if (normalizedQuery.length > 12 && lowered.includes(normalizedQuery.slice(0, 12))) {
    return 0.45;
  }

  return 0;
}

function recencyScore(iso?: string): number {
  if (!iso) return 0.2;

  const timestamp = new Date(iso).getTime();
  if (Number.isNaN(timestamp)) return 0.2;

  const ageMs = Date.now() - timestamp;
  const dayMs = 86_400_000;

  if (ageMs <= dayMs) return 1;
  if (ageMs <= 7 * dayMs) return 0.85;
  if (ageMs <= 30 * dayMs) return 0.65;
  if (ageMs <= 90 * dayMs) return 0.45;
  return 0.25;
}

function kindBaseScore(kind: AgentMemoryItem['kind']): number {
  switch (kind) {
    case 'fact':
      return 0.72;
    case 'summary':
      return 0.64;
    case 'task':
      return 0.62;
    case 'preference':
      return 0.68;
    case 'entity':
      return 0.58;
    case 'history':
      return 0.54;
    default:
      return 0.5;
  }
}

function getQueryText(request: AgentRequest): string {
  const direct =
    typeof (request as AgentRequest & { input?: string }).input === 'string'
      ? (request as AgentRequest & { input?: string }).input
      : '';

  const message =
    typeof (request as AgentRequest & { message?: string }).message === 'string'
      ? (request as AgentRequest & { message?: string }).message
      : '';

  const prompt =
    typeof (request as AgentRequest & { prompt?: string }).prompt === 'string'
      ? (request as AgentRequest & { prompt?: string }).prompt
      : '';

  return normalizeText(direct || message || prompt);
}

function classifyMemoryKind(
  content: string,
  tags: string[] = [],
): AgentMemoryItem['kind'] {
  const lowered = `${content} ${tags.join(' ')}`.toLowerCase();

  if (/\b(prefer|preference|like|avoid|always|never|haluan|pidän|vältä|mieluummin)\b/.test(lowered)) {
    return 'preference';
  }

  if (/\b(deadline|task|todo|next step|milestone|tehtävä|seuraava askel)\b/.test(lowered)) {
    return 'task';
  }

  if (/\b(fact|known|is|are|works with|supports|tieto|tosiasia)\b/.test(lowered)) {
    return 'fact';
  }

  if (/\b(project|repo|device|product|model|entity|halo|iphone|brilliant)\b/.test(lowered)) {
    return 'entity';
  }

  return 'summary';
}

function toMemoryItem(params: {
  id: string;
  userId?: string;
  kind: AgentMemoryItem['kind'];
  content: string;
  createdAt?: string;
  tags?: string[];
  relevanceScore?: number;
  metadata?: Record<string, unknown>;
}): AgentMemoryItem {
  return {
    id: params.id,
    userId: params.userId,
    kind: params.kind,
    content: clampText(normalizeText(params.content)),
    relevanceScore: params.relevanceScore ?? kindBaseScore(params.kind),
    createdAt: params.createdAt ?? new Date().toISOString(),
    tags: uniqueStrings(params.tags ?? []),
    metadata: params.metadata,
  };
}

function extractExplicitMemory(
  context: RawMemoryContext,
  request: AgentRequest,
): AgentMemoryItem[] {
  const userId = request.userId;

  const explicitMemory = [
    ...safeArray<AgentMemoryItem>(context.memory),
    ...safeArray<AgentMemoryItem>(context.memories),
    ...safeArray<AgentMemoryItem>(context.retrievedMemory),
  ].filter(
    (item): item is AgentMemoryItem =>
      Boolean(item && typeof item === 'object' && 'content' in item),
  );

  return explicitMemory.map((item, index) =>
    toMemoryItem({
      id: item.id || `existing-memory-${index}`,
      userId,
      kind: item.kind || classifyMemoryKind(item.content, item.tags),
      content: item.content,
      createdAt: item.createdAt,
      tags: item.tags,
      relevanceScore: item.relevanceScore,
      metadata: item.metadata,
    }),
  );
}

function extractNotes(
  context: RawMemoryContext,
  request: AgentRequest,
): AgentMemoryItem[] {
  const userId = request.userId;

  return [
    ...safeArray<RawNote>(context.notes),
    ...safeArray<RawNote>(context.userNotes),
  ].map((note, index) =>
    toMemoryItem({
      id: note.id || `note-${index}`,
      userId,
      kind: classifyMemoryKind(
        [note.title, note.content].filter(Boolean).join(' '),
        note.tags ?? [],
      ),
      content: [note.title, note.content].filter(Boolean).join(' — '),
      createdAt: note.updatedAt || note.createdAt,
      tags: ['note', ...(note.tags ?? [])],
      metadata: {
        sourceType: 'note',
        title: note.title,
      },
    }),
  );
}

function extractFacts(
  context: RawMemoryContext,
  request: AgentRequest,
): AgentMemoryItem[] {
  const userId = request.userId;

  return [
    ...safeArray<RawFact>(context.facts),
    ...safeArray<RawFact>(context.savedFacts),
  ].map((fact, index) =>
    toMemoryItem({
      id: fact.id || `fact-${index}`,
      userId,
      kind: 'fact',
      content: fact.content || '',
      createdAt: fact.createdAt,
      tags: ['fact', ...(fact.tags ?? [])],
      metadata: {
        sourceType: 'fact',
      },
    }),
  );
}

function extractConversations(
  context: RawMemoryContext,
  request: AgentRequest,
): AgentMemoryItem[] {
  const userId = request.userId;

  return [
    ...safeArray<RawConversation>(context.conversations),
    ...safeArray<RawConversation>(context.conversationList),
  ].map((conversation, index) =>
    toMemoryItem({
      id: conversation.id || `conversation-${index}`,
      userId,
      kind: 'history',
      content: [conversation.title, conversation.lastMessagePreview]
        .filter(Boolean)
        .join(' — '),
      createdAt: conversation.updatedAt || conversation.createdAt,
      tags: [
        'conversation',
        conversation.pinned ? 'pinned' : '',
        conversation.saved ? 'saved' : '',
        ...(conversation.tags ?? []),
      ],
      metadata: {
        sourceType: 'conversation',
        conversationId: conversation.id,
        title: conversation.title,
      },
    }),
  );
}

function extractMessageItems(
  messages: RawMessage[],
  request: AgentRequest,
  sourceType: string,
  conversationId?: string,
): AgentMemoryItem[] {
  const userId = request.userId;

  return messages.map((message, index) =>
    toMemoryItem({
      id: message.id || `${sourceType}-${conversationId || 'default'}-${index}`,
      userId,
      kind: message.role === 'user' ? 'history' : 'summary',
      content: message.content || '',
      createdAt: message.createdAt,
      tags: [
        sourceType,
        message.role || 'unknown',
        message.agent || message.agentMetadata?.operatorModules?.length
          ? 'agent'
          : '',
      ],
      metadata: {
        sourceType,
        role: message.role,
        conversationId,
      },
    }),
  );
}

function extractStructuredMemory(
  context: RawMemoryContext,
  request: AgentRequest,
): AgentMemoryItem[] {
  const explicit = extractExplicitMemory(context, request);
  const notes = extractNotes(context, request);
  const facts = extractFacts(context, request);
  const conversations = extractConversations(context, request);

  const currentMessages = extractMessageItems(
    safeArray<RawMessage>(context.messages),
    request,
    'message',
  );

  const threadedMessages = Object.entries(context.messageState ?? {}).flatMap(
    ([conversationId, messages]) =>
      extractMessageItems(
        safeArray<RawMessage>(messages),
        request,
        'thread-message',
        conversationId,
      ),
  );

  const activeConversationMessages = extractMessageItems(
    safeArray<RawMessage>(context.conversation?.messages),
    request,
    'active-conversation-message',
    context.conversation?.id,
  );

  return [
    ...explicit,
    ...notes,
    ...facts,
    ...conversations,
    ...currentMessages,
    ...threadedMessages,
    ...activeConversationMessages,
  ].filter((item) => Boolean(item.content));
}

function dedupeMemory(items: AgentMemoryItem[]): AgentMemoryItem[] {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.kind}:${item.content.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function scoreMemoryItem(
  item: AgentMemoryItem,
  queryText: string,
): AgentMemoryItem {
  const queryTokens = tokenize(queryText);
  const haystack = [
    item.content,
    ...(item.tags ?? []),
    typeof item.metadata?.title === 'string' ? item.metadata.title : '',
  ]
    .filter(Boolean)
    .join(' ');

  const lexical = overlapScore(queryTokens, haystack);
  const phrase = phraseBoost(queryText, haystack);
  const recency = recencyScore(item.createdAt);
  const base =
    typeof item.relevanceScore === 'number' ? item.relevanceScore : 0.5;

  const relevanceScore = Number(
    Math.min(
      1,
      base * 0.35 + lexical * 0.35 + phrase * 0.18 + recency * 0.12,
    ).toFixed(4),
  );

  return {
    ...item,
    relevanceScore,
  };
}

function sortMemory(items: AgentMemoryItem[]): AgentMemoryItem[] {
  return [...items].sort((a, b) => {
    const scoreDiff = b.relevanceScore - a.relevanceScore;
    if (scoreDiff !== 0) return scoreDiff;

    return (
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  });
}

export async function fetchMemory(
  request: AgentRequest,
  context: AgentContext,
): Promise<AgentMemoryItem[]> {
  const rawContext = context as RawMemoryContext;
  const queryText = getQueryText(request);

  const extracted = extractStructuredMemory(rawContext, request);
  const deduped = dedupeMemory(extracted);
  const scored = deduped.map((item) => scoreMemoryItem(item, queryText));
  const sorted = sortMemory(scored);

  if (sorted.length > 0) {
    return sorted.slice(0, DEFAULT_FETCH_LIMIT);
  }

  return [
    {
      id: `mem-${request.requestId}`,
      userId: request.userId,
      kind: 'summary',
      content:
        'Memory layer is active, but no persisted or in-context memory items were available for this request.',
      relevanceScore: 0.35,
      createdAt: new Date().toISOString(),
      tags: ['memory', 'empty-state'],
      metadata: {
        sourceType: 'empty-state',
      },
    },
  ];
}

export function rankMemory(
  items: AgentMemoryItem[],
  query: string,
): AgentMemoryItem[] {
  return sortMemory(items.map((item) => scoreMemoryItem(item, query)));
}

export function buildMemoryContext(
  items: AgentMemoryItem[],
): AgentMemoryContext {
  const trimmed = items.slice(0, MAX_CONTEXT_ITEMS);

  const summary = trimmed.length
    ? trimmed
        .slice(0, MAX_SUMMARY_ITEMS)
        .map((item, index) => `${index + 1}. ${item.content}`)
        .join(' ')
    : 'No memory retrieved.';

  const kinds = uniqueStrings(trimmed.map((item) => item.kind));
  const source =
    trimmed.length > 0
      ? trimmed.some((item) => item.metadata?.sourceType === 'empty-state')
        ? 'none'
        : 'local'
      : 'none';

  return {
    items: trimmed,
    summary,
    source,
    metadata: {
      itemCount: trimmed.length,
      kinds,
      topScore: trimmed[0]?.relevanceScore ?? 0,
    },
  };
}

function shouldStoreAsPreference(queryText: string, answer: string): boolean {
  const combined = `${queryText} ${answer}`.toLowerCase();

  return /\b(i want|i prefer|always|never|haluan|mieluummin|älä|don’t)\b/.test(
    combined,
  );
}

function shouldStoreAsFact(queryText: string, answer: string): boolean {
  const combined = `${queryText} ${answer}`.toLowerCase();

  return /\b(is|are|works|supports|contains|on|has|voi|toimii|sisältää)\b/.test(
    combined,
  );
}

export async function maybeStoreMemory(
  request: AgentRequest,
  answer: string,
): Promise<void> {
  const normalizedAnswer = normalizeText(answer);
  if (!normalizedAnswer) return;

  const queryText = getQueryText(request);
  const shouldConsiderStoring =
    normalizedAnswer.length > 40 &&
    (queryText.length > 0 || normalizedAnswer.length > 120);

  if (!shouldConsiderStoring) return;

  const proposedKind = shouldStoreAsPreference(queryText, normalizedAnswer)
    ? 'preference'
    : shouldStoreAsFact(queryText, normalizedAnswer)
      ? 'fact'
      : 'summary';

  const candidate = {
    userId: request.userId,
    kind: proposedKind,
    content: clampText(
      queryText
        ? `${queryText} — ${normalizedAnswer}`
        : normalizedAnswer,
      280,
    ),
    createdAt: new Date().toISOString(),
    tags: ['candidate-memory', proposedKind],
  };

  void candidate;

  // TODO:
  // - Apply policy-based memory write decisions.
  // - Add privacy/redaction filtering before persistence.
  // - Persist durable memory records to the app's real memory store.
  // - Decide whether this should create summary/fact/preference/task memory kinds.
}
