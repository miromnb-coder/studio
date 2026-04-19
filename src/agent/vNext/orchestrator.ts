import { AGENT_VNEXT_DEFAULT_RUNTIME_OPTIONS } from './constants';
import { AgentExecutionError, normalizeAgentError } from './errors';
import { evaluateExecution } from './evaluator';
import { generateFinalAnswer, generateFinalAnswerStream } from './generator';
import { detectIntegrationIntent } from '@/agent/integrations/integration-intent';
import { agentLogger } from './logger';
import { buildMemoryContext, fetchMemory, rankMemory } from './memory';
import { createPlan } from './planner';
import { routeIntent } from './router';
import { executeTool } from './tools';
import { streamEvents } from './streaming';
import type {
  AgentContext,
  AgentExecutionResult,
  AgentMemoryContext,
  AgentPlan,
  AgentRequest,
  AgentResponse,
  AgentRuntimeOptions,
  AgentStreamEvent,
  AgentToolCall,
  AgentToolName,
  AgentToolResult,
} from './types';

type ConversationMessage = {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ToolActionInference = {
  action: string;
  source: 'explicit_metadata' | 'integration_intent' | 'route_intent' | 'tool_default';
  confidence: number;
  fallback: boolean;
  reason: string;
};

const TOOL_ACTION_ALLOWLIST: Record<AgentToolName, readonly string[]> = {
  gmail: [
    'status',
    'search',
    'scan_subscriptions',
    'subscriptions',
    'scan_receipts',
    'urgent',
    'digest',
    'draft_reply',
    'summarize_inbox',
    'inbox_summary',
  ],
  memory: ['status', 'search', 'retrieve', 'store'],
  calendar: [
    'status',
    'availability',
    'today_plan',
    'find_focus_time',
    'check_busy_week',
    'weekly_reset',
    'list_events',
  ],
  web: ['search', 'fetch', 'status'],
  compare: ['compare'],
  file: ['inspect', 'parse', 'summarize'],
  finance: ['overview', 'status', 'scan'],
  notes: ['list', 'search', 'create'],
};

function mergeRuntimeOptions(request: AgentRequest): AgentRuntimeOptions {
  return {
    ...AGENT_VNEXT_DEFAULT_RUNTIME_OPTIONS,
    ...request.options,
  };
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function getRequestText(request: AgentRequest): string {
  const candidates = [
    (request as AgentRequest & { message?: string }).message,
    (request as AgentRequest & { input?: string }).input,
    (request as AgentRequest & { prompt?: string }).prompt,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function getConversationMessages(request: AgentRequest): ConversationMessage[] {
  const raw =
    (request as AgentRequest & { conversation?: unknown }).conversation ?? [];

  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (
        item,
      ): item is {
        id?: string;
        role: 'system' | 'user' | 'assistant';
        content: string;
      } =>
        Boolean(item) &&
        typeof item === 'object' &&
        ((item as { role?: unknown }).role === 'system' ||
          (item as { role?: unknown }).role === 'user' ||
          (item as { role?: unknown }).role === 'assistant') &&
        typeof (item as { content?: unknown }).content === 'string',
    )
    .map((item) => ({
      id: item.id,
      role: item.role,
      content: normalizeText(item.content),
    }))
    .filter((item) => item.content.length > 0);
}

function getRecentConversationSummary(request: AgentRequest): string {
  const messages = getConversationMessages(request);
  if (!messages.length) return '';

  return messages
    .slice(-6)
    .map((message) => `${message.role}: ${message.content}`)
    .join('\n');
}

function buildBaseContext(
  request: AgentRequest,
  runtime: AgentRuntimeOptions,
): AgentContext {
  const conversationMessages = getConversationMessages(request);

  return {
    nowIso: new Date().toISOString(),
    request,
    runtime,
    messages: conversationMessages,
    conversation: {
      id:
        (request as AgentRequest & { conversationId?: string }).conversationId ??
        undefined,
      messages: conversationMessages,
    },
  } as AgentContext;
}

function shouldStopOnToolFailure(context: AgentContext): boolean {
  return !context.runtime.allowToolFallbacks;
}

function allowlistedAction(
  tool: AgentToolName,
  action: unknown,
): string | null {
  const normalized = normalizeLower(action);
  if (!normalized) return null;
  return TOOL_ACTION_ALLOWLIST[tool].includes(normalized) ? normalized : null;
}

function getExplicitActionFromMetadata(
  tool: AgentToolName,
  metadata: Record<string, unknown>,
): string | null {
  const specificKey =
    tool === 'gmail'
      ? 'gmailAction'
      : tool === 'calendar'
        ? 'calendarAction'
        : tool === 'memory'
          ? 'memoryAction'
          : tool === 'web'
            ? 'webAction'
            : tool === 'compare'
              ? 'compareAction'
              : tool === 'file'
                ? 'fileAction'
                : tool === 'finance'
                  ? 'financeAction'
                  : 'notesAction';

  return (
    allowlistedAction(tool, metadata[specificKey]) ??
    allowlistedAction(tool, metadata.action)
  );
}

function extractEntities(text: string, metadata?: Record<string, unknown>): string[] {
  const metaEntities = asStringArray(metadata?.entities);

  const quoted = [...text.matchAll(/"([^"]+)"|'([^']+)'/g)]
    .map((match) => normalizeText(match[1] || match[2] || ''))
    .filter(Boolean);

  return unique([...metaEntities, ...quoted]).slice(0, 8);
}

function extractCompareItems(
  text: string,
  metadata?: Record<string, unknown>,
): string[] {
  const metadataItems = unique([
    ...asStringArray(metadata?.items),
    ...asStringArray(metadata?.options),
    ...asStringArray(metadata?.entities),
  ]).slice(0, 6);

  if (metadataItems.length >= 2) return metadataItems;

  const normalized = normalizeText(text);
  if (!normalized) return metadataItems;

  const vsMatch = normalized.match(/(.+?)\s+(?:vs|versus)\s+(.+?)(?:[.?!]|$)/i);
  if (vsMatch) {
    const left = normalizeText(vsMatch[1]).replace(/[?!.]+$/g, '');
    const right = normalizeText(vsMatch[2]).replace(/[?!.]+$/g, '');
    if (left && right) return unique([left, right]).slice(0, 6);
  }

  return metadataItems;
}

function buildWebQuery(
  request: AgentRequest,
  routeIntent?: string,
  compareItems?: string[],
): string {
  const text = getRequestText(request);

  if (compareItems && compareItems.length >= 2) {
    return `${compareItems[0]} vs ${compareItems[1]} comparison`;
  }

  if (routeIntent === 'research') return text;
  if (routeIntent === 'compare') return text;
  if (routeIntent === 'shopping') return text;
  if (routeIntent === 'gmail') return `${text} email workflow`;

  return text;
}

function normalizeMultilingualRequest(request: AgentRequest): AgentRequest {
  const message = getRequestText(request);
  const requestedResponseLanguage = normalizeText(
    (request as AgentRequest & { responseLanguage?: string }).responseLanguage,
  );
  const requestedInputLanguage = normalizeText(
    (request as AgentRequest & { inputLanguage?: string }).inputLanguage,
  );

  const metadata = asObject(request.metadata);
  const entities = extractEntities(message, metadata);

  return {
    ...request,
    message,
    inputLanguage: requestedInputLanguage || undefined,
    responseLanguage: requestedResponseLanguage || undefined,
    metadata: {
      ...metadata,
      entities,
      recentConversationSummary: getRecentConversationSummary(request),
    },
  };
}

function inferToolAction(params: {
  tool: AgentToolName;
  request: AgentRequest;
  planIntent: AgentPlan['intent'];
  routeIntent?: string;
}): ToolActionInference {
  const { tool, request, planIntent } = params;
  const requestText = getRequestText(request);
  const metadata = asObject(request.metadata);

  const explicit = getExplicitActionFromMetadata(tool, metadata);
  if (explicit) {
    return {
      action: explicit,
      source: 'explicit_metadata',
      confidence: 0.98,
      fallback: false,
      reason: `Explicit ${tool} action was provided in metadata.`,
    };
  }

  const integrationIntent = detectIntegrationIntent(requestText, {
    routeIntent: params.routeIntent || planIntent,
    currentTools: [tool],
    metadata,
  });

  if (tool === 'gmail' && integrationIntent.gmailAction) {
    return {
      action: integrationIntent.gmailAction,
      source: 'integration_intent',
      confidence: Math.max(0.72, integrationIntent.confidence),
      fallback: false,
      reason: `Integration intent selected Gmail action "${integrationIntent.gmailAction}".`,
    };
  }

  if (tool === 'calendar' && integrationIntent.calendarAction) {
    return {
      action: integrationIntent.calendarAction,
      source: 'integration_intent',
      confidence: Math.max(0.72, integrationIntent.confidence),
      fallback: false,
      reason: `Integration intent selected Calendar action "${integrationIntent.calendarAction}".`,
    };
  }

  switch (tool) {
    case 'gmail':
      if (planIntent === 'finance') {
        return {
          action: 'subscriptions',
          source: 'route_intent',
          confidence: 0.78,
          fallback: false,
          reason: 'Finance-oriented requests are best served by subscription/billing email analysis.',
        };
      }
      if (planIntent === 'gmail') {
        return {
          action: 'inbox_summary',
          source: 'route_intent',
          confidence: 0.74,
          fallback: false,
          reason: 'Gmail intent defaults to inbox summary when no stronger action signal exists.',
        };
      }
      if (planIntent === 'planning' || planIntent === 'productivity') {
        return {
          action: 'digest',
          source: 'route_intent',
          confidence: 0.68,
          fallback: false,
          reason: 'Planning/productivity requests benefit from compact inbox digest by default.',
        };
      }
      return {
        action: 'inbox_summary',
        source: 'tool_default',
        confidence: 0.56,
        fallback: true,
        reason: 'Defaulted to inbox summary because no stronger Gmail action signal was available.',
      };

    case 'calendar':
      if (planIntent === 'planning' || planIntent === 'productivity') {
        return {
          action: 'today_plan',
          source: 'route_intent',
          confidence: 0.78,
          fallback: false,
          reason: 'Planning/productivity requests default to a day-plan/schedule-oriented action.',
        };
      }
      return {
        action: 'today_plan',
        source: 'tool_default',
        confidence: 0.58,
        fallback: true,
        reason: 'Defaulted to today_plan because no stronger Calendar action signal was available.',
      };

    case 'memory':
      if (planIntent === 'memory') {
        return {
          action: 'retrieve',
          source: 'route_intent',
          confidence: 0.8,
          fallback: false,
          reason: 'Memory intent should retrieve personal or historical context.',
        };
      }
      return {
        action: 'search',
        source: 'tool_default',
        confidence: 0.62,
        fallback: true,
        reason: 'Defaulted to memory search for supporting context.',
      };

    case 'web':
      return {
        action: 'search',
        source: 'tool_default',
        confidence: 0.7,
        fallback: true,
        reason: 'Web tool defaults to search.',
      };

    case 'compare':
      return {
        action: 'compare',
        source: 'tool_default',
        confidence: 0.76,
        fallback: true,
        reason: 'Compare tool defaults to structured comparison.',
      };

    case 'file':
      return {
        action: 'inspect',
        source: 'tool_default',
        confidence: 0.74,
        fallback: true,
        reason: 'File tool defaults to inspection.',
      };

    case 'finance':
      return {
        action: 'overview',
        source: 'tool_default',
        confidence: 0.68,
        fallback: true,
        reason: 'Finance tool defaults to overview when no stronger action exists.',
      };

    case 'notes':
      if (metadata.saveToNotes === true || metadata.createNote === true) {
        return {
          action: 'create',
          source: 'explicit_metadata',
          confidence: 0.92,
          fallback: false,
          reason: 'Metadata explicitly indicates note creation.',
        };
      }
      return {
        action: 'list',
        source: 'tool_default',
        confidence: 0.64,
        fallback: true,
        reason: 'Notes tool defaults to list/search mode.',
      };

    default:
      return {
        action: 'default',
        source: 'tool_default',
        confidence: 0.3,
        fallback: true,
        reason: 'Unknown tool default action.',
      };
  }
}

function buildToolInput(
  tool: AgentToolName,
  context: AgentContext,
  plan: AgentPlan,
): Record<string, unknown> {
  const requestText = getRequestText(context.request);
  const recentConversation = getRecentConversationSummary(context.request);
  const metadata = asObject(context.request.metadata);
  const normalizedEntities = extractEntities(requestText, metadata);
  const compareItems = extractCompareItems(requestText, metadata);
  const actionInference = inferToolAction({
    tool,
    request: context.request,
    planIntent: plan.intent,
    routeIntent: plan.intent,
  });

  const base: Record<string, unknown> = {
    action: actionInference.action,
    message: requestText,
    metadata,
    requestId: context.request.requestId,
    userId: context.request.userId,
    recentConversation,
    planIntent: plan.intent,
    memorySummary: context.memoryContext?.summary ?? '',
    inputLanguage: context.inputLanguage ?? context.request.inputLanguage ?? 'en',
    responseLanguage: context.responseLanguage ?? context.request.responseLanguage ?? 'en',
    entities: normalizedEntities,
    source_used: actionInference.source,
    action_used: actionInference.action,
    fallback_used: actionInference.fallback,
    action_confidence: actionInference.confidence,
    action_reason: actionInference.reason,
  };

  switch (tool) {
    case 'compare':
      return {
        ...base,
        items: compareItems.length ? compareItems : normalizedEntities.slice(0, 2),
        criteria:
          /budget|budjet/i.test(requestText)
            ? ['price', 'value', 'longevity']
            : ['features', 'price', 'overall fit'],
      };

    case 'web':
      return {
        ...base,
        query: buildWebQuery(context.request, plan.intent, compareItems),
      };

    case 'memory':
      return {
        ...base,
        query: requestText || recentConversation || 'current conversation context',
      };

    case 'notes':
      return {
        ...base,
        note: requestText,
        query: requestText,
      };

    case 'gmail':
    case 'calendar':
    case 'finance':
    case 'file':
      return {
        ...base,
        query: requestText,
      };

    default:
      return base;
  }
}

function createToolCall(
  stepId: string,
  tool: NonNullable<AgentPlan['steps'][number]['requiredTool']>,
  context: AgentContext,
  plan: AgentPlan,
): AgentToolCall {
  return {
    callId: `call-${context.request.requestId}-${stepId}`,
    stepId,
    tool,
    input: buildToolInput(tool, context, plan),
  };
}

function sortStepsForExecution(plan: AgentPlan): AgentPlan['steps'] {
  return [...plan.steps].sort((a, b) => a.priority - b.priority);
}

function getExecutableToolSteps(plan: AgentPlan, context: AgentContext): AgentPlan['steps'] {
  const ordered = sortStepsForExecution(plan).filter((step) => Boolean(step.requiredTool));
  const limited = ordered.slice(0, Math.max(1, context.runtime.maxToolCalls));

  const seen = new Set<string>();
  const deduped: AgentPlan['steps'] = [];

  for (const step of limited) {
    const tool = step.requiredTool;
    if (!tool) continue;

    const signature = `${tool}:${step.id}`;
    if (seen.has(signature)) continue;
    seen.add(signature);
    deduped.push(step);
  }

  return deduped;
}

export async function executePlanSteps(
  plan: AgentPlan,
  context: AgentContext,
): Promise<AgentToolResult[]> {
  const steps = getExecutableToolSteps(plan, context);
  const results: AgentToolResult[] = [];

  for (const step of steps) {
    if (!step.requiredTool) continue;

    const call = createToolCall(step.id, step.requiredTool, context, plan);
    const result = await executeTool(call, context);
    results.push(result);

    if (!result.ok && shouldStopOnToolFailure(context)) {
      throw new AgentExecutionError({
        code: 'TOOL_EXECUTION_FAILED',
        message: `Tool step failed: ${step.id}`,
        retryable: true,
        details: {
          stepId: step.id,
          tool: step.requiredTool,
          error: result.error,
        },
      });
    }
  }

  return results;
}

async function prepareMemory(
  request: AgentRequest,
  context: AgentContext,
  shouldFetch: boolean,
): Promise<AgentMemoryContext> {
  if (!shouldFetch) {
    return buildMemoryContext([]);
  }

  const query = getRequestText(request) || getRecentConversationSummary(request);
  const fetched = await fetchMemory(request, context);
  const ranked = rankMemory(fetched, query);
  return buildMemoryContext(ranked);
}

function buildResponse(params: {
  request: AgentRequest;
  route: AgentResponse['route'];
  plan: AgentPlan;
  toolResults: AgentToolResult[];
  memory: AgentMemoryContext;
  answer: AgentResponse['answer'];
  evaluation?: AgentResponse['evaluation'];
}): AgentResponse {
  return {
    requestId: params.request.requestId,
    route: params.route,
    plan: params.plan,
    toolResults: params.toolResults,
    memory: params.memory,
    answer: params.answer,
    evaluation: params.evaluation,
    warnings: params.evaluation?.issues ?? [],
    createdAt: new Date().toISOString(),
  };
}

export async function runAgentVNext(
  request: AgentRequest,
): Promise<AgentExecutionResult> {
  const startedAt = Date.now();

  try {
    const normalizedRequest = normalizeMultilingualRequest(request);
    const runtime = mergeRuntimeOptions(normalizedRequest);
    const context = buildBaseContext(normalizedRequest, runtime);

    const routingStarted = Date.now();
    const route = await routeIntent(normalizedRequest);
    const routingMs = Date.now() - routingStarted;

    context.inputLanguage = route.inputLanguage ?? normalizedRequest.inputLanguage;
    context.responseLanguage =
      route.responseLanguage ?? normalizedRequest.responseLanguage;
    context.languageConfidence =
      route.languageConfidence ?? normalizedRequest.languageConfidence;

    const resolvedInputLanguage = context.inputLanguage ?? normalizedRequest.inputLanguage;
    const resolvedResponseLanguage =
      context.responseLanguage ?? normalizedRequest.responseLanguage;
    const resolvedLanguageConfidence =
      context.languageConfidence ?? normalizedRequest.languageConfidence;

    const requestWithLanguage: AgentRequest = {
      ...normalizedRequest,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: resolvedLanguageConfidence,
    };

    const routeWithLanguage = {
      ...route,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: resolvedLanguageConfidence,
    };

    const planningStarted = Date.now();
    const plan = createPlan(routeWithLanguage, context);
    const planningMs = Date.now() - planningStarted;

    const memoryStarted = Date.now();
    const memory = await prepareMemory(
      requestWithLanguage,
      context,
      routeWithLanguage.shouldFetchMemory,
    );
    const memoryMs = Date.now() - memoryStarted;

    const executionContext: AgentContext = {
      ...context,
      memoryContext: memory,
    };

    const toolsStarted = Date.now();
    const toolResults = await executePlanSteps(plan, executionContext);
    const toolsMs = Date.now() - toolsStarted;

    const generationStarted = Date.now();
    const answer = await generateFinalAnswer({
      request: requestWithLanguage,
      route: routeWithLanguage,
      plan,
      context: {
        ...executionContext,
        toolResults,
      },
      toolResults,
      memorySummary: memory.summary,
    });
    const generationMs = Date.now() - generationStarted;

    const evaluationStarted = Date.now();
    const evaluation = runtime.enableEvaluation
      ? evaluateExecution({
          plan,
          toolResults,
          answer,
        })
      : undefined;
    const evaluationMs = Date.now() - evaluationStarted;

    const response = buildResponse({
      request: requestWithLanguage,
      route: routeWithLanguage,
      plan,
      toolResults,
      memory,
      answer,
      evaluation,
    });

    agentLogger.info('vNext agent execution completed', {
      requestId: request.requestId,
      intent: routeWithLanguage.intent,
      confidence: answer.confidence,
      routingConfidence: routeWithLanguage.confidence,
      score: evaluation?.score,
      stepCount: plan.steps.length,
      toolCount: toolResults.length,
      inputLanguage: routeWithLanguage.inputLanguage,
      responseLanguage: routeWithLanguage.responseLanguage,
    });

    return {
      ok: true,
      response,
      timingsMs: {
        total: Date.now() - startedAt,
        routing: routingMs,
        planning: planningMs,
        memory: memoryMs,
        tools: toolsMs,
        generation: generationMs,
        evaluation: evaluationMs,
      },
    };
  } catch (error) {
    const normalized = normalizeAgentError(error);

    agentLogger.error('vNext agent execution failed', {
      requestId: request.requestId,
      error: normalized,
    });

    return {
      ok: false,
      error: normalized,
      timingsMs: {
        total: Date.now() - startedAt,
      },
    };
  }
}

export async function* runAgentVNextStream(
  request: AgentRequest,
): AsyncGenerator<AgentStreamEvent> {
  const normalizedRequest = normalizeMultilingualRequest(request);
  const runtime = mergeRuntimeOptions(normalizedRequest);
  const context = buildBaseContext(normalizedRequest, runtime);

  try {
    yield streamEvents.routerStarted(normalizedRequest);

    const route = await routeIntent(normalizedRequest);

    context.inputLanguage = route.inputLanguage ?? normalizedRequest.inputLanguage;
    context.responseLanguage =
      route.responseLanguage ?? normalizedRequest.responseLanguage;
    context.languageConfidence =
      route.languageConfidence ?? normalizedRequest.languageConfidence;

    const resolvedInputLanguage = context.inputLanguage ?? normalizedRequest.inputLanguage;
    const resolvedResponseLanguage =
      context.responseLanguage ?? normalizedRequest.responseLanguage;
    const resolvedLanguageConfidence =
      context.languageConfidence ?? normalizedRequest.languageConfidence;

    const requestWithLanguage: AgentRequest = {
      ...normalizedRequest,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: resolvedLanguageConfidence,
    };

    const routeWithLanguage = {
      ...route,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: resolvedLanguageConfidence,
    };

    yield streamEvents.routerCompleted(normalizedRequest, {
      intent: routeWithLanguage.intent,
      confidence: routeWithLanguage.confidence,
      requiresTools: routeWithLanguage.requiresTools,
      inputLanguage: routeWithLanguage.inputLanguage,
      responseLanguage: routeWithLanguage.responseLanguage,
      languageConfidence: routeWithLanguage.languageConfidence,
    });

    yield streamEvents.planningStarted(normalizedRequest);

    const plan = createPlan(routeWithLanguage, context);

    yield streamEvents.planningCompleted(normalizedRequest, {
      stepCount: plan.steps.length,
      intent: plan.intent,
    });

    yield streamEvents.memoryStarted(normalizedRequest);

    const memory = await prepareMemory(
      requestWithLanguage,
      context,
      routeWithLanguage.shouldFetchMemory,
    );

    yield streamEvents.memoryCompleted(normalizedRequest, {
      memoryCount: memory.items.length,
      source: memory.source,
    });

    const executionContext: AgentContext = {
      ...context,
      memoryContext: memory,
    };

    const orderedSteps = getExecutableToolSteps(plan, executionContext);
    const toolResults: AgentToolResult[] = [];

    for (const step of orderedSteps) {
      if (!step.requiredTool) continue;

      yield streamEvents.toolStarted(normalizedRequest, {
        stepId: step.id,
        tool: step.requiredTool,
      });

      const call = createToolCall(
        step.id,
        step.requiredTool,
        executionContext,
        plan,
      );
      const result = await executeTool(call, executionContext);
      toolResults.push(result);

      yield streamEvents.toolCompleted(normalizedRequest, {
        stepId: result.stepId,
        tool: result.tool,
        ok: result.ok,
      });

      if (!result.ok && shouldStopOnToolFailure(executionContext)) {
        throw new AgentExecutionError({
          code: 'TOOL_EXECUTION_FAILED',
          message: `Tool step failed: ${step.id}`,
          retryable: true,
          details: {
            stepId: step.id,
            tool: step.requiredTool,
            error: result.error,
          },
        });
      }
    }

    for await (const event of generateFinalAnswerStream({
      request: requestWithLanguage,
      route: routeWithLanguage,
      plan,
      context: {
        ...executionContext,
        toolResults,
      },
      toolResults,
      memorySummary: memory.summary,
    })) {
      yield event;
    }
  } catch (error) {
    const normalized = normalizeAgentError(error);

    agentLogger.error('vNext streaming execution failed', {
      requestId: request.requestId,
      error: normalized,
    });

    yield streamEvents.error(
      normalizedRequest,
      normalized as unknown as Record<string, unknown>,
    );
  }
}
