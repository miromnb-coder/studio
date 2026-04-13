import type { AgentExecutionMode, AgentIntent, AgentRuntimeOptions, AgentStepStatus, AgentToolName } from './types';

export const AGENT_VNEXT_DEFAULT_TIMEOUT_MS = 30_000;
export const AGENT_VNEXT_MAX_PLAN_STEPS = 8;
export const AGENT_VNEXT_MAX_TOOL_CALLS = 6;

export const AGENT_VNEXT_SUPPORTED_INTENTS: AgentIntent[] = [
  'compare',
  'finance',
  'planning',
  'productivity',
  'gmail',
  'coding',
  'memory',
  'research',
  'shopping',
  'general',
  'unknown',
];

export const AGENT_VNEXT_SUPPORTED_TOOLS: AgentToolName[] = [
  'gmail',
  'memory',
  'calendar',
  'web',
  'compare',
  'file',
  'finance',
  'notes',
];

export const AGENT_VNEXT_STEP_LABELS: Record<AgentStepStatus, string> = {
  pending: 'Pending',
  ready: 'Ready',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  skipped: 'Skipped',
};

export const AGENT_VNEXT_EXECUTION_MODES: AgentExecutionMode[] = ['sync', 'stream'];

export const AGENT_VNEXT_FALLBACK_MESSAGES = {
  generic: "I couldn't complete that request fully yet, but I can still help with a safer next step.",
  timeout: 'The request took longer than expected. Please try again with a narrower goal.',
  toolUnavailable: 'A required capability is not connected yet. I can continue with a no-tool answer.',
  missingContext: 'I need a bit more context before I can continue confidently.',
};

export const AGENT_VNEXT_DEFAULT_RUNTIME_OPTIONS: AgentRuntimeOptions = {
  mode: 'sync',
  maxPlanSteps: AGENT_VNEXT_MAX_PLAN_STEPS,
  maxToolCalls: AGENT_VNEXT_MAX_TOOL_CALLS,
  allowToolFallbacks: true,
  enableEvaluation: true,
  includeReasoningSummary: false,
  timeoutMs: AGENT_VNEXT_DEFAULT_TIMEOUT_MS,
};
