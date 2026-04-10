export type AgentIntentV8 = 'general' | 'finance' | 'gmail' | 'productivity' | 'unknown';

export type AgentModeV8 = 'general' | 'finance' | 'gmail' | 'productivity';

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
};

export type ToolNameV8 =
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
  status: 'completed' | 'failed';
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
  };
};

export type AgentRunInputV8 = {
  input: string;
  userId: string;
  history?: unknown[];
  memory?: MemoryEnvelopeV8 | null;
  productState: ProductStateV8;
};
