import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentApiResponse, AgentContext, RunAgentV4StreamResult } from './types';

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

function buildAnalysis(intent: string, fastPathUsed: boolean): string {
  if (fastPathUsed) {
    return 'Handled by fast-path greeting/status intent for immediate response.';
  }
  return `Routed to ${intent} intent; generated plan, executed tools, and synthesized a grounded answer.`;
}

export async function runAgentV4Stream(
  input: string,
  userId: string,
  history: any[] = [],
  imageUri?: string
): Promise<RunAgentV4StreamResult> {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);

  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    const response: AgentApiResponse = {
      analysis: buildAnalysis('general', true),
      plan: ['Detect greeting/status intent', 'Return static health response'],
      actions: [],
      result: fastPathResponse
    };

    return {
      stream: null,
      response,
      metadata: { intent: 'general', fastPathUsed: true, plan: response.plan, actions: response.actions }
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
  if (feedback.needs_revision && feedback.score < 7) {
    console.log("[ORCHESTRATOR] Low confidence, re-planning logic chain...");
    context.plan = await createPlan(input, intent, history);
    context.toolResults = await executeTools(context.plan, input, imageUri);
    feedback = await evaluateReasoning(input, context);
  }
  context.criticFeedback = feedback;

  // 7. Streaming Response Generation
  const stream = await generateStreamResponse(context);

  const mappedPlan = plan.map((step) => step.description?.trim() || step.action);
  const mappedActions = toolResults.map((tool) =>
    tool.error ? `${tool.action} (failed: ${tool.error})` : `${tool.action} (executed)`
  );

  return {
    stream,
    response: null,
    metadata: {
      intent,
      language,
      plan: mappedPlan,
      actions: mappedActions,
      critic: feedback,
      memoryUsed: !!memory,
      fastPathUsed: false
    }
  };
}
