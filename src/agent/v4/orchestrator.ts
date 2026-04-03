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
    return 'Operator v4.2 online. Systems nominal.';
  }
  return null;
}

function deriveLegacyData(toolResults: any[]) {
  const detectLeaks = toolResults.find((result) => result.action === 'detect_leaks')?.output || {};
  const strategy = toolResults.find((result) => result.action === 'generate_strategy')?.output?.strategy;

  return {
    title: 'Audit Report',
    strategy: strategy || 'Standard advisor protocol.',
    detectedItems: detectLeaks.leaks || [],
    savingsEstimate: detectLeaks.estimatedMonthlySavings || 0,
    beforeAfterComparison: null,
    memoryUpdates: null,
    data: {
      detectedItems: detectLeaks.leaks || [],
      savingsEstimate: detectLeaks.estimatedMonthlySavings || 0
    }
  };
}

async function buildPipelineContext(input: string, userId: string, history: any[] = [], imageUri?: string) {
  // 1. Fast Path
  const fastPathResponse = await checkFastPath(input);
  if (fastPathResponse) {
    return {
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
  if (feedback.needs_revision && feedback.score < 7) {
    console.log('[ORCHESTRATOR] Low confidence, re-planning logic chain...');
    context.plan = await createPlan(input, intent, history);
    context.toolResults = await executeTools(context.plan, input, imageUri);
    feedback = await evaluateReasoning(input, context);
  }
  context.criticFeedback = feedback;

  return {
    fastPathResponse: null,
    context,
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

export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);

  const pipeline = await buildPipelineContext(input, userId, history, imageUri);

  if (pipeline.fastPathResponse) {
    return {
      stream: null,
      fastPathResponse: pipeline.fastPathResponse,
      metadata: pipeline.metadata
    };
  }

  // 7. Streaming Response Generation
  const stream = await generateStreamResponse(pipeline.context!);

  return {
    stream,
    fastPathResponse: null,
    metadata: pipeline.metadata
  };
}

export async function runAgentV4(input: string, history: any[] = [], memory: any = null, imageUri?: string) {
  const userId = typeof memory === 'string' ? memory : memory?.userId || memory?.uid || '';
  console.log(`[AGENT_V4.2] Processing (non-stream): "${input.slice(0, 50)}..."`);

  const pipeline = await buildPipelineContext(input, userId, history, imageUri);

  if (pipeline.fastPathResponse) {
    return {
      content: pipeline.fastPathResponse,
      data: deriveLegacyData([]),
      mode: 'general',
      intent: 'general',
      isActionable: false,
      metadata: pipeline.metadata
    };
  }

  const stream = await generateStreamResponse(pipeline.context!);
  let content = '';
  for await (const chunk of stream) {
    content += chunk.choices[0]?.delta?.content || '';
  }

  const mode = pipeline.context!.intent || 'general';
  const data = deriveLegacyData(pipeline.context!.toolResults);
  const isActionable =
    pipeline.context!.toolResults.some((result) => result.action === 'suggest_actions') ||
    (pipeline.metadata.critic?.score ?? 0) >= 7;

  return {
    content: content.trim(),
    data,
    mode,
    intent: pipeline.context!.intent,
    isActionable,
    metadata: pipeline.metadata
  };
}
