import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory, updateMemory } from './memory';
import { reflectOnInteraction } from './reflection';
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

function extractMemoryDeltas(context: AgentContext): Record<string, unknown> | null {
  const toolSummary = context.toolResults.map((result) => ({
    action: result.action,
    succeeded: !result.error,
    error: result.error ?? null
  }));

  const hasToolFailures = toolSummary.some((tool) => !tool.succeeded);
  const score = context.criticFeedback?.score ?? null;
  const hasSignal =
    !!context.intent ||
    typeof score === 'number' ||
    hasToolFailures ||
    context.toolResults.length > 0;

  if (!hasSignal) {
    return null;
  }

  return {
    lastIntent: context.intent,
    lastLanguage: context.language,
    lastCriticScore: score,
    lastToolSummary: toolSummary,
    lastInteractionAt: new Date().toISOString()
  };
}

export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);

  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
      stream: null,
      fastPathResponse,
      metadata: { intent: 'general', fastPathUsed: true }
    };
  }

  // 2. Intent Routing & Memory Retrieval
  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    routeIntent(input, history)
  ]);

  // 3. Structured Planning
  const plan = await createPlan(input, intent, history);

  // 4. Tool Execution (Ground Truth)
  const toolResults = await executeTools(plan, input, imageUri);

  // 5. Context Building
  const context: AgentContext = {
    userId,
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
  let feedback = await evaluateReasoning(input, context);
  if (feedback.needs_revision && feedback.score < 7) {
    console.log("[ORCHESTRATOR] Low confidence, re-planning logic chain...");
    context.plan = await createPlan(input, intent, history);
    context.toolResults = await executeTools(context.plan, input, imageUri);
    feedback = await evaluateReasoning(input, context);
  }
  context.criticFeedback = feedback;

  // 7. Streaming Response Generation
  const stream = await generateStreamResponse(context);
  context.memoryUpdates = extractMemoryDeltas(context) ?? undefined;

  void (async () => {
    try {
      await updateMemory(userId, context);
    } catch (error) {
      console.error("[ORCHESTRATOR] Memory update post-process failed:", error);
    }

    reflectOnInteraction(context).catch((error) => {
      console.error("[ORCHESTRATOR] Reflection post-process failed:", error);
    });
  })();

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent,
      plan,
      toolResults,
      critic: feedback,
      memoryUsed: !!memory,
      fastPathUsed: false
    }
  };
}
