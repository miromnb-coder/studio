export type KivoToolTier = 'free' | 'premium';
export type KivoToolCapability = 'calendar' | 'gmail' | 'memory' | 'tasks' | 'web' | 'files' | 'finance' | 'productivity';

export type KivoToolName =
  | 'calendar.today'
  | 'calendar.search'
  | 'calendar.create_event'
  | 'calendar.plan_day'
  | 'calendar.status'
  | 'gmail.recent'
  | 'gmail.status'
  | 'gmail.inbox_summary'
  | 'gmail.finance_scan'
  | 'memory.search'
  | 'memory.write'
  | 'tasks.create'
  | 'tasks.plan'
  | 'productivity.next_action'
  | 'compare.smart'
  | 'finance.analyze';

export type KivoToolContext = {
  userId?: string;
  conversationId?: string;
  requestId?: string;
};

export type KivoToolInput = {
  message?: string;
  query?: string;
  title?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

export type KivoToolResult<TData extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  tool: KivoToolName;
  title: string;
  summary: string;
  data?: TData;
  error?: string;
  requiresConnection?: boolean;
  connection?: 'gmail' | 'calendar' | 'memory' | 'none';
};

export type KivoToolDefinition = {
  name: KivoToolName;
  title: string;
  description: string;
  capability: KivoToolCapability;
  tier: KivoToolTier;
  requiresAuth?: boolean;
  requiresConnection?: 'gmail' | 'calendar' | 'memory' | 'none';
  inputSchema: Record<string, unknown>;
};

export type KivoToolHandler = (input: KivoToolInput, context: KivoToolContext) => Promise<KivoToolResult>;
