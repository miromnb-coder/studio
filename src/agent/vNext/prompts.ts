import type { AgentContext, AgentIntent, AgentPlan, AgentRequest, AgentRouteResult, AgentToolName } from './types';

const baseInstructions = [
  'You are the vNext orchestration brain for a premium operator-grade assistant.',
  'Prioritize correctness, user safety, and explicit assumptions.',
  'Prefer concise structured output over hidden chain-of-thought.',
].join('\n');

export function buildRouterPrompt(request: AgentRequest): string {
  return [
    baseInstructions,
    'Classify the intent and determine if tools and memory are needed.',
    `User message: ${request.message}`,
    'TODO: Add examples and confidence calibration rules per product telemetry.',
  ].join('\n\n');
}

export function buildPlannerPrompt(route: AgentRouteResult, context: AgentContext): string {
  return [
    baseInstructions,
    `Intent: ${route.intent}`,
    `Context time: ${context.nowIso}`,
    'Create a minimal high-value plan with ordered steps and dependencies.',
    'TODO: Add dynamic planning depth based on user tier and latency budget.',
  ].join('\n\n');
}

export function buildToolSelectionPrompt(intent: AgentIntent, availableTools: AgentToolName[]): string {
  return [
    baseInstructions,
    `Intent: ${intent}`,
    `Available tools: ${availableTools.join(', ')}`,
    'Select only tools that materially improve answer quality.',
    'TODO: Add cost-aware and permission-aware tool selection strategy.',
  ].join('\n\n');
}

export function buildMemoryRetrievalPrompt(request: AgentRequest, context: AgentContext): string {
  return [
    baseInstructions,
    `Message: ${request.message}`,
    `Conversation turns: ${context.request.conversation?.length ?? 0}`,
    'Retrieve only memory that changes decision quality.',
    'TODO: Add memory freshness weighting and conflict resolution policy.',
  ].join('\n\n');
}

export function buildGeneratorPrompt(params: {
  request: AgentRequest;
  route: AgentRouteResult;
  plan: AgentPlan;
  memorySummary: string;
}): string {
  return [
    baseInstructions,
    `Intent: ${params.route.intent}`,
    `Plan summary: ${params.plan.summary}`,
    `Memory summary: ${params.memorySummary || 'No memory available'}`,
    `User message: ${params.request.message}`,
    'Produce a clear, actionable final answer with optional follow-ups.',
    'TODO: Tune response style layers (coach, analyst, operator) by user preferences.',
  ].join('\n\n');
}

export function buildSummarizationPrompt(content: string): string {
  return [
    baseInstructions,
    'Summarize execution details into a compact operator log.',
    content,
    'TODO: Add token-budget aware compression rules.',
  ].join('\n\n');
}

export function buildFallbackPrompt(errorMessage: string): string {
  return [
    baseInstructions,
    'Generate a safe fallback response when execution fails or is incomplete.',
    `Error context: ${errorMessage}`,
    'TODO: Add user-tier specific fallback templates and graceful recovery cues.',
  ].join('\n\n');
}
