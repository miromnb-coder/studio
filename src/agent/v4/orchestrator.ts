import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext, AgentV4Result, Intent } from './types';

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

interface AgentV4PipelineResult {
  context: AgentContext;
  fastPathResponse: string | null;
}

async function runAgentV4Pipeline(
  input: string,
  userId: string,
  history: any[] = [],
  imageUri?: string
): Promise<AgentV4PipelineResult> {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);

  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
      fastPathResponse,
      context: {
        input,
        history,
        memory: null,
        imageUri,
        intent: 'general',
        language: 'English',
        plan: [],
        toolResults: [],
        fastPathUsed: true
      }
    };
  }

  const [memory, { intent, language }] = await Promise.all([
    fetchMemory(userId),
    routeIntent(input, history)
  ]);

  const plan = await createPlan(input, intent, history);
  const toolResults = await executeTools(plan, input, imageUri);

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

  let feedback = await evaluateReasoning(input, context);
  if (feedback.needs_revision && feedback.score < 7) {
    console.log("[ORCHESTRATOR] Low confidence, re-planning logic chain...");
    context.plan = await createPlan(input, intent, history);
    context.toolResults = await executeTools(context.plan, input, imageUri);
    feedback = await evaluateReasoning(input, context);
  }
  context.criticFeedback = feedback;

  return { context, fastPathResponse: null };
}

function buildResult(content: string, intent: Intent): AgentV4Result {
  return {
    content,
    intent,
    mode: intent
  };
}

export async function runAgentV4(
  input: string,
  userId: string,
  history: any[] = [],
  imageUri?: string
): Promise<AgentV4Result> {
  const { context, fastPathResponse } = await runAgentV4Pipeline(input, userId, history, imageUri);
  if (fastPathResponse) {
    return buildResult(fastPathResponse, 'general');
  }

  const stream = await generateStreamResponse(context);
  let content = '';
  for await (const chunk of stream) {
    content += chunk.choices[0]?.delta?.content || '';
  }

  return buildResult(content, context.intent);
}

export async function runAgentV4Stream(
  input: string,
  userId: string,
  history: any[] = [],
  imageUri?: string
) {
  const { context, fastPathResponse } = await runAgentV4Pipeline(input, userId, history, imageUri);
  if (fastPathResponse) {
    return {
      stream: null,
      fastPathResponse,
      metadata: { intent: 'general', fastPathUsed: true }
    };
  }

  const stream = await generateStreamResponse(context);

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent: context.intent,
      plan: context.plan,
      toolResults: context.toolResults,
      critic: context.criticFeedback,
      memoryUsed: !!context.memory,
      fastPathUsed: false
    }
  };
}
