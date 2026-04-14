import type {
  AgentContext,
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
} from './types';

export type AgentToolHandler = (
  call: AgentToolCall,
  context: AgentContext,
) => Promise<AgentToolResult>;

export type AgentToolRegistry = Record<AgentToolName, AgentToolHandler>;

type ToolInput = Record<string, unknown>;

type ExecutionMetadata = {
  placeholder?: boolean;
  requiresProvider?: boolean;
  requiresAuth?: boolean;
  requiredScopes?: string[];
  nextAction?: string;
  summary?: string;
};

type CompareScorecard = {
  item: string;
  scores: Record<string, number>;
  total: number;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function asObject(value: unknown): ToolInput {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ToolInput;
  }
  return {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function asMessageArray(
  value: unknown,
): Array<{ role?: string; content?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { role?: string; content?: string } =>
      Boolean(item) && typeof item === 'object',
  );
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown tool execution error';
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function uniqueStrings(items: string[]): string[] {
  return unique(items.map((item) => normalizeText(item)).filter(Boolean));
}

function buildSuccess(
  call: AgentToolCall,
  tool: AgentToolName,
  data: Record<string, unknown>,
  meta: ExecutionMetadata = {},
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: true,
    data: {
      ...data,
      meta,
    },
  };
}

function buildFailure(
  call: AgentToolCall,
  tool: AgentToolName,
  error: string,
  data: Record<string, unknown> = {},
): AgentToolResult {
  return {
    callId: call.callId,
    stepId: call.stepId,
    tool,
    ok: false,
    data,
    error,
  };
}

function hasConnectedProvider(
  context: AgentContext,
  provider: string,
): boolean {
  const ctx = context as AgentContext & {
    connectors?: Record<string, unknown>;
    integrations?: Record<string, unknown>;
    user?: { integrations?: Record<string, unknown> };
    request?: { metadata?: Record<string, unknown> };
  };

  const connectorValue = ctx.connectors?.[provider];
  const integrationValue = ctx.integrations?.[provider];
  const userIntegrationValue = ctx.user?.integrations?.[provider];
  const requestIntegrationValue =
    typeof ctx.request?.metadata?.[`${provider}Connected`] === 'boolean'
      ? ctx.request.metadata[`${provider}Connected`]
      : undefined;

  return Boolean(
    connectorValue ||
      integrationValue ||
      userIntegrationValue ||
      requestIntegrationValue,
  );
}

function getContextMemory(context: AgentContext): unknown[] {
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

function getContextNotes(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    notes?: unknown[];
    userNotes?: unknown[];
  };

  return ctx.notes ?? ctx.userNotes ?? [];
}

function getConversationMessages(context: AgentContext): Array<{
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

function getRequestText(context: AgentContext): string {
  const request = context.request as AgentContext['request'] & {
    message?: string;
    input?: string;
    prompt?: string;
  };

  return normalizeText(request.message || request.input || request.prompt || '');
}

function lowerIncludesAny(text: string, patterns: string[]): boolean {
  const lowered = text.toLowerCase();
  return patterns.some((pattern) => lowered.includes(pattern.toLowerCase()));
}

function buildPlaceholderProviderResult(
  call: AgentToolCall,
  tool: AgentToolName,
  notes: string,
  extra: Record<string, unknown> = {},
): AgentToolResult {
  return buildSuccess(
    call,
    tool,
    {
      placeholder: true,
      receivedInput: call.input,
      ...extra,
    },
    {
      placeholder: true,
      requiresProvider: true,
      summary: notes,
      nextAction: 'Wire provider adapter and permission checks.',
    },
  );
}

function summarizeMemoryItem(item: unknown): string {
  if (!item || typeof item !== 'object') return '';
  const record = item as Record<string, unknown>;
  return (
    normalizeText(record.content) ||
    normalizeText(record.summary) ||
    normalizeText(record.text) ||
    normalizeText(record.title)
  );
}

function rankTextByQuery(items: string[], query: string): string[] {
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

function inferEmailScope(text: string): string {
  const lowered = text.toLowerCase();

  if (
    lowerIncludesAny(lowered, [
      'receipt',
      'invoice',
      'kuitti',
      'lasku',
      'factura',
    ])
  ) {
    return 'receipts';
  }

  if (
    lowerIncludesAny(lowered, [
      'subscription',
      'unsubscribe',
      'trial',
      'tilaus',
      'suscrip',
    ])
  ) {
    return 'subscriptions';
  }

  if (lowerIncludesAny(lowered, ['reply', 'draft', 'vastaa', 'luonnos'])) {
    return 'reply';
  }

  return 'general';
}

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return (
    normalizeText(input.query) ||
    normalizeText(input.message) ||
    getRequestText(context)
  );
}

function normalizeComparisonItems(input: ToolInput): string[] {
  const items = [
    ...asStringArray(input.items),
    ...asStringArray(input.options),
    ...asStringArray(input.entities),
  ];

  return uniqueStrings(items).slice(0, 6);
}

function inferComparisonCriteria(input: ToolInput, requestText: string): string[] {
  const explicit = asStringArray(input.criteria);
  if (explicit.length) return explicit;

  const lowered = requestText.toLowerCase();
  if (lowerIncludesAny(lowered, ['budget', 'cheap', 'price', 'budjet'])) {
    return ['price', 'value', 'longevity'];
  }
  if (lowerIncludesAny(lowered, ['camera', 'photo', 'video'])) {
    return ['camera', 'video', 'overall fit'];
  }
  if (lowerIncludesAny(lowered, ['battery', 'power', 'charge'])) {
    return ['battery', 'efficiency', 'overall fit'];
  }

  return ['features', 'price', 'overall fit'];
}

function scoreItemAgainstCriterion(item: string, criterion: string): number {
  const seed = `${item.toLowerCase()}::${criterion.toLowerCase()}`;
  let hash = 0;

  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000;
  }

  return 5 + (hash % 6);
}

function buildCompareScorecards(
  items: string[],
  criteria: string[],
): CompareScorecard[] {
  return items.map((item) => {
    const scores: Record<string, number> = {};

    for (const criterion of criteria) {
      scores[criterion] = scoreItemAgainstCriterion(item, criterion);
    }

    const total = Object.values(scores).reduce((sum, value) => sum + value, 0);

    return {
      item,
      scores,
      total,
    };
  });
}

async function gmailTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'inspect';
  const connected = hasConnectedProvider(context, 'gmail');
  const query = extractRequestedQuery(call, context);
  const scope = inferEmailScope(query);

  if (!connected) {
    return buildFailure(call, 'gmail', 'Gmail is not connected.', {
      action,
      scope,
      canConnect: true,
      suggestedRoute: '/control',
      suggestedConnector: 'gmail',
    });
  }

  switch (action) {
    case 'status':
      return buildSuccess(
        call,
        'gmail',
        {
          action,
          connected: true,
          availableOperations: [
            'status',
            'search',
            'scan_subscriptions',
            'scan_receipts',
            'summarize_inbox',
            'draft_reply',
          ],
        },
        {
          requiresAuth: true,
          requiredScopes: ['gmail.readonly'],
          summary: 'Gmail connection is available.',
        },
      );

    case 'search':
    case 'scan_subscriptions':
    case 'scan_receipts':
    case 'summarize_inbox':
    case 'draft_reply':
      return buildPlaceholderProviderResult(
        call,
        'gmail',
        'Gmail is connected. Provider-specific mailbox execution should be wired here.',
        {
          action,
          connected: true,
          query,
          scope,
          recommendedOperation:
            action === 'search'
              ? scope === 'receipts'
                ? 'scan_receipts'
                : scope === 'subscriptions'
                  ? 'scan_subscriptions'
                  : scope === 'reply'
                    ? 'draft_reply'
                    : 'summarize_inbox'
              : action,
        },
      );

    default:
      return buildFailure(
        call,
        'gmail',
        `Unsupported gmail action: ${action}`,
        { action, query },
      );
  }
}

