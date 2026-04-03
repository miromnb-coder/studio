/**
 * @fileOverview Core types for Agent v4.2 Multi-Agent Architecture.
 */

import { z } from 'zod';

export type Intent = 'finance' | 'time_optimizer' | 'monetization' | 'technical' | 'analysis' | 'general';

export const TOOL_ACTION_IDS = [
  'calendar.analyze',
  'todo.plan',
  'notes.summarize',
  'web.search',
  'file.analyze'
] as const;

export type ToolActionId = (typeof TOOL_ACTION_IDS)[number];

export interface AgentStep {
  action: ToolActionId;
  priority: 'high' | 'medium' | 'low';
  description?: string;
}

export const ToolExecutionInputSchema = z.object({
  action: z.enum(TOOL_ACTION_IDS),
  input: z.string().min(1),
  imageUri: z.string().url().optional(),
  context: z.record(z.string(), z.any()).optional()
});

export type ToolExecutionInput = z.infer<typeof ToolExecutionInputSchema>;

export const ToolMetadataSchema = z.object({
  latencyMs: z.number().nonnegative(),
  source: z.string().min(1),
  timestamp: z.string().min(1)
});

export const ToolErrorEnvelopeSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.string(), z.any()).optional()
});

export type ToolErrorEnvelope = z.infer<typeof ToolErrorEnvelopeSchema>;

export const ToolExecutionOutputSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), z.any()).nullable(),
  error: ToolErrorEnvelopeSchema.nullable(),
  metadata: ToolMetadataSchema
});

export type ToolExecutionOutput = z.infer<typeof ToolExecutionOutputSchema>;

export interface ToolModule {
  id: ToolActionId;
  execute: (payload: ToolExecutionInput) => Promise<ToolExecutionOutput>;
}

export interface ToolResult {
  action: ToolActionId;
  output: ToolExecutionOutput;
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
