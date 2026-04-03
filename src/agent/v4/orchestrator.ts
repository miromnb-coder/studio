import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext } from './types';

/**
 * @fileOverview Orchestrator Agent v4.2: Streaming multi-agent pipeline.
 * Follows strict reasoning, planning, and tool-usage protocols.
 */

async function checkFastPath(input: string): Promise<string | null> {
  const lower = input.toLowerCase().trim();
  // Only trivial inputs skip the pipeline
  if (lower.length < 10 && (lower === 'hi' || lower === 'hello' || lower === 'hei' || lower === 'status')) {
    return "Operator v4.2 online. Systems nominal.";
  }
  return null;
}

function logPhase(correlationId: string, phase: string, event: string, extra: Record<string, unknown> = {}) {
  console.log(
    JSON.stringify({
      correlationId,
      phase,
      event,
      timestamp: new Date().toISOString(),
      ...extra
    })
  );
}

export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  const correlationId = crypto.randomUUID();
  logPhase(correlationId, 'orchestrator', 'request_received', {
    userId,
    inputPreview: input.slice(0, 80),
    hasImage: Boolean(imageUri)
  });

  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    logPhase(correlationId, 'orchestrator', 'fast_path_hit');
    return {
      stream: null,
      fastPathResponse,
      metadata: { intent: 'general', fastPathUsed: true, correlationId }
    };
  }

  // 2. Intent Routing & Memory Retrieval
  logPhase(correlationId, 'router', 'start');
  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    routeIntent(input, history)
  ]);
  logPhase(correlationId, 'router', 'complete', { intent, language, memoryFound: Boolean(memory) });

  // 3. Structured Planning
  logPhase(correlationId, 'planner', 'start', { intent });
  const plan = await createPlan(input, intent, history);
  logPhase(correlationId, 'planner', 'complete', { planSteps: plan.length });

  // 4. Tool Execution (Ground Truth)
  logPhase(correlationId, 'tools', 'start');
  const toolResults = await executeTools(plan, input, imageUri, { correlationId });
  logPhase(correlationId, 'tools', 'complete', {
    executed: toolResults.length,
    failures: toolResults.filter((result) => result.error).length
  });

  // 5. Context Building
  const context: AgentContext = {
    input,
    history,
    memory,
    imageUri,
    intent,
    language,
    plan,
    toolResults,
    fastPathUsed: false
  };

  // 6. Critic / Self-Evaluation Loop
  logPhase(correlationId, 'critic', 'start');
  let feedback = await evaluateReasoning(input, context);
  logPhase(correlationId, 'critic', 'complete', { score: feedback.score, needsRevision: feedback.needs_revision });
  if (feedback.needs_revision && feedback.score < 7) {
    logPhase(correlationId, 'critic', 'revision_triggered', { score: feedback.score });
    logPhase(correlationId, 'planner', 'retry_start', { intent });
    context.plan = await createPlan(input, intent, history);
    logPhase(correlationId, 'planner', 'retry_complete', { planSteps: context.plan.length });
    logPhase(correlationId, 'tools', 'retry_start');
    context.toolResults = await executeTools(context.plan, input, imageUri, { correlationId });
    logPhase(correlationId, 'tools', 'retry_complete', {
      executed: context.toolResults.length,
      failures: context.toolResults.filter((result) => result.error).length
    });
    logPhase(correlationId, 'critic', 'retry_start');
    feedback = await evaluateReasoning(input, context);
    logPhase(correlationId, 'critic', 'retry_complete', { score: feedback.score, needsRevision: feedback.needs_revision });
  }
  context.criticFeedback = feedback;

  // 7. Streaming Response Generation
  logPhase(correlationId, 'generator', 'start');
  const stream = await generateStreamResponse(context);
  logPhase(correlationId, 'generator', 'complete');

  const toolResultsForClient = toolResults.map((result) => ({
    action: result.action,
    output: result.output,
    error: result.error
      ? {
          code: result.error.code,
          retryable: result.error.retryable
        }
      : undefined,
    safeErrorSummary: result.safeErrorSummary
  }));

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      correlationId,
      intent,
      plan,
      toolResults: toolResultsForClient,
      safeErrors: toolResultsForClient
        .filter((result) => Boolean(result.safeErrorSummary))
        .map((result) => ({ action: result.action, summary: result.safeErrorSummary })),
      critic: feedback,
      memoryUsed: !!memory,
      fastPathUsed: false
    }
  };
}
