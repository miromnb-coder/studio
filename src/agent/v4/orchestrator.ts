import { routeIntent } from './router';
import { createPlan } from './planner';
import { executeTools } from './tools';
import { evaluateReasoning } from './critic';
import { generateStreamResponse } from './generator';
import { fetchMemory } from './memory';
import { AgentContext, AgentStep, TaskState, ToolResult } from './types';

/**
 * @fileOverview Orchestrator Agent v4.2: Streaming multi-agent pipeline.
 * Follows strict reasoning, planning, and tool-usage protocols.
 */

const maxIterations = 4;
const maxStalledIterations = 2;

async function checkFastPath(input: string): Promise<string | null> {
  const lower = input.toLowerCase().trim();
  // Only trivial inputs skip the pipeline
  if (lower.length < 10 && (lower === 'hi' || lower === 'hello' || lower === 'hei' || lower === 'status')) {
    return 'Operator v4.2 online. Systems nominal.';
  }
  return null;
}

function planSignature(plan: AgentStep[]): string {
  return plan.map((step) => `${step.action}:${step.priority}`).join('|');
}

function summarizeObservation(toolResults: ToolResult[]): string {
  if (!toolResults.length) {
    return 'No tool output produced.';
  }

  const failedActions = toolResults.filter((result) => result.error).map((result) => result.action);
  if (failedActions.length) {
    return `Tool failures in: ${failedActions.join(', ')}`;
  }

  return `Executed ${toolResults.length} step(s): ${toolResults.map((result) => result.action).join(', ')}`;
}

function evaluateCompletion(taskState: TaskState, toolResults: ToolResult[], feedback: Awaited<ReturnType<typeof evaluateReasoning>>): TaskState {
  const hasToolErrors = toolResults.some((result) => !!result.error);
  const qualityGatePassed = feedback.score >= 7 && !feedback.needs_revision;
  const isComplete = qualityGatePassed && !hasToolErrors;

  const nextRemainingGoals = isComplete
    ? []
    : Array.from(
        new Set([
          ...(hasToolErrors ? ['Recover from tool execution errors'] : []),
          ...(feedback.issues?.length ? feedback.issues : ['Increase grounded confidence in response'])
        ])
      );

  return {
    ...taskState,
    isComplete,
    remainingGoals: nextRemainingGoals,
    lastObservation: summarizeObservation(toolResults)
  };
}

function buildRefinedInput(input: string, taskState: TaskState): string {
  if (!taskState.remainingGoals.length) {
    return input;
  }

  return [
    input,
    '',
    'Refinement objectives:',
    ...taskState.remainingGoals.map((goal, index) => `${index + 1}. ${goal}`),
    '',
    `Latest observation: ${taskState.lastObservation || 'None'}`
  ].join('\n');
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
  const [memory, { intent, language }] = await Promise.all([fetchMemory(userId), routeIntent(input, history)]);

  // State model for bounded iterative loop
  let taskState: TaskState = {
    isComplete: false,
    iteration: 0,
    remainingGoals: ['Deliver a grounded and actionable response'],
    lastObservation: ''
  };

  const context: AgentContext = {
    input,
    history,
    memory,
    imageUri,
    intent,
    language,
    plan: [],
    toolResults: [],
    fastPathUsed: false,
    taskState
  };

  const seenPlanSignatures = new Set<string>();
  let stalledIterations = 0;
  let feedback: Awaited<ReturnType<typeof evaluateReasoning>> = { score: 0, issues: [], needs_revision: true };

  // 3-7. Iterative state machine: analyze -> plan -> act -> observe -> refine
  while (!taskState.isComplete && taskState.iteration < maxIterations) {
    taskState = { ...taskState, iteration: taskState.iteration + 1 };
    context.taskState = taskState;

    // analyze + plan
    const planningInput = taskState.iteration === 1 ? input : buildRefinedInput(input, taskState);
    const nextPlan = await createPlan(planningInput, intent, history);
    const signature = planSignature(nextPlan);

    // safeguard: duplicate-plan detection
    if (seenPlanSignatures.has(signature)) {
      console.warn(`[ORCHESTRATOR] Duplicate plan detected on iteration ${taskState.iteration}.`);
      stalledIterations += 1;
      taskState = {
        ...taskState,
        lastObservation: `Duplicate plan detected (${signature || 'empty-plan'})`,
        remainingGoals: ['Produce a non-duplicative plan with new evidence'],
        isComplete: false
      };
      context.taskState = taskState;

      if (stalledIterations >= maxStalledIterations) {
        break;
      }
      continue;
    }

    seenPlanSignatures.add(signature);
    context.plan = nextPlan;

    // act
    const toolResults = await executeTools(nextPlan, planningInput, imageUri);
    context.toolResults = toolResults;

    // observe
    feedback = await evaluateReasoning(input, context);
    context.criticFeedback = feedback;

    const prevObservation = taskState.lastObservation;
    taskState = evaluateCompletion(taskState, toolResults, feedback);
    context.taskState = taskState;

    // refine + progress stall safeguard
    if (!taskState.isComplete) {
      const observationUnchanged = prevObservation === taskState.lastObservation;
      if (observationUnchanged || !taskState.remainingGoals.length) {
        stalledIterations += 1;
      } else {
        stalledIterations = 0;
      }

      if (stalledIterations >= maxStalledIterations) {
        console.warn('[ORCHESTRATOR] Progress stalled; moving to fallback finalization.');
        break;
      }
    }
  }

  // Fallback finalization when completion criteria are unmet
  if (!taskState.isComplete) {
    taskState = {
      ...taskState,
      lastObservation: taskState.lastObservation || 'Reached fallback finalization without decisive completion.',
      remainingGoals: [],
      isComplete: true
    };
    context.taskState = taskState;

    if (!context.criticFeedback) {
      context.criticFeedback = feedback;
    }
  }

  // 8. Streaming Response Generation
  const stream = await generateStreamResponse(context);

  return {
    stream,
    fastPathResponse: null,
    metadata: {
      intent,
      plan: context.plan,
      toolResults: context.toolResults,
      critic: context.criticFeedback,
      taskState,
      memoryUsed: !!memory,
      fastPathUsed: false
    }
  };
}
