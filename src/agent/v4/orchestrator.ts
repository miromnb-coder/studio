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
  const safeInput = typeof input === 'string' ? input : String(input ?? '');
  const startedAt = Date.now();
  const stepStatus: Record<string, { status: 'ok' | 'error'; durationMs: number; error?: string }> = {};
  const logStep = (name: string, started: number, error?: unknown) => {
    stepStatus[name] = {
      status: error ? 'error' : 'ok',
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : error ? String(error) : undefined
    };
  };

  console.log(`[AGENT_V4.2] Processing: "${safeInput.slice(0, 50)}..."`);

  // 1. Fast Path
  const fastPathStarted = Date.now();
  const fastPathResponse = await checkFastPath(safeInput);
  logStep('fastPath', fastPathStarted);
  if (fastPathResponse) {
    return {
      stream: null,
      fastPathResponse,
      metadata: {
        intent: 'general',
        fastPathUsed: true,
        diagnostics: {
          durationMs: Date.now() - startedAt,
          stepStatus
        }
      }
    };
  }

  // 2. Intent Routing & Memory Retrieval
  let memory: any = null;
  let intent: AgentContext['intent'] = 'general';
  let language = 'en';
  const routingStarted = Date.now();
  try {
    const [resolvedMemory, routed] = await Promise.all([
      fetchMemory(userId),
      routeIntent(safeInput, history)
    ]);
    memory = resolvedMemory;
    intent = routed.intent;
    language = routed.language;
    logStep('routingAndMemory', routingStarted);
  } catch (error) {
    logStep('routingAndMemory', routingStarted, error);
    console.error('[ORCHESTRATOR] routingAndMemory failed, using defaults:', error);
  }

  // 3. Structured Planning
  let plan: AgentContext['plan'] = [];
  const planningStarted = Date.now();
  try {
    plan = await createPlan(safeInput, intent, history);
    logStep('planning', planningStarted);
  } catch (error) {
    logStep('planning', planningStarted, error);
    console.error('[ORCHESTRATOR] planning failed, using empty plan:', error);
  }

  // 4. Tool Execution (Ground Truth)
  let toolResults: AgentContext['toolResults'] = [];
  const toolExecutionStarted = Date.now();
  try {
    toolResults = await executeTools(plan, safeInput, imageUri);
    logStep('toolExecution', toolExecutionStarted);
  } catch (error) {
    logStep('toolExecution', toolExecutionStarted, error);
    console.error('[ORCHESTRATOR] toolExecution failed, continuing with empty results:', error);
  }

  // 5. Context Building
  const context: AgentContext = {
    input: safeInput,
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
  const criticStarted = Date.now();
  let feedback: AgentContext['criticFeedback'] = {
    score: 6,
    issues: ['critic unavailable'],
    needs_revision: false
  };
  try {
    feedback = await evaluateReasoning(safeInput, context);
    if (feedback.needs_revision && feedback.score < 7) {
      console.log("[ORCHESTRATOR] Low confidence, re-planning logic chain...");
      context.plan = await createPlan(safeInput, intent, history);
      context.toolResults = await executeTools(context.plan, safeInput, imageUri);
      feedback = await evaluateReasoning(safeInput, context);
    }
    logStep('critic', criticStarted);
  } catch (error) {
    logStep('critic', criticStarted, error);
    console.error('[ORCHESTRATOR] critic failed, continuing with fallback feedback:', error);
  }
  context.criticFeedback = feedback;

  // 7. Streaming Response Generation
  const generationStarted = Date.now();
  let stream: any = null;
  try {
    stream = await generateStreamResponse(context);
    logStep('generation', generationStarted);
  } catch (error) {
    logStep('generation', generationStarted, error);
    console.error('[ORCHESTRATOR] generation failed:', error);
    throw error;
  }

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent,
      plan,
      toolResults,
      critic: feedback,
      memoryUsed: !!memory,
      fastPathUsed: false,
      diagnostics: {
        durationMs: Date.now() - startedAt,
        stepStatus
      }
    }
  };
}