async function memoryTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'search';
  const query =
    normalizeText(input.query) ||
    normalizeText(input.message) ||
    getRequestText(context);

  const memoryItems = getContextMemory(context);
  const normalizedItems = memoryItems
    .map(summarizeMemoryItem)
    .filter(Boolean);

  const ranked = rankTextByQuery(normalizedItems, query);

  if (action === 'status') {
    return buildSuccess(
      call,
      'memory',
      {
        action,
        itemCount: normalizedItems.length,
      },
      {
        summary: `Memory context contains ${normalizedItems.length} items.`,
      },
    );
  }

  if (action === 'search' || action === 'retrieve') {
    return buildSuccess(
      call,
      'memory',
      {
        action,
        query,
        matches: ranked.slice(0, 10),
        totalMatches: normalizedItems.length,
      },
      {
        summary: ranked.length
          ? 'Returned memory candidates from current context.'
          : 'No memory candidates were available from current context.',
        nextAction: 'Replace with ranked semantic memory retrieval.',
      },
    );
  }

  if (action === 'store') {
    return buildPlaceholderProviderResult(
      call,
      'memory',
      'Memory write path should be connected to persistent store.',
      { action, query },
    );
  }

  return buildFailure(call, 'memory', `Unsupported memory action: ${action}`, {
    action,
  });
}

