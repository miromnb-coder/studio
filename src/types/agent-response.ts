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
  plan: string;
  steps: AgentResponseStep[];
  structuredData?: Record<string, unknown>;
  memoryUsed?: boolean;
  iterationCount?: number;
};

export type AgentResponse = {
  reply: string;
  metadata: AgentResponseMetadata;
};
