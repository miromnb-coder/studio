import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeToolStep, isCacheableToolAction, isToolActionVolatile } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext } from './types';
import {
  createCacheKey,
  getJsonCache,
  InMemoryCacheBackend,
  setJsonCache,
  shouldBypassCacheForInput
} from './cache';

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

const cacheBackend = new InMemoryCacheBackend();

const CACHE_TTL = {
  route: 60 * 30, // 30 minutes
  plan: 60 * 15, // 15 minutes
  tool: 60 * 10 // 10 minutes
};

export async function runAgentV4Stream(input: string, userId: string, history: any[] = [], imageUri?: string) {
  console.log(`[AGENT_V4.2] Processing: "${input.slice(0, 50)}..."`);
  const bypassCache = shouldBypassCacheForInput(input);
  const cacheMeta = {
    bypassed: bypassCache,
    hits: {
      route: false,
      plan: false,
      tools: [] as string[]
    }
  };

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
  const routeKey = createCacheKey('route', userId, input, history);
  const routePromise = (async () => {
    if (!bypassCache) {
      const cachedRoute = await getJsonCache<{ intent: AgentContext['intent']; language: string }>(cacheBackend, routeKey);
      if (cachedRoute) {
        cacheMeta.hits.route = true;
        return cachedRoute;
      }
    }

    const freshRoute = await routeIntent(input, history);
    if (!bypassCache) {
      await setJsonCache(cacheBackend, routeKey, freshRoute, CACHE_TTL.route);
    }
    return freshRoute;
  })();

  const [memory, { intent, language }] = await Promise.all([fetchMemory(userId), routePromise]);

  // 3. Structured Planning
  const planKey = createCacheKey(`plan:${intent}`, userId, input, history);
  let plan = bypassCache ? null : await getJsonCache<AgentContext['plan']>(cacheBackend, planKey);
  if (plan) {
    cacheMeta.hits.plan = true;
  } else {
    plan = await createPlan(input, intent, history);
    if (!bypassCache) {
      await setJsonCache(cacheBackend, planKey, plan, CACHE_TTL.plan);
    }
  }

  // 4. Tool Execution (Ground Truth)
  const toolResults = [];
  for (const step of plan) {
    const volatileStep = isToolActionVolatile(step.action);
    const canUseToolCache = !bypassCache && !volatileStep && isCacheableToolAction(step.action, imageUri);
    const toolKey = createCacheKey(`tool:${step.action}`, userId, input, history);

    if (canUseToolCache) {
      const cachedTool = await getJsonCache<any>(cacheBackend, toolKey);
      if (cachedTool) {
        cacheMeta.hits.tools.push(step.action);
        toolResults.push(cachedTool);
        continue;
      }
    }

    const toolResult = await executeToolStep(step, input, imageUri);
    toolResults.push(toolResult);
    if (canUseToolCache && !toolResult.error) {
      await setJsonCache(cacheBackend, toolKey, toolResult, CACHE_TTL.tool);
    }
  }

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
    context.toolResults = [];
    for (const step of context.plan) {
      context.toolResults.push(await executeToolStep(step, input, imageUri));
    }
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
      fastPathUsed: false,
      cache: cacheMeta
    }
  };
}
