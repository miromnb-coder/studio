import { z } from 'zod';

import {
  AGENT_VNEXT_EXECUTION_MODES,
  AGENT_VNEXT_MAX_PLAN_STEPS,
  AGENT_VNEXT_MAX_TOOL_CALLS,
  AGENT_VNEXT_SUPPORTED_INTENTS,
  AGENT_VNEXT_SUPPORTED_TOOLS,
} from './constants';

export const agentRequestSchema = z.object({
  requestId: z.string().min(1),
  userId: z.string().min(1),
  sessionId: z.string().optional(),
  message: z.string().min(1),
  conversation: z
    .array(
      z.object({
        role: z.enum(['system', 'user', 'assistant', 'tool']),
        content: z.string(),
      }),
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
  options: z
    .object({
      mode: z.enum(AGENT_VNEXT_EXECUTION_MODES as [string, ...string[]]).optional(),
      maxPlanSteps: z.number().int().positive().max(AGENT_VNEXT_MAX_PLAN_STEPS).optional(),
      maxToolCalls: z.number().int().positive().max(AGENT_VNEXT_MAX_TOOL_CALLS).optional(),
      allowToolFallbacks: z.boolean().optional(),
      enableEvaluation: z.boolean().optional(),
      includeReasoningSummary: z.boolean().optional(),
      timeoutMs: z.number().int().positive().optional(),
    })
    .optional(),
});

export const agentPlanStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['pending', 'ready', 'running', 'completed', 'failed', 'skipped']),
  priority: z.number().int().min(1).max(5),
  requiredTool: z.enum(AGENT_VNEXT_SUPPORTED_TOOLS as [string, ...string[]]).optional(),
  dependsOn: z.array(z.string()).optional(),
  input: z.record(z.unknown()).optional(),
});

export const agentToolResultSchema = z.object({
  callId: z.string().min(1),
  stepId: z.string().min(1),
  tool: z.enum(AGENT_VNEXT_SUPPORTED_TOOLS as [string, ...string[]]),
  ok: z.boolean(),
  data: z.record(z.unknown()),
  error: z.string().optional(),
  latencyMs: z.number().nonnegative().optional(),
});

export const agentMemoryItemSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  kind: z.enum(['preference', 'fact', 'goal', 'summary', 'history', 'other']),
  content: z.string().min(1),
  relevanceScore: z.number().min(0).max(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const agentFinalAnswerSchema = z.object({
  text: z.string().min(1),
  confidence: z.number().min(0).max(1),
  citations: z.array(z.string()).optional(),
  followUps: z.array(z.string()).optional(),
  structuredData: z.record(z.unknown()).optional(),
});

export const agentResponseSchema = z.object({
  requestId: z.string().min(1),
  route: z.object({
    intent: z.enum(AGENT_VNEXT_SUPPORTED_INTENTS as [string, ...string[]]),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
    requiresTools: z.array(z.enum(AGENT_VNEXT_SUPPORTED_TOOLS as [string, ...string[]])),
    shouldFetchMemory: z.boolean(),
    suggestedExecutionMode: z.enum(AGENT_VNEXT_EXECUTION_MODES as [string, ...string[]]),
    fallbackMessage: z.string().optional(),
  }),
  plan: z.object({
    id: z.string(),
    intent: z.enum(AGENT_VNEXT_SUPPORTED_INTENTS as [string, ...string[]]),
    summary: z.string(),
    steps: z.array(agentPlanStepSchema),
    createdAt: z.string(),
  }),
  toolResults: z.array(agentToolResultSchema),
  memory: z.object({
    items: z.array(agentMemoryItemSchema),
    summary: z.string(),
    source: z.enum(['none', 'local', 'remote']),
  }),
  answer: agentFinalAnswerSchema,
  evaluation: z
    .object({
      passed: z.boolean(),
      score: z.number().min(0).max(1),
      issues: z.array(z.string()),
      suggestedActions: z.array(z.string()),
    })
    .optional(),
  warnings: z.array(z.string()),
  createdAt: z.string(),
});
