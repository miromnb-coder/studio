export type AgentIntent =
  | 'general'
  | 'finance'
  | 'gmail'
  | 'productivity'
  | 'coding'
  | 'memory'
  | 'research'
  | 'compare'
  | 'planning'
  | 'execution'
  | 'email'
  | 'scheduling'
  | 'tool_use'
  | 'shopping'
  | 'unknown';

export type AgentExecutionMode = 'sync' | 'stream';

export type AgentToolName =
  | 'gmail'
  | 'memory'
  | 'calendar'
  | 'web'
  | 'compare'
  | 'file'
  | 'finance'
  | 'notes';

export type AgentPlanStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export type AgentMessageRole = 'system' | 'user' | 'assistant';

export type AgentRuntimeOptions = {
  maxPlanSteps?: number;
  allowToolFallbacks?: boolean;
  enableEvaluation?: boolean;
  maxToolCalls?: number;
  streamChunkSize?: number;
};

export type AgentConversationMessage = {
  id?: string;
  role: AgentMessageRole;
  content: string;
};

export type AgentRequestMetadata = Record<string, unknown> & {
  routerModel?: string;
  entities?: string[];
  multilingual?: boolean;
  recentConversationSummary?: string;
};

export type AgentRequest = {
  requestId: string;
  userId?: string;
  message?: string;
  input?: string;
  prompt?: string;
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  conversationId?: string;
  conversation?: AgentConversationMessage[];
  metadata?: AgentRequestMetadata;
  options?: AgentRuntimeOptions;
};

export type AgentRouteResult = {
  intent: AgentIntent;
  confidence: number;
  reason: string;
  requiresTools: AgentToolName[];
  shouldFetchMemory: boolean;
  suggestedExecutionMode: AgentExecutionMode;
  fallbackMessage?: string;
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  multilingual?: boolean;
  userGoal?: string;
  entities?: string[];
};

export type AgentPlanStep = {
  id: string;
  title: string;
  description: string;
  status: AgentPlanStepStatus;
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
};

export type AgentMemoryItemKind =
  | 'summary'
  | 'fact'
  | 'preference'
  | 'goal'
  | 'finance'
  | 'history'
  | 'other';

export type AgentMemoryItem = {
  id: string;
  userId?: string;
  kind: AgentMemoryItemKind;
  content: string;
  relevanceScore: number;
  createdAt: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
};

export type AgentMemoryContext = {
  items: AgentMemoryItem[];
  summary: string;
  source: 'local' | 'remote' | 'none';
};

export type AgentFinalAnswerMetadata = {
  intent?: AgentIntent;
  inputLanguage?: string;
  responseLanguage?: string;
  successfulTools?: AgentToolName[];
  failedTools?: AgentToolName[];
  planId?: string;
  stepCount?: number;
  mode?: 'model' | 'fallback';
};

export type AgentFinalAnswer = {
  text: string;
  confidence: number;
  followUps: string[];
  metadata?: AgentFinalAnswerMetadata;
  structuredData?: Record<string, unknown>;
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

export type AgentErrorShape = {
  code: string;
  message: string;
  retryable: boolean;
  details?: Record<string, unknown>;
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

export type AgentContext = {
  nowIso: string;
  request: AgentRequest;
  runtime: AgentRuntimeOptions;
  memoryContext?: AgentMemoryContext;
  toolResults?: AgentToolResult[];
  inputLanguage?: string;
  responseLanguage?: string;
  languageConfidence?: number;
  messages?: AgentConversationMessage[];
  conversation?: {
    id?: string;
    messages: AgentConversationMessage[];
  };
};

export type AgentStreamEvent =
  | {
      type: 'router_started';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'router_completed';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'planning_started';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'planning_completed';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'memory_started';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'memory_completed';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'tool_started';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'tool_completed';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    }
  | {
      type: 'answer_delta';
      requestId: string;
      timestamp: string;
      payload: {
        delta: string;
      };
    }
  | {
      type: 'answer_completed';
      requestId: string;
      timestamp: string;
      payload: {
        answer: AgentFinalAnswer;
      };
    }
  | {
      type: 'error';
      requestId: string;
      timestamp: string;
      payload?: Record<string, unknown>;
    };
