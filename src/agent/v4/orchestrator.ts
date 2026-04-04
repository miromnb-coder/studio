import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { initializeFirebase } from '@/firebase';
import { getLongTermMemory } from '@/data/firestore';
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


async function fetchMemoryForUser(userId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId) return null;

  try {
    return await getLongTermMemory(firestore, userId);
  } catch {
    return null;
  }
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
    fetchMemoryForUser(userId),
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
