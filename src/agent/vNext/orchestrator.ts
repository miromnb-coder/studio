import { AGENT_VNEXT_DEFAULT_RUNTIME_OPTIONS } from './constants';
import { AgentExecutionError, normalizeAgentError } from './errors';
import { evaluateExecution } from './evaluator';
import { generateFinalAnswer, generateFinalAnswerStream } from './generator';
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
  AgentToolResult,
} from './types';

type ConversationMessage = {
  id?: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
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

function inferToolAction(
  tool: NonNullable<AgentPlan['steps'][number]['requiredTool']>,
  request: AgentRequest,
): string {
  const text = getRequestText(request).toLowerCase();

  switch (tool) {
    case 'gmail':
      if (text.includes('receipt') || text.includes('invoice')) {
        return 'scan_receipts';
      }
      if (text.includes('subscription') || text.includes('unsubscribe')) {
        return 'scan_subscriptions';
      }
      if (text.includes('reply') || text.includes('draft') || text.includes('email')) {
        return 'search';
      }
      return 'status';

    case 'calendar':
      if (
        text.includes('meeting') ||
        text.includes('availability') ||
        text.includes('schedule') ||
        text.includes('calendar') ||
        text.includes('kalenteri')
      ) {
        return 'availability';
      }
      return 'status';

    case 'memory':
      if (text.includes('remember') || text.includes('history') || text.includes('earlier')) {
        return 'retrieve';
      }
      return 'search';

    case 'web':
      return 'search';

    case 'compare':
      return 'compare';

    case 'file':
      return 'inspect';

    case 'finance':
      if (text.includes('scan') || text.includes('analyze')) {
        return 'scan';
      }
      return 'overview';

    case 'notes':
      if (text.includes('create note') || text.includes('save this') || text.includes('write this down')) {
        return 'create';
      }
      return 'list';

    default:
      return 'default';
  }
}

function extractEntities(text: string): string[] {
  const quoted = [...text.matchAll(/"([^"]+)"|'([^']+)'/g)]
    .map((match) => (match[1] || match[2] || '').trim())
    .filter(Boolean);

  const comparePatterns = [
    /(.+?)\s+(?:vs|versus|contra|gegen)\s+(.+?)(?:[.?!]|$)/i,
    /(?:compare|vertaa|compara|jämför)\s+(.+?)\s+(?:and|ja|y|och|und)\s+(.+?)(?:[.?!]|$)/i,
  ];

  const fromComparison = comparePatterns.flatMap((pattern) => {
    const match = text.match(pattern);
    if (!match) return [];
    return [match[1], match[2]].map((part) => part?.trim()).filter(Boolean) as string[];
  });

  return [...new Set([...quoted, ...fromComparison])]
    .map((item) => item.replace(/^[,.\s]+|[,.\s]+$/g, ''))
    .filter((item) => item.length > 1)
    .slice(0, 8);
}

function normalizeCompareLabel(value: string): string {
  return value
    .replace(
      /\b(which is better|kumpi kannattaa|for budget users|budjetilla|minulle|for me)\b/gi,
      '',
    )
    .replace(/[?!.]+$/g, '')
    .trim();
}

function extractCompareItems(text: string): string[] {
  const normalized = normalizeText(text);

  const patterns = [
    /(?:compare|vertaa)\s+(.+?)\s+(?:vs|versus)\s+(.+?)(?:[.?!]|$)/i,
    /(?:compare|vertaa)\s+(.+?)\s+(?:and|ja)\s+(.+?)(?:[.?!]|$)/i,
    /(.+?)\s+(?:vs|versus)\s+(.+?)(?:[.?!]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) continue;

    const left = normalizeCompareLabel(match[1]);
    const right = normalizeCompareLabel(match[2]);

    if (left && right) return [left, right];
  }

  return [];
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

  const entities = extractEntities(message);

  return {
    ...request,
    message,
    inputLanguage: requestedInputLanguage || undefined,
    responseLanguage: requestedResponseLanguage || undefined,
    metadata: {
      ...(request.metadata ?? {}),
      entities,
      recentConversationSummary: getRecentConversationSummary(request),
    },
  };
}

function buildToolInput(
  tool: NonNullable<AgentPlan['steps'][number]['requiredTool']>,
  context: AgentContext,
  plan: AgentPlan,
): Record<string, unknown> {
  const requestText = getRequestText(context.request);
  const recentConversation = getRecentConversationSummary(context.request);
  const compareItems = extractCompareItems(requestText);
  const normalizedEntities = extractEntities(requestText);
  const action = inferToolAction(tool, context.request);

  const base: Record<string, unknown> = {
    action,
    message: requestText,
    metadata: context.request.metadata ?? {},
    requestId: context.request.requestId,
    userId: context.request.userId,
    recentConversation,
    planIntent: plan.intent,
    memorySummary: context.memoryContext?.summary ?? '',
    inputLanguage: context.inputLanguage ?? context.request.inputLanguage ?? 'en',
    responseLanguage: context.responseLanguage ?? context.request.responseLanguage ?? 'en',
    entities: normalizedEntities,
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

    case 'gmail':
    case 'calendar':
    case 'finance':
    case 'file':
      return {
        ...base,
        query: requestText,
      };

    case 'notes':
      return {
        ...base,
        note: requestText,
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

export async function executePlanSteps(
  plan: AgentPlan,
  context: AgentContext,
): Promise<AgentToolResult[]> {
  const steps = sortStepsForExecution(plan).filter((step) =>
    Boolean(step.requiredTool),
  );

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

    const planningStarted = Date.now();
    const plan = createPlan(route, context);
    const planningMs = Date.now() - planningStarted;

    const memoryStarted = Date.now();
    const memory = await prepareMemory(
      normalizedRequest,
      context,
      route.shouldFetchMemory,
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
      request: normalizedRequest,
      route,
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
      request: normalizedRequest,
      route,
      plan,
      toolResults,
      memory,
      answer,
      evaluation,
    });

    agentLogger.info('vNext agent execution completed', {
      requestId: request.requestId,
      intent: route.intent,
      confidence: answer.confidence,
      score: evaluation?.score,
      stepCount: plan.steps.length,
      toolCount: toolResults.length,
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

    yield streamEvents.routerCompleted(normalizedRequest, {
      intent: route.intent,
      confidence: route.confidence,
      requiresTools: route.requiresTools,
    });

    yield streamEvents.planningStarted(normalizedRequest);

    const plan = createPlan(route, context);

    yield streamEvents.planningCompleted(normalizedRequest, {
      stepCount: plan.steps.length,
      intent: plan.intent,
    });

    yield streamEvents.memoryStarted(normalizedRequest);

    const memory = await prepareMemory(
      normalizedRequest,
      context,
      route.shouldFetchMemory,
    );

    yield streamEvents.memoryCompleted(normalizedRequest, {
      memoryCount: memory.items.length,
      source: memory.source,
    });

    const executionContext: AgentContext = {
      ...context,
      memoryContext: memory,
    };

    const orderedSteps = sortStepsForExecution(plan).filter((step) =>
      Boolean(step.requiredTool),
    );

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
      request: normalizedRequest,
      route,
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
