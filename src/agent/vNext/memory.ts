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
    .split(/[^a-z0-9äöå_-]+/i)
    .filter((token) => token.length > 1);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

function overlapScore(queryTokens: string[], haystack: string): number {
  if (!queryTokens.length) return 0;
  const text = haystack.toLowerCase();
  const matches = queryTokens.filter((token) => text.includes(token)).length;
  return matches / queryTokens.length;
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
      return 0.66;
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

function toMemoryItem(params: {
  id: string;
  userId: string;
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

function extractStructuredMemory(
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

  const normalizedExplicit = explicitMemory.map((item, index) =>
    toMemoryItem({
      id: item.id || `existing-memory-${index}`,
      userId,
      kind: item.kind || 'summary',
      content: item.content,
      createdAt: item.createdAt,
      tags: item.tags,
      relevanceScore: item.relevanceScore,
      metadata: item.metadata,
    }),
  );

  const notes = [...safeArray<RawNote>(context.notes), ...safeArray<RawNote>(context.userNotes)].map(
    (note, index) =>
      toMemoryItem({
        id: note.id || `note-${index}`,
        userId,
        kind: 'summary',
        content: [note.title, note.content].filter(Boolean).join(' — '),
        createdAt: note.updatedAt || note.createdAt,
        tags: ['note', ...(note.tags ?? [])],
        metadata: {
          sourceType: 'note',
          title: note.title,
        },
      }),
  );

  const facts = [...safeArray<RawFact>(context.facts), ...safeArray<RawFact>(context.savedFacts)].map(
    (fact, index) =>
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

  const conversations = [
    ...safeArray<RawConversation>(context.conversations),
    ...safeArray<RawConversation>(context.conversationList),
  ].map((conversation, index) =>
    toMemoryItem({
      id: conversation.id || `conversation-${index}`,
      userId,
      kind: 'history',
      content: [
        conversation.title,
        conversation.lastMessagePreview,
      ]
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

  const currentMessages = safeArray<RawMessage>(context.messages).map((message, index) =>
    toMemoryItem({
      id: message.id || `message-${index}`,
      userId,
      kind: message.role === 'user' ? 'history' : 'summary',
      content: message.content || '',
      createdAt: message.createdAt,
      tags: [
        'message',
        message.role || 'unknown',
        message.agent || message.agentMetadata?.operatorModules?.length
          ? 'agent'
          : '',
      ],
      metadata: {
        sourceType: 'message',
        role: message.role,
      },
    }),
  );

  const threadedMessages = Object.entries(context.messageState ?? {}).flatMap(
    ([conversationId, messages]) =>
      safeArray<RawMessage>(messages).map((message, index) =>
        toMemoryItem({
          id: message.id || `${conversationId}-message-${index}`,
          userId,
          kind: message.role === 'user' ? 'history' : 'summary',
          content: message.content || '',
          createdAt: message.createdAt,
          tags: [
            'thread-message',
            message.role || 'unknown',
            message.agent || message.agentMetadata?.operatorModules?.length
              ? 'agent'
              : '',
          ],
          metadata: {
            sourceType: 'thread-message',
            conversationId,
            role: message.role,
          },
        }),
      ),
  );

  const conversationObjectMessages = safeArray<RawMessage>(
    context.conversation?.messages,
  ).map((message, index) =>
    toMemoryItem({
      id: message.id || `active-conversation-message-${index}`,
      userId,
      kind: message.role === 'user' ? 'history' : 'summary',
      content: message.content || '',
      createdAt: message.createdAt,
      tags: [
        'active-conversation',
        message.role || 'unknown',
        message.agent || message.agentMetadata?.operatorModules?.length
          ? 'agent'
          : '',
      ],
      metadata: {
        sourceType: 'active-conversation-message',
        conversationId: context.conversation?.id,
        role: message.role,
      },
    }),
  );

  return [
    ...normalizedExplicit,
    ...notes,
    ...facts,
    ...conversations,
    ...currentMessages,
    ...threadedMessages,
    ...conversationObjectMessages,
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
  const recency = recencyScore(item.createdAt);
  const base = typeof item.relevanceScore === 'number' ? item.relevanceScore : 0.5;

  const relevanceScore = Number(
    Math.min(1, base * 0.45 + lexical * 0.4 + recency * 0.15).toFixed(4),
  );

  return {
    ...item,
    relevanceScore,
  };
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

  const sorted = scored.sort((a, b) => {
    const scoreDiff = b.relevanceScore - a.relevanceScore;
    if (scoreDiff !== 0) return scoreDiff;

    return (
      new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    );
  });

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
  return [...items]
    .map((item) => scoreMemoryItem(item, query))
    .sort((a, b) => {
      const scoreDiff = b.relevanceScore - a.relevanceScore;
      if (scoreDiff !== 0) return scoreDiff;
      return (
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
      );
    });
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

  // TODO:
  // - Apply policy-based memory write decisions.
  // - Add privacy/redaction filtering before persistence.
  // - Persist durable memory records to the app's real memory store.
  // - Decide whether this should create summary/fact/preference/task memory kinds.
}
