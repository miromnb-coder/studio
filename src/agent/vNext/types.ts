export type AgentRole = 'system' | 'user' | 'assistant' | 'tool';

export type AgentIntent =
  | 'compare'
  | 'finance'
  | 'planning'
  | 'productivity'
  | 'gmail'
  | 'coding'
  | 'memory'
  | 'research'
  | 'shopping'
  | 'general'
  | 'unknown';

export type AgentExecutionMode = 'sync' | 'stream';

export type AgentStepStatus = 'pending' | 'ready' | 'running' | 'completed' | 'failed' | 'skipped';

export type AgentToolName =
  | 'gmail'
  | 'memory'
  | 'calendar'
  | 'web'
  | 'compare'
  | 'file'
  | 'finance'
  | 'notes';

export type AgentMessage = {
  id?: string;
  role: AgentRole;
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
};

export type AgentRequest = {
  requestId: string;
  userId: string;
  sessionId?: string;
  message: string;
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  conversation?: AgentMessage[];
  metadata?: Record<string, unknown>;
  options?: Partial<AgentRuntimeOptions>;
};

export type AgentRuntimeOptions = {
  mode: AgentExecutionMode;
  maxPlanSteps: number;
  maxToolCalls: number;
  allowToolFallbacks: boolean;
  enableEvaluation: boolean;
  includeReasoningSummary: boolean;
  timeoutMs: number;
};

export type AgentContext = {
  nowIso: string;
  request: AgentRequest;
  runtime: AgentRuntimeOptions;
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  memoryContext?: AgentMemoryContext;
  toolResults?: AgentToolResult[];
};

export type AgentRouteResult = {
  intent: AgentIntent;
  confidence: number;
  reason: string;
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  multilingual?: boolean;
  requiresTools: AgentToolName[];
  shouldFetchMemory: boolean;
  suggestedExecutionMode: AgentExecutionMode;
  fallbackMessage?: string;
};

export type AgentPlanStep = {
  id: string;
  title: string;
  description: string;
  status: AgentStepStatus;
  priority: number;
  requiredTool?: AgentToolName;
  dependsOn?: string[];
  input?: Record<string, unknown>;
};

export type AgentPlan = {
  id: string;
  intent: AgentIntent;
  summary: string;
  steps: AgentPlanStep[];
  createdAt: string;
};

export type AgentToolCall = {
  callId: string;
  stepId: string;
  tool: AgentToolName;
  input: Record<string, unknown>;
};

export type AgentToolResult = {
  callId: string;
  stepId: string;
  tool: AgentToolName;
  ok: boolean;
  data: Record<string, unknown>;
  error?: string;
  latencyMs?: number;
};

export type AgentMemoryKind = 'preference' | 'fact' | 'goal' | 'summary' | 'history' | 'other';

export type AgentMemoryItem = {
  id: string;
  userId: string;
  kind: AgentMemoryKind;
  content: string;
  relevanceScore: number;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type AgentMemoryContext = {
  items: AgentMemoryItem[];
  summary: string;
  source: 'none' | 'local' | 'remote';
};

export type StructuredSectionTone =
  | 'default'
  | 'important'
  | 'success'
  | 'warning';

export type StructuredSection = {
  label?: string;
  content: string;
  tone?: StructuredSectionTone;
};

export type StructuredAction = {
  id: string;
  label: string;
  kind?: 'primary' | 'secondary';
};

export type StructuredSource = {
  id: string;
  label: string;
  used: boolean;
};

export type StructuredAnswer = {
  title?: string;
  summary?: string;
  sections?: StructuredSection[];
  bullets?: string[];
  actions?: StructuredAction[];
  sources?: StructuredSource[];
  outcome?: string;
  plainText?: string;
};

export type AgentAnswer = {
  text: string;
  structured?: StructuredAnswer;
};

export type AgentFinalAnswer = {
  text: string;
  structured?: StructuredAnswer;
  confidence: number;
  citations?: string[];
  followUps?: string[];
  structuredData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type AgentEvaluationResult = {
  passed: boolean;
  score: number;
  issues: string[];
  suggestedActions: string[];
};

export type AgentResponse = {
  requestId: string;
  route: AgentRouteResult;
  plan: AgentPlan;
  toolResults: AgentToolResult[];
  memory: AgentMemoryContext;
  answer: AgentFinalAnswer;
  evaluation?: AgentEvaluationResult;
  warnings: string[];
  createdAt: string;
};

export type AgentExecutionResult = {
  ok: boolean;
  response?: AgentResponse;
  error?: AgentErrorShape;
  timingsMs: {
    total: number;
    routing?: number;
    planning?: number;
    memory?: number;
    tools?: number;
    generation?: number;
    evaluation?: number;
  };
};

export type AgentStreamEvent = {
  type:
    | 'router_started'
    | 'router_completed'
    | 'planning_started'
    | 'planning_completed'
    | 'tool_started'
    | 'tool_completed'
    | 'memory_started'
    | 'memory_completed'
    | 'answer_delta'
    | 'answer_completed'
    | 'error';
  requestId: string;
  timestamp: string;
  payload?: Record<string, unknown>;
};

export type AgentErrorShape = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
};

export type AgentExecutionDependencies = {
  request: AgentRequest;
  context: AgentContext;
  route: AgentRouteResult;
  plan: AgentPlan;
};
