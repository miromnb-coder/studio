export type AgentIntentV8 =
  | 'general'
  | 'finance'
  | 'gmail'
  | 'productivity'
  | 'coding'
  | 'memory'
  | 'unknown';

export type AgentModeV8 = 'general' | 'finance' | 'gmail' | 'productivity' | 'coding' | 'memory';

export type AgentRole = 'system' | 'assistant' | 'user';

export type AgentMessageV8 = {
  role: AgentRole;
  content: string;
};

export type ProductStateV8 = {
  plan: 'FREE' | 'PREMIUM';
  usage: {
    current: number;
    limit: number;
    remaining: number;
  };
  gmailConnected: boolean;
};

export type MemoryEnvelopeV8 = {
  summaryType?: 'finance' | 'general';
  summary?: string;
  financeProfile?: Record<string, unknown> | null;
  financeEvents?: Array<Record<string, unknown>>;
  semanticMemories?: Array<Record<string, unknown>>;
  summaries?: Array<Record<string, unknown>>;
};

export type UserMemoryTypeV8 = 'preference' | 'fact' | 'goal' | 'finance' | 'other';

export type UserMemoryItemV8 = {
  id?: string;
  userId: string;
  content: string;
  type: UserMemoryTypeV8;
  importance: number;
  relevanceScore?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AgentContextV8 = {
  user: {
    id: string;
    message: string;
  };
  conversation: AgentMessageV8[];
  memory: {
    summary: string;
    summaryType: 'finance' | 'general';
    financeProfile?: Record<string, unknown> | null;
    financeEvents?: Array<Record<string, unknown>>;
    semanticMemories?: Array<Record<string, unknown>>;
    relevantMemories: UserMemoryItemV8[];
  };
  environment: {
    gmailConnected: boolean;
    productState: ProductStateV8;
    nowIso: string;
  };
};

export type RouteResultV8 = {
  intent: AgentIntentV8;
  mode: AgentModeV8;
  confidence: number;
  reason: string;
  needsGmail: boolean;
  needsFinanceData: boolean;
};

export type ToolNameV8 =
  | 'gmail_fetch'
  | 'finance_read'
  | 'detect_leaks'
  | 'create_savings_plan'
  | 'find_alternatives'
  | 'draft_cancellation'
  | 'retrieve_structured_memory'
  | 'retrieve_semantic_memory'
  | 'persist_memory'
  | 'check_gmail_connection'
  | 'import_gmail_finance'
  | 'build_dashboard_snapshot'
  | 'generate_proactive_insights'
  | 'analyze_error'
  | 'suggest_fix';

export type PlanStepV8 = {
  id: string;
  title: string;
  tool: ToolNameV8;
  description: string;
  input: Record<string, unknown>;
  required: boolean;
};

export type ExecutionPlanV8 = {
  intent: AgentIntentV8;
  mode: AgentModeV8;
  summary: string;
  steps: PlanStepV8[];
};

export type ToolResultV8 = {
  ok: boolean;
  tool: ToolNameV8;
  output: Record<string, unknown>;
  error?: string;
};

export type ExecutionStepResultV8 = {
  stepId: string;
  title: string;
  tool: ToolNameV8;
  status: 'completed' | 'failed' | 'skipped';
  summary: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
};

export type ExecutionResultV8 = {
  steps: ExecutionStepResultV8[];
  structuredData: Record<string, unknown>;
};

export type SuggestedActionV8 = {
  id: string;
  label: string;
  kind: 'finance' | 'gmail' | 'productivity' | 'general' | 'premium';
  payload?: Record<string, unknown>;
};

export type SystemStateV8 = 'idle' | 'understanding' | 'planning' | 'executing' | 'responding';

export type AgentResponseV8 = {
  reply: string;
  metadata: {
    intent: AgentIntentV8;
    mode: AgentModeV8;
    plan: string;
    steps: ExecutionStepResultV8[];
    structuredData: Record<string, unknown>;
    suggestedActions: SuggestedActionV8[];
    memoryUsed: boolean;
    verificationPassed: boolean;
    state: SystemStateV8;
  };
};

export type AgentRunInputV8 = {
  input: string;
  userId: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  productState: ProductStateV8;
};

export type AgentCriticInputV8 = {
  userMessage: string;
  intent: AgentIntentV8;
  reply: string;
  usedTools: ToolNameV8[];
  plan: ExecutionPlanV8;
};
