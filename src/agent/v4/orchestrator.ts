import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext } from './types';

/**
 * @fileOverview Orchestrator Agent v4.2: The single source of truth for AI reasoning.
 * Handles streaming responses, tool execution, and memory synchronization.
 */

async function checkFastPath(input: string): Promise<string | null> {
  const lower = input.toLowerCase().trim();
  if (lower.length < 10 && (lower === 'hi' || lower === 'hello' || lower === 'status' || lower === 'help')) {
    return "Operator v4.2 online. Neural pathways active. All systems nominal.";
  }
  return null;
}

/**
 * Blocking entry point for background tasks (Webhooks, Cron).
 */
export async function runAgentV4(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Blocking Request: ${input.slice(0, 50)}...`);
  const { stream, fastPathResponse, metadata } = await runAgentV4Stream(input, userId, history, imageUri);

  if (fastPathResponse) {
    return { content: fastPathResponse, ...metadata };
  }

  let fullContent = "";
  for await (const chunk of stream!) {
    fullContent += chunk.choices[0]?.delta?.content || "";
  }

  return { content: fullContent, ...metadata };
}

/**
 * Streaming entry point for UI chat.
 */
export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Streaming Request for User: ${userId}`);

  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
      stream: null,
      fastPathResponse,
      metadata: { intent: 'general' as any, fastPathUsed: true }
    };
  }

  // 2. Intent Routing & Memory Retrieval
  const [memory, routeResult] = await Promise.all([
    fetchMemory(userId),
    routeIntent(input, history)
  ]);

  const { intent, language } = routeResult;

  // 3. Structured Planning
  const plan = await createPlan(input, intent, history);

  // 4. Tool Execution
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

  // 6. Critic Evaluation
  let feedback = await evaluateReasoning(input, context);
  if (feedback.needs_revision && feedback.score < 6) {
    console.log("[ORCHESTRATOR] Low confidence, re-evaluating strategy...");
    // Attempt one quick re-plan for high-stakes intents
    if (intent !== 'general') {
       context.plan = await createPlan(input, intent, history);
       context.toolResults = await executeTools(context.plan, input, imageUri);
       feedback = await evaluateReasoning(input, context);
    }
  }
  context.criticFeedback = feedback;

  // 7. Response Generation
  const stream = await generateStreamResponse(context);

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent,
      plan,
      toolResults,
      critic: feedback,
      memoryUsed: !!memory,
      language
    }
  };
}