async function calendarTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'availability';
  const query = extractRequestedQuery(call, context);
  const connected =
    hasConnectedProvider(context, 'calendar') ||
    hasConnectedProvider(context, 'google-calendar');

  if (!connected) {
    return buildFailure(call, 'calendar', 'Calendar is not connected.', {
      action,
      canConnect: true,
      suggestedRoute: '/control',
      suggestedConnector: 'google-calendar',
    });
  }

  return buildPlaceholderProviderResult(
    call,
    'calendar',
    'Calendar provider execution should be connected here.',
    { action, connected: true, query },
  );
}

async function webTool(
  call: AgentToolCall,
  _context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const query = typeof input.query === 'string' ? input.query : '';
  const action =
    typeof input.action === 'string' ? input.action : 'search';

  if (!query && action === 'search') {
    return buildFailure(call, 'web', 'Web search requires a query.', {
      action,
    });
  }

  return buildPlaceholderProviderResult(
    call,
    'web',
    'Web retrieval adapter should be connected with source filtering.',
    { action, query },
  );
}

async function compareTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const requestText =
    normalizeText(input.message) || getRequestText(context);
  const items = normalizeComparisonItems(input);
  const criteria = inferComparisonCriteria(input, requestText);

  if (items.length < 2) {
    return buildFailure(
      call,
      'compare',
      'Compare tool requires at least two items.',
      { itemCount: items.length, items },
    );
  }

  const scorecards = buildCompareScorecards(items, criteria).sort(
    (a, b) => b.total - a.total,
  );

  const winner = scorecards[0];
  const runnerUp = scorecards[1];

  return buildSuccess(
    call,
    'compare',
    {
      comparedItems: items,
      criteria,
      scorecards,
      winner: winner?.item,
      runnerUp: runnerUp?.item,
      margin:
        typeof winner?.total === 'number' && typeof runnerUp?.total === 'number'
          ? winner.total - runnerUp.total
          : undefined,
      deterministicFrameworkReady: true,
    },
    {
      summary: winner
        ? `Prepared a structured comparison. Current winner: ${winner.item}.`
        : 'Prepared a structured comparison.',
      nextAction: 'Replace heuristic scoring with live product or evidence-backed scoring.',
    },
  );
}

async function fileTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'inspect';
  const query = extractRequestedQuery(call, context);

  return buildPlaceholderProviderResult(
    call,
    'file',
    'Secure file retrieval and parsing should be wired here.',
    { action, query },
  );
}

async function financeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'overview';
  const query = extractRequestedQuery(call, context);

  const ctx = context as AgentContext & {
    finance?: Record<string, unknown>;
    financeSummary?: Record<string, unknown>;
    request?: { metadata?: Record<string, unknown> };
  };

  const financeContext =
    ctx.finance ??
    ctx.financeSummary ??
    (typeof ctx.request?.metadata?.finance === 'object'
      ? (ctx.request.metadata.finance as Record<string, unknown>)
      : null);

  if (action === 'status') {
    return buildSuccess(
      call,
      'finance',
      {
        action,
        available: Boolean(financeContext),
      },
      {
        summary: 'Finance context inspected.',
      },
    );
  }

  if (financeContext) {
    return buildSuccess(
      call,
      'finance',
      {
        action,
        query,
        financeContext,
      },
      {
        summary: 'Returned finance context from current request state.',
        nextAction: 'Replace with connector-driven financial analysis.',
      },
    );
  }

  return buildPlaceholderProviderResult(
    call,
    'finance',
    'Finance connectors and normalized schemas should be connected here.',
    { action, query },
  );
}

async function notesTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'list';
  const query = extractRequestedQuery(call, context);
  const notes = getContextNotes(context);
  const normalizedNotes = notes
    .map(summarizeMemoryItem)
    .filter(Boolean);

  if (action === 'list' || action === 'search') {
    const rankedNotes = rankTextByQuery(normalizedNotes, query);

    return buildSuccess(
      call,
      'notes',
      {
        action,
        query,
        notes: rankedNotes.slice(0, 10),
        totalNotes: normalizedNotes.length,
      },
      {
        summary: rankedNotes.length
          ? 'Returned notes from current context.'
          : 'No note content was available in current context.',
        nextAction: 'Replace with persistent notes provider.',
      },
    );
  }

  if (action === 'create') {
    return buildPlaceholderProviderResult(
      call,
      'notes',
      'Notes creation should be connected to persistent notes storage.',
      { action, note: normalizeText(input.note) || query },
    );
  }

  return buildFailure(call, 'notes', `Unsupported notes action: ${action}`, {
    action,
  });
}

