/**
 * @fileOverview Core types for Agent v4.2 Multi-Agent Architecture.
 */

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export interface ToolError {
  code: 'UNKNOWN_TOOL' | 'TOOL_EXECUTION_FAILED';
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolResult {
  action: string;
  output: any;
  error?: ToolError;
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
