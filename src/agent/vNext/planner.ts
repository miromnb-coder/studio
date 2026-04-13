import { AGENT_VNEXT_MAX_PLAN_STEPS } from './constants';
import type { AgentContext, AgentPlan, AgentPlanStep, AgentRouteResult } from './types';

function baseStep(id: string, title: string, description: string, priority: number): AgentPlanStep {
  return {
    id,
    title,
    description,
    status: 'pending',
    priority,
  };
}

export function createPlan(route: AgentRouteResult, context: AgentContext): AgentPlan {
  const steps: AgentPlanStep[] = [
    baseStep('step-intake', 'Interpret request', 'Confirm scope, constraints, and desired output.', 1),
  ];

  if (route.shouldFetchMemory) {
    steps.push({
      ...baseStep('step-memory', 'Retrieve memory context', 'Load relevant user memory for personalization.', 2),
      requiredTool: 'memory',
      dependsOn: ['step-intake'],
    });
  }

  route.requiresTools.forEach((tool, index) => {
    steps.push({
      ...baseStep(`step-tool-${tool}`, `Use ${tool} tool`, `Collect fresh data from the ${tool} integration.`, 3 + index),
      requiredTool: tool,
      dependsOn: route.shouldFetchMemory ? ['step-memory'] : ['step-intake'],
    });
  });

  steps.push({
    ...baseStep('step-generate', 'Generate final answer', 'Synthesize context, tool outputs, and produce response.', 5),
    dependsOn: steps.filter((step) => step.id !== 'step-generate').map((step) => step.id),
  });

  const limitedSteps = steps.slice(0, context.runtime.maxPlanSteps || AGENT_VNEXT_MAX_PLAN_STEPS);

  return {
    id: `plan-${context.request.requestId}`,
    intent: route.intent,
    summary: `Execution plan for intent: ${route.intent}`,
    steps: limitedSteps,
    createdAt: context.nowIso,
    // TODO: Add adaptive planning depth and branch/merge steps once LLM planner is integrated.
  };
}
