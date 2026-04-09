/**
 * @fileOverview Core types for Agent Engine v7.
 */

export type AgentIntent = 'finance' | 'analysis' | 'technical' | 'general';

export type ToolName = 'analyze' | 'detect_leaks' | 'general_reason';

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface RouteResult {
  intent: AgentIntent;
  confidence: number;
  reason: string;
}

export interface PlanStep {
  id: string;
  tool: ToolName;
  reason: string;
  input: Record<string, unknown>;
}

export interface ExecutionPlan {
  intent: AgentIntent;
  summary: string;
  steps: PlanStep[];
}

export interface UserContext {
  userId: string;
  preferences: string[];
  goals: string[];
  summary?: string;
  summaryType?: 'finance' | 'general';
  financeProfile?: Record<string, unknown> | null;
  financeEvents?: Array<Record<string, unknown>>;
  summaries?: Array<Record<string, unknown>>;
}

export interface ToolContext {
  userId: string;
  input: string;
  history: AgentMessage[];
  imageUri?: string;
  memory: UserContext;
}

export interface ToolResult {
  ok: boolean;
  tool: ToolName;
  output: Record<string, unknown>;
  error?: string;
}

export interface ExecutionStepResult {
  stepId: string;
  tool: ToolName;
  status: 'success' | 'error';
  reason: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  error?: string;
}

export interface ExecutionResult {
  steps: ExecutionStepResult[];
  structuredData: Record<string, unknown>;
}

export interface AgentMetadataV7 {
  version: 'v7';
  intent: AgentIntent;
  planSummary: string;
  memoryUsed: boolean;
  debug: {
    routeReason: string;
    stepCount: number;
  };
}

export interface AgentRunResultV7 {
  stream?: AsyncIterable<unknown>;
  finalText?: string;
  metadata: AgentMetadataV7;
  steps: ExecutionStepResult[];
  structuredData: Record<string, unknown>;
}
