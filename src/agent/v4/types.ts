/**
 * @fileOverview Core types for Agent v4.2 Multi-Agent Architecture.
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ToolResult {
  action: string;
  output: any;
  error?: string;
}

export interface CriticFeedback {
  score: number;
  issues: string[];
  needs_revision: boolean;
}

export interface AgentContext {
  input: string;
  history: any[];
  memory: any;
  imageUri?: string;
  language: string;
  intent: Intent;
  plan: AgentStep[];
  toolResults: ToolResult[];
  criticFeedback?: CriticFeedback;
  finalResponse?: any;
  fastPathUsed: boolean;
}

export interface AgentApiResponse {
  analysis: string;
  plan: string[];
  actions: string[];
  result: string;
}

export interface AgentStreamEvent {
  type: 'metadata' | 'token' | 'final' | 'error';
  payload: unknown;
}

export interface RunAgentV4StreamResult {
  stream: AsyncIterable<any> | null;
  response: AgentApiResponse | null;
  metadata: {
    intent: Intent;
    fastPathUsed: boolean;
    language?: string;
    plan?: string[];
    actions?: string[];
    memoryUsed?: boolean;
    critic?: CriticFeedback;
  };
}
