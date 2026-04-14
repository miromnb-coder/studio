import type { FinanceActionResult, FinanceAnalysis } from '@/lib/finance/types';

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
  | 'unknown';

export type AgentMode =
  | 'general'
  | 'finance'
  | 'gmail'
  | 'productivity'
  | 'coding'
  | 'memory'
  | 'operator';

export type AgentStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped';

export type AgentResponseStep = {
  id?: string;
  action: string;
  status: AgentStepStatus;
  summary?: string;
  error?: string;
  tool?: string;
};

export type AgentSuggestedAction = {
  id: string;
  label: string;
  kind: 'finance' | 'gmail' | 'productivity' | 'general' | 'premium';
  payload?: Record<string, unknown>;
};

export type OperatorModule = {
  id: string;
  title:
    | 'Best Next Action'
    | 'Fastest Saving Opportunity'
    | 'Risk To Watch'
    | 'What I Need From You'
    | 'Recommended This Week';
  summary: string;
  impactLabel?: string;
  recommendationId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
};

export type AgentStructuredData = {
  finance?: FinanceAnalysis;
  actionResult?: FinanceActionResult;
  route?: {
    intent?: string;
    confidence?: number;
    reason?: string;
    requiresTools?: string[];
    shouldFetchMemory?: boolean;
    suggestedExecutionMode?: 'sync' | 'stream';
    fallbackMessage?: string;
  };
  evaluation?: {
    passed?: boolean;
    score?: number;
    issues?: string[];
    suggestedActions?: string[];
    metadata?: Record<string, unknown>;
  };
  toolResults?: Array<{
    callId?: string;
    stepId?: string;
    tool?: string;
    ok?: boolean;
    error?: string;
    data?: Record<string, unknown>;
  }>;
  memory?: {
    summary?: string;
    source?: string;
    items?: Array<{
      id?: string;
      kind?: string;
      content?: string;
      relevanceScore?: number;
      createdAt?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
    }>;
    metadata?: Record<string, unknown>;
  };
  goal_understanding?: Record<string, unknown>;
  response_mode?: string;
  operator_alerts?: Array<Record<string, unknown>>;
  [key: string]: unknown;
} | null;

export type AgentResponseMetadata = {
  intent: AgentIntent;
  mode?: AgentMode;
  plan: string;
  steps: AgentResponseStep[];
  structuredData?: AgentStructuredData;
  suggestedActions?: AgentSuggestedAction[];
  operatorModules?: OperatorModule[];
  memoryUsed?: boolean;
  verificationPassed?: boolean;
  iterationCount?: number;
};

export type AgentResponse = {
  reply: string;
  metadata: AgentResponseMetadata;
};
