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

function mergeRuntimeOptions(request: AgentRequest): AgentRuntimeOptions {
  return {
    ...AGENT_VNEXT_DEFAULT_RUNTIME_OPTIONS,
    ...request.options,
  };
}

function getRequestText(request: AgentRequest): string {
  const candidates = [
    (request as AgentRequest & { message?: string }).message,
    (request as AgentRequest & { input?: string }).input,
    (request as AgentRequest & { prompt?: string }).prompt,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  return '';
}

function buildBaseContext(
  request: AgentRequest,
  runtime: AgentRuntimeOptions,
): AgentContext {
  return {
    nowIso: new Date().toISOString(),
    request,
    runtime,
  };
}

function shouldStopOnToolFailure(context: AgentContext): boolean {
  return !context.runtime.allowToolFallbacks;
}

function createToolCall(
  stepId: string,
  tool: NonNullable<AgentPlan['steps'][number]['requiredTool']>,
  context: AgentContext,
): AgentToolCall {
  return {
    callId: `call-${context.request.requestId}-${stepId}`,
    stepId,
    tool,
    input: {
      action: inferToolAction(tool, context.request),
      message: getRequestText(context.request),
      metadata: context.request.metadata ?? {},
      requestId: context.request.requestId,
      userId: context.request.userId,
    },
  };
}

function inferToolAction(
  tool: NonNullable<AgentPlan['steps'][number]['requiredTool']>,
  request: AgentRequest,
): string {
  const text = getRequestText(request).toLowerCase();

  switch (tool) {
    case 'gmail':
      if (text.includes('receipt')) return 'scan_receipts';
      if (text.includes('subscription')) return 'scan_subscriptions';
      if (text.includes('reply') || text.includes('draft')) return 'draft_reply';
      if (text.includes('inbox') || text.includes('email')) return 'search';
      return 'status';

    case 'calendar':
      if (
        text.includes('meeting') ||
        text.includes('availability') ||
        text.includes('schedule')
      ) {
        return 'availability';
      }
      return 'status';

    case 'memory':
      if (text.includes('remember') || text.includes('history')) {
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
      if (text.includes('scan')) return 'scan';
      return 'overview';

    case 'notes':
      if (
        text.includes('create note') ||
        text.includes('save this') ||
        text.includes('write this down')
      ) {
        return 'create';
      }
      return 'list';

    default:
      return 'default';
  }
}

function sortStepsForExecution(plan: AgentPlan): AgentPlan['steps'] {
  return [...plan.steps].sort((a, b) => a.priority - b.priority);
}

export async function executePlanSteps(
  plan: AgentPlan,
  context: AgentContext,
): Promise<AgentToolResult[]> {
  const steps = sortStepsForExecution(plan).filter((step) => Boolean(step.requiredTool));
  const results: AgentToolResult[] = [];

  for (const step of steps) {
    if (!step.requiredTool) continue;

    const call = createToolCall(step.id, step.requiredTool, context);
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

  const query = getRequestText(request);
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
    const runtime = mergeRuntimeOptions(request);
    const context = buildBaseContext(request, runtime);

    const routingStarted = Date.now();
    const route = routeIntent(request);
    const routingMs = Date.now() - routingStarted;

    const planningStarted = Date.now();
    const plan = createPlan(route, context);
    const planningMs = Date.now() - planningStarted;

    const memoryStarted = Date.now();
    const memory = await prepareMemory(request, context, route.shouldFetchMemory);
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
      request,
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
      request,
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
  const runtime = mergeRuntimeOptions(request);
  const context = buildBaseContext(request, runtime);

  try {
    yield streamEvents.routerStarted(request);

    const route = routeIntent(request);

    yield streamEvents.routerCompleted(request, {
      intent: route.intent,
      confidence: route.confidence,
      requiresTools: route.requiresTools,
    });

    yield streamEvents.planningStarted(request);

    const plan = createPlan(route, context);

    yield streamEvents.planningCompleted(request, {
      stepCount: plan.steps.length,
      intent: plan.intent,
    });

    yield streamEvents.memoryStarted(request);

    const memory = await prepareMemory(request, context, route.shouldFetchMemory);

    yield streamEvents.memoryCompleted(request, {
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

      yield streamEvents.toolStarted(request, {
        stepId: step.id,
        tool: step.requiredTool,
      });

      const call = createToolCall(step.id, step.requiredTool, executionContext);
      const result = await executeTool(call, executionContext);
      toolResults.push(result);

      yield streamEvents.toolCompleted(request, {
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
      request,
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
      request,
      normalized as unknown as Record<string, unknown>,
    );
  }
}
