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

async function executePlanSteps(plan: AgentPlan, context: AgentContext): Promise<AgentToolResult[]> {
  const toolSteps = plan.steps.filter((step) => Boolean(step.requiredTool));
  const results: AgentToolResult[] = [];

  for (const step of toolSteps) {
    if (!step.requiredTool) {
      continue;
    }

    const call: AgentToolCall = {
      callId: `call-${context.request.requestId}-${step.id}`,
      stepId: step.id,
      tool: step.requiredTool,
      input: {
        message: context.request.message,
        metadata: context.request.metadata ?? {},
      },
    };

    const result = await executeTool(call, context);
    results.push(result);

    if (!result.ok && !context.runtime.allowToolFallbacks) {
      throw new AgentExecutionError({
        code: 'TOOL_EXECUTION_FAILED',
        message: `Tool step failed: ${step.id}`,
        retryable: true,
        details: { stepId: step.id, tool: step.requiredTool },
      });
    }
  }

  return results;
}

export async function runAgentVNext(request: AgentRequest): Promise<AgentExecutionResult> {
  const startedAt = Date.now();
  const nowIso = new Date().toISOString();

  try {
    const runtime = mergeRuntimeOptions(request);
    const context: AgentContext = { nowIso, request, runtime };

    const routingStarted = Date.now();
    const route = routeIntent(request);
    const routingMs = Date.now() - routingStarted;

    const planningStarted = Date.now();
    const plan = createPlan(route, context);
    const planningMs = Date.now() - planningStarted;

    const memoryStarted = Date.now();
    const memoryItems = route.shouldFetchMemory ? rankMemory(await fetchMemory(request, context), request.message) : [];
    const memory = buildMemoryContext(memoryItems);
    const memoryMs = Date.now() - memoryStarted;

    const toolsStarted = Date.now();
    const toolResults = await executePlanSteps(plan, { ...context, memoryContext: memory });
    const toolsMs = Date.now() - toolsStarted;

    const generationStarted = Date.now();
    const answer = await generateFinalAnswer({
      request,
      route,
      plan,
      context: { ...context, memoryContext: memory, toolResults },
      toolResults,
      memorySummary: memory.summary,
    });
    const generationMs = Date.now() - generationStarted;

    const evaluationStarted = Date.now();
    const evaluation = runtime.enableEvaluation ? evaluateExecution({ plan, toolResults, answer }) : undefined;
    const evaluationMs = Date.now() - evaluationStarted;

    const response: AgentResponse = {
      requestId: request.requestId,
      route,
      plan,
      toolResults,
      memory: memory as AgentMemoryContext,
      answer,
      evaluation,
      warnings: evaluation?.issues ?? [],
      createdAt: new Date().toISOString(),
    };

    agentLogger.info('vNext agent execution completed', {
      requestId: request.requestId,
      intent: route.intent,
      score: evaluation?.score,
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
    agentLogger.error('vNext agent execution failed', { requestId: request.requestId, error: normalized });

    return {
      ok: false,
      error: normalized,
      timingsMs: {
        total: Date.now() - startedAt,
      },
    };
  }
}

export async function* runAgentVNextStream(request: AgentRequest): AsyncGenerator<AgentStreamEvent> {
  const runtime = mergeRuntimeOptions(request);
  const context: AgentContext = { nowIso: new Date().toISOString(), request, runtime };

  try {
    yield streamEvents.routerStarted(request);
    const route = routeIntent(request);
    yield streamEvents.routerCompleted(request, { intent: route.intent, confidence: route.confidence });

    yield streamEvents.planningStarted(request);
    const plan = createPlan(route, context);
    yield streamEvents.planningCompleted(request, { stepCount: plan.steps.length });

    yield streamEvents.memoryStarted(request);
    const memoryItems = route.shouldFetchMemory ? rankMemory(await fetchMemory(request, context), request.message) : [];
    const memory = buildMemoryContext(memoryItems);
    yield streamEvents.memoryCompleted(request, { memoryCount: memory.items.length });

    const toolResults = await executePlanSteps(plan, { ...context, memoryContext: memory });

    for (const toolResult of toolResults) {
      yield streamEvents.toolCompleted(request, {
        stepId: toolResult.stepId,
        tool: toolResult.tool,
        ok: toolResult.ok,
      });
    }

    for await (const event of generateFinalAnswerStream({
      request,
      route,
      plan,
      context: { ...context, memoryContext: memory, toolResults },
      toolResults,
      memorySummary: memory.summary,
    })) {
      yield event;
    }
  } catch (error) {
    const normalized = normalizeAgentError(error);
    yield streamEvents.error(request, normalized as unknown as Record<string, unknown>);
  }
}

export { executePlanSteps };
