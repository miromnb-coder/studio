/**
 * @fileOverview Core types for Agent v4.2 Multi-Agent Architecture.
 */

import type { ZodType } from 'zod';

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export interface AgentStep {
  action: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  payload?: unknown;
}

export interface ToolExecutionError {
  code: 'UNKNOWN_TOOL' | 'INVALID_TOOL_INPUT' | 'INVALID_TOOL_OUTPUT' | 'TOOL_EXECUTION_FAILED';
  message: string;
  details?: unknown;
}

export interface ToolResult {
  action: string;
  output: any;
  error?: ToolExecutionError;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: ZodType<TInput>;
  outputSchema: ZodType<TOutput>;
  execute: (payload: TInput) => Promise<TOutput>;
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
