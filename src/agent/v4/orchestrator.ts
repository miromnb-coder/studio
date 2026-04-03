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
  const hasToolError = context.toolResults.some((result) => !!result.errorType);
  const invalidOutputError = context.toolResults.some((result) => result.errorType === 'invalid_output');
  const timeoutError = context.toolResults.some((result) => result.errorType === 'timeout');
  const unknownActionError = context.toolResults.some((result) => result.errorType === 'unknown_action');

  if ((feedback.needs_revision && feedback.score < 7) || hasToolError) {
    let strategy = 'full_replan';
    console.log("[ORCHESTRATOR] Critic revision or tool error detected. Selecting correction strategy...");

    if (invalidOutputError) {
      strategy = 'schema_recovery';
      // Keep same plan but re-run with retries already baked into tool execution.
      context.toolResults = await executeTools(context.plan, input, imageUri);
    } else if (timeoutError) {
      strategy = 'timeout_reduction';
      // Timeout can improve with smaller plan footprint.
      context.plan = context.plan.slice(0, Math.max(1, Math.min(2, context.plan.length)));
      context.toolResults = await executeTools(context.plan, input, imageUri);
    } else if (unknownActionError) {
      strategy = 'known_actions_replan';
      // Unknown actions indicate planner drift; fully re-plan and keep known tool actions only.
      const replanned = await createPlan(input, intent, history);
      const knownActions = new Set(['analyze', 'detect_leaks', 'optimize_time', 'generate_strategy', 'technical_debug', 'suggest_actions']);
      context.plan = replanned.filter((step) => knownActions.has(step.action));
      if (!context.plan.length) {
        context.plan = [{ action: 'analyze', priority: 'high' }];
      }
      context.toolResults = await executeTools(context.plan, input, imageUri);
    } else {
      context.plan = await createPlan(input, intent, history);
      context.toolResults = await executeTools(context.plan, input, imageUri);
    }

    feedback = await evaluateReasoning(input, context);
    feedback.issues = [...feedback.issues, `correction_strategy:${strategy}`];
  }
  context.criticFeedback = feedback;

  // 7. Streaming Response Generation
  const stream = await generateStreamResponse(context);

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent,
      plan: context.plan,
      toolResults: context.toolResults,
      critic: feedback,
      memoryUsed: !!memory,
      fastPathUsed: false
    }
  };
}