const registry: AgentToolRegistry = {
  gmail: gmailTool,
  memory: memoryTool,
  calendar: calendarTool,
  web: webTool,
  compare: compareTool,
  file: fileTool,
  finance: financeTool,
  notes: notesTool,
};

export function getToolRegistry(): AgentToolRegistry {
  return registry;
}

export function hasTool(tool: AgentToolName): boolean {
  return tool in registry;
}

export async function executeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const handler = registry[call.tool];

  if (!handler) {
    return buildFailure(call, call.tool, `Tool not found: ${call.tool}`);
  }

  try {
    return await handler(call, context);
  } catch (error) {
    return buildFailure(call, call.tool, toErrorMessage(error), {
      receivedInput: call.input,
    });
  }
}

export async function executeTools(
  calls: AgentToolCall[],
  context: AgentContext,
): Promise<AgentToolResult[]> {
  const results: AgentToolResult[] = [];

  for (const call of calls) {
    results.push(await executeTool(call, context));
  }

  return results;
}

export function listSupportedTools(): AgentToolName[] {
  return Object.keys(registry) as AgentToolName[];
}

export function describeTool(tool: AgentToolName): {
  name: AgentToolName;
  summary: string;
  commonActions: string[];
} {
  switch (tool) {
    case 'gmail':
      return {
        name: 'gmail',
        summary: 'Email search, subscription scan, receipt scan, and draft workflows.',
        commonActions: [
          'status',
          'search',
          'scan_subscriptions',
          'scan_receipts',
          'summarize_inbox',
          'draft_reply',
        ],
      };
    case 'memory':
      return {
        name: 'memory',
        summary: 'Retrieve, search, and later store memory context.',
        commonActions: ['status', 'search', 'retrieve', 'store'],
      };
    case 'calendar':
      return {
        name: 'calendar',
        summary: 'Availability, scheduling, and calendar-related actions.',
        commonActions: ['availability', 'create_event', 'list_events', 'status'],
      };
    case 'web':
      return {
        name: 'web',
        summary: 'Live web retrieval and source-based research.',
        commonActions: ['search', 'fetch', 'status'],
      };
    case 'compare':
      return {
        name: 'compare',
        summary: 'Deterministic structured comparisons between options.',
        commonActions: ['compare'],
      };
    case 'file':
      return {
        name: 'file',
        summary: 'Inspect and parse uploaded or referenced files.',
        commonActions: ['inspect', 'parse', 'summarize'],
      };
    case 'finance':
      return {
        name: 'finance',
        summary: 'Financial summaries, scans, and connector-driven analysis.',
        commonActions: ['overview', 'status', 'scan'],
      };
    case 'notes':
      return {
        name: 'notes',
        summary: 'List, search, and create note content.',
        commonActions: ['list', 'search', 'create'],
      };
    default:
      return {
        name: tool,
        summary: 'Unknown tool.',
        commonActions: [],
      };
  }
}

export function getToolDescriptions(): Array<ReturnType<typeof describeTool>> {
  return listSupportedTools().map(describeTool);
}

export function getToolNamesForIntent(intent: string): AgentToolName[] {
  switch (intent) {
    case 'gmail':
    case 'email':
      return ['gmail', 'memory'];
    case 'finance':
      return ['finance', 'memory', 'notes'];
    case 'productivity':
    case 'execution':
      return ['calendar', 'notes', 'memory'];
    case 'coding':
      return ['file', 'web', 'memory'];
    case 'shopping':
      return ['compare', 'web', 'finance', 'memory'];
    case 'research':
      return ['web', 'compare', 'memory'];
    case 'memory':
      return ['memory', 'notes'];
    case 'planning':
    case 'scheduling':
      return ['calendar', 'memory'];
    case 'compare':
      return ['compare', 'web', 'memory'];
    default:
      return ['memory'];
  }
}

export function getConversationContextSnapshot(context: AgentContext): {
  memoryCount: number;
  noteCount: number;
  messageCount: number;
  connectedProviders: string[];
} {
  const connectedProviders = [
    hasConnectedProvider(context, 'gmail') ? 'gmail' : null,
    hasConnectedProvider(context, 'calendar') ||
    hasConnectedProvider(context, 'google-calendar')
      ? 'calendar'
      : null,
    hasConnectedProvider(context, 'google-drive') ? 'google-drive' : null,
    hasConnectedProvider(context, 'github') ? 'github' : null,
    hasConnectedProvider(context, 'outlook') ? 'outlook' : null,
    hasConnectedProvider(context, 'browser') ? 'browser' : null,
  ].filter(Boolean) as string[];

  return {
    memoryCount: getContextMemory(context).length,
    noteCount: getContextNotes(context).length,
    messageCount: getConversationMessages(context).length,
    connectedProviders,
  };
}
