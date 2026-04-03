import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse, generateToolCallResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext, AgentOutputMode } from './types';

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

const TOOL_ACTIONS = new Set([
  'detect_leaks',
  'optimize_time',
  'generate_strategy',
  'technical_debug'
]);

export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);

  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
      mode: 'final_answer' as AgentOutputMode,
      toolCall: null,
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

  // 4. Decision Phase: tool_call vs final_answer
  const mode: AgentOutputMode = plan.some((step) => TOOL_ACTIONS.has(step.action))
    ? 'tool_call'
    : 'final_answer';

  const context: AgentContext = {
    input,
    history,
    memory,
    imageUri,
    intent,
    language,
    plan,
    toolResults: [],
    fastPathUsed: false
  };

  if (mode === 'tool_call') {
    const toolCall = await generateToolCallResponse(context);
    return {
      mode,
      toolCall,
      stream: null,
      fastPathResponse: null,
      metadata: {
        intent,
        plan,
        memoryUsed: !!memory,
        fastPathUsed: false
      }
    };
  }

  // 5. Tool Execution (Ground Truth)
  const toolResults = await executeTools(plan, input, imageUri);

  // 6. Context Building
  context.toolResults = toolResults;

  // 7. Critic / Self-Evaluation Loop
  let feedback = await evaluateReasoning(input, context);
  if (feedback.needs_revision && feedback.score < 7) {
    console.log("[ORCHESTRATOR] Low confidence, re-planning logic chain...");
    context.plan = await createPlan(input, intent, history);
    context.toolResults = await executeTools(context.plan, input, imageUri);
    feedback = await evaluateReasoning(input, context);
  }
  context.criticFeedback = feedback;

  // 8. Streaming Response Generation
  const stream = await generateStreamResponse(context);

  return {
    mode,
    stream,
    toolCall: null,
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
