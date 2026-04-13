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

function asObject(value: unknown): ToolInput {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ToolInput;
  }
  return {};
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown tool execution error';
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
  };

  const connectorValue = ctx.connectors?.[provider];
  const integrationValue = ctx.integrations?.[provider];
  const userIntegrationValue = ctx.user?.integrations?.[provider];

  return Boolean(connectorValue || integrationValue || userIntegrationValue);
}

function getContextMemory(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    memory?: unknown[];
    memories?: unknown[];
    retrievedMemory?: unknown[];
  };

  return ctx.memory ?? ctx.memories ?? ctx.retrievedMemory ?? [];
}

function getContextNotes(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    notes?: unknown[];
    userNotes?: unknown[];
  };

  return ctx.notes ?? ctx.userNotes ?? [];
}

function getConversationMessages(context: AgentContext): unknown[] {
  const ctx = context as AgentContext & {
    messages?: unknown[];
    conversation?: { messages?: unknown[] };
  };

  return ctx.messages ?? ctx.conversation?.messages ?? [];
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

async function gmailTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'inspect';
  const connected = hasConnectedProvider(context, 'gmail');

  if (!connected) {
    return buildFailure(call, 'gmail', 'Gmail is not connected.', {
      action,
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
        { action, connected: true },
      );

    default:
      return buildFailure(
        call,
        'gmail',
        `Unsupported gmail action: ${action}`,
        { action },
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
  const memoryItems = getContextMemory(context);

  if (action === 'status') {
    return buildSuccess(
      call,
      'memory',
      {
        action,
        itemCount: memoryItems.length,
      },
      {
        summary: `Memory context contains ${memoryItems.length} items.`,
      },
    );
  }

  if (action === 'search' || action === 'retrieve') {
    const query = typeof input.query === 'string' ? input.query : '';
    return buildSuccess(
      call,
      'memory',
      {
        action,
        query,
        matches: memoryItems.slice(0, 10),
        totalMatches: memoryItems.length,
      },
      {
        summary: 'Returned memory candidates from current context.',
        nextAction: 'Replace with ranked semantic memory retrieval.',
      },
    );
  }

  if (action === 'store') {
    return buildPlaceholderProviderResult(
      call,
      'memory',
      'Memory write path should be connected to persistent store.',
      { action },
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
    { action, connected: true },
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

function normalizeComparisonItems(input: ToolInput): unknown[] {
  if (Array.isArray(input.items)) return input.items;
  if (Array.isArray(input.options)) return input.options;
  return [];
}

async function compareTool(
  call: AgentToolCall,
  _context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const items = normalizeComparisonItems(input);
  const criteria = Array.isArray(input.criteria) ? input.criteria : [];

  if (items.length < 2) {
    return buildFailure(
      call,
      'compare',
      'Compare tool requires at least two items.',
      { itemCount: items.length },
    );
  }

  return buildSuccess(
    call,
    'compare',
    {
      comparedItems: items,
      criteria,
      deterministicFrameworkReady: true,
    },
    {
      summary: 'Comparison scaffold prepared.',
      nextAction: 'Implement ranking/scoring logic for compared items.',
    },
  );
}

async function fileTool(
  call: AgentToolCall,
  _context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'inspect';

  return buildPlaceholderProviderResult(
    call,
    'file',
    'Secure file retrieval and parsing should be wired here.',
    { action },
  );
}

async function financeTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'overview';

  const ctx = context as AgentContext & {
    finance?: Record<string, unknown>;
    financeSummary?: Record<string, unknown>;
  };

  if (action === 'status') {
    return buildSuccess(
      call,
      'finance',
      {
        action,
        available: Boolean(ctx.finance || ctx.financeSummary),
      },
      {
        summary: 'Finance context inspected.',
      },
    );
  }

  return buildPlaceholderProviderResult(
    call,
    'finance',
    'Finance connectors and normalized schemas should be connected here.',
    { action },
  );
}

async function notesTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const input = asObject(call.input);
  const action =
    typeof input.action === 'string' ? input.action : 'list';
  const notes = getContextNotes(context);

  if (action === 'list' || action === 'search') {
    return buildSuccess(
      call,
      'notes',
      {
        action,
        notes: notes.slice(0, 10),
        totalNotes: notes.length,
      },
      {
        summary: 'Returned notes from current context.',
        nextAction: 'Replace with persistent notes provider.',
      },
    );
  }

  if (action === 'create') {
    return buildPlaceholderProviderResult(
      call,
      'notes',
      'Notes creation should be connected to persistent notes storage.',
      { action },
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
      return ['gmail', 'memory'];
    case 'finance':
      return ['finance', 'memory', 'notes'];
    case 'productivity':
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
