import type { FinanceActionResult, FinanceAnalysis } from '@/lib/finance/types';

export type AgentIntent = 'finance' | 'analysis' | 'technical' | 'general';

export type AgentStepStatus = 'running' | 'completed' | 'failed';

export type AgentResponseStep = {
  action: string;
  status: AgentStepStatus;
  summary?: string;
  error?: string;
};

export type AgentResponseMetadata = {
  intent: AgentIntent;
  mode?: 'finance' | 'technical' | 'general';
  plan: string;
  steps: AgentResponseStep[];
  structuredData?: {
    finance?: FinanceAnalysis;
    actionResult?: FinanceActionResult;
    [key: string]: unknown;
  } | null;
  suggestedActions?: Array<{
    id: string;
    label: string;
    kind: 'finance' | 'technical' | 'general' | 'premium';
    payload?: Record<string, unknown>;
  }>;
  memoryUsed?: boolean;
  verificationPassed?: boolean;
  iterationCount?: number;
};

export type AgentResponse = {
  reply: string;
  metadata: AgentResponseMetadata;
};
