import { AGENT_VNEXT_MAX_PLAN_STEPS } from './constants';
import type {
  AgentContext,
  AgentPlan,
  AgentPlanStep,
  AgentRouteResult,
  AgentToolName,
} from './types';

type StepStatus = AgentPlanStep['status'];

function baseStep(params: {
  id: string;
  title: string;
  description: string;
  priority: number;
  requiredTool?: AgentToolName;
  dependsOn?: string[];
  status?: StepStatus;
}): AgentPlanStep {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    priority: params.priority,
    status: params.status ?? 'pending',
    requiredTool: params.requiredTool,
    dependsOn: params.dependsOn,
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function getMaxSteps(context: AgentContext): number {
  const runtimeMax =
    (context as AgentContext & {
      runtime?: { maxPlanSteps?: number };
    }).runtime?.maxPlanSteps ?? AGENT_VNEXT_MAX_PLAN_STEPS;

  return Math.max(4, runtimeMax);
}

function hasLongRequest(context: AgentContext): boolean {
  const request = context.request as typeof context.request & {
    message?: string;
    input?: string;
    prompt?: string;
  };

  const text =
    request.message || request.input || request.prompt || '';

  return text.trim().split(/\s+/).filter(Boolean).length > 24;
}

function createToolSteps(
  route: AgentRouteResult,
  dependsOn: string[],
): AgentPlanStep[] {
  return route.requiresTools.map((tool, index) =>
    baseStep({
      id: `step-tool-${tool}`,
      title: `Use ${tool} tool`,
      description: getToolDescription(tool),
      priority: 30 + index,
      requiredTool: tool,
      dependsOn,
    }),
  );
}

function getToolDescription(tool: AgentToolName): string {
  switch (tool) {
    case 'gmail':
      return 'Retrieve relevant inbox data, receipts, subscriptions, or email actions.';
    case 'memory':
      return 'Load relevant memory, preferences, prior conversations, or saved context.';
    case 'calendar':
      return 'Check availability, events, scheduling options, or timeline constraints.';
    case 'web':
      return 'Collect fresh external information and trustworthy sources.';
    case 'compare':
      return 'Evaluate options using structured comparison logic.';
    case 'file':
      return 'Inspect uploaded files or referenced documents.';
    case 'finance':
      return 'Analyze spending, subscriptions, savings, or finance context.';
    case 'notes':
      return 'Create, retrieve, or update structured notes.';
    default:
      return `Use ${tool} integration.`;
  }
}

function buildIntentSpecificSteps(
  route: AgentRouteResult,
  memoryStepId?: string,
): AgentPlanStep[] {
  const dependency = memoryStepId ? [memoryStepId] : ['step-intake'];

  switch (route.intent) {
    case 'research':
      return [
        baseStep({
          id: 'step-research-scope',
          title: 'Define research scope',
          description:
            'Clarify what should be researched, freshness needs, and expected output format.',
          priority: 12,
          dependsOn: dependency,
        }),
        baseStep({
          id: 'step-source-review',
          title: 'Review sources',
          description:
            'Assess credibility, relevance, and consistency of collected information.',
          priority: 55,
          dependsOn: ['step-research-scope'],
        }),
      ];

    case 'compare':
      return [
        baseStep({
          id: 'step-criteria',
          title: 'Define comparison criteria',
          description:
            'Identify metrics, priorities, tradeoffs, and decision factors.',
          priority: 12,
          dependsOn: dependency,
        }),
        baseStep({
          id: 'step-ranking',
          title: 'Rank options',
          description:
            'Score options against criteria and prepare recommendation logic.',
          priority: 55,
          dependsOn: ['step-criteria'],
        }),
      ];

    case 'planning':
      return [
        baseStep({
          id: 'step-goals',
          title: 'Clarify goals',
          description:
            'Identify desired outcome, constraints, urgency, and available resources.',
          priority: 12,
          dependsOn: dependency,
        }),
        baseStep({
          id: 'step-roadmap',
          title: 'Build roadmap',
          description:
            'Convert goals into actionable milestones and next steps.',
          priority: 55,
          dependsOn: ['step-goals'],
        }),
      ];

    case 'execution':
      return [
        baseStep({
          id: 'step-validate',
          title: 'Validate action request',
          description:
            'Check permissions, feasibility, blockers, and success conditions.',
          priority: 12,
          dependsOn: dependency,
        }),
        baseStep({
          id: 'step-execute',
          title: 'Prepare execution output',
          description:
            'Produce the direct action result, draft, or requested deliverable.',
          priority: 55,
          dependsOn: ['step-validate'],
        }),
      ];

    case 'scheduling':
      return [
        baseStep({
          id: 'step-time-constraints',
          title: 'Review time constraints',
          description:
            'Understand deadlines, duration, availability, and conflicts.',
          priority: 12,
          dependsOn: dependency,
        }),
      ];

    case 'memory_lookup':
      return [
        baseStep({
          id: 'step-memory-filter',
          title: 'Filter memory',
          description:
            'Prioritize the most relevant historical context for this request.',
          priority: 12,
          dependsOn: dependency,
        }),
      ];

    default:
      return [];
  }
}

function buildGenerateStep(existingIds: string[]): AgentPlanStep {
  return baseStep({
    id: 'step-generate',
    title: 'Generate final answer',
    description:
      'Synthesize memory, tool outputs, reasoning, and produce the best final response.',
    priority: 90,
    dependsOn: existingIds,
  });
}

function buildEvaluateStep(): AgentPlanStep {
  return baseStep({
    id: 'step-evaluate',
    title: 'Quality check',
    description:
      'Verify clarity, completeness, correctness, and user usefulness before returning output.',
    priority: 95,
    dependsOn: ['step-generate'],
  });
}

function sortSteps(steps: AgentPlanStep[]): AgentPlanStep[] {
  return [...steps].sort((a, b) => a.priority - b.priority);
}

function trimSteps(steps: AgentPlanStep[], max: number): AgentPlanStep[] {
  if (steps.length <= max) return steps;

  const protectedIds = new Set([
    'step-intake',
    'step-generate',
    'step-evaluate',
  ]);

  const kept = sortSteps(steps).filter(
    (step) => protectedIds.has(step.id),
  );

  const others = sortSteps(steps).filter(
    (step) => !protectedIds.has(step.id),
  );

  for (const step of others) {
    if (kept.length >= max) break;
    kept.push(step);
  }

  const keptIds = new Set(kept.map((step) => step.id));

  const repaired = kept.map((step) => ({
    ...step,
    dependsOn: step.dependsOn?.filter((id) => keptIds.has(id)),
  }));

  return sortSteps(repaired);
}

export function createPlan(
  route: AgentRouteResult,
  context: AgentContext,
): AgentPlan {
  const maxSteps = getMaxSteps(context);

  const steps: AgentPlanStep[] = [
    baseStep({
      id: 'step-intake',
      title: 'Interpret request',
      description:
        'Understand user intent, scope, constraints, urgency, and desired outcome.',
      priority: 1,
    }),
  ];

  let memoryStepId: string | undefined;

  if (route.shouldFetchMemory) {
    memoryStepId = 'step-memory';

    steps.push(
      baseStep({
        id: memoryStepId,
        title: 'Retrieve memory context',
        description:
          'Load relevant preferences, prior conversations, and useful historical context.',
        priority: 10,
        requiredTool: 'memory',
        dependsOn: ['step-intake'],
      }),
    );
  }

  const intentSpecific = buildIntentSpecificSteps(route, memoryStepId);
  steps.push(...intentSpecific);

  const toolDependencyBase = unique([
    memoryStepId ?? 'step-intake',
    ...intentSpecific.map((step) => step.id),
  ]);

  const toolSteps = createToolSteps(route, toolDependencyBase);
  steps.push(...toolSteps);

  if (hasLongRequest(context)) {
    steps.push(
      baseStep({
        id: 'step-decompose',
        title: 'Decompose complex request',
        description:
          'Break a large request into smaller solvable parts and preserve priorities.',
        priority: 20,
        dependsOn: ['step-intake'],
      }),
    );
  }

  const preGenerateIds = steps.map((step) => step.id);
  steps.push(buildGenerateStep(preGenerateIds));
  steps.push(buildEvaluateStep());

  const finalSteps = trimSteps(sortSteps(steps), maxSteps);

  const toolCount = finalSteps.filter((step) => step.requiredTool).length;

  return {
    id: `plan-${context.request.requestId}`,
    intent: route.intent,
    summary: `Plan for ${route.intent} with ${finalSteps.length} steps and ${toolCount} tool actions.`,
    steps: finalSteps,
    createdAt: context.nowIso,
    metadata: {
      maxSteps,
      toolCount,
      memoryEnabled: route.shouldFetchMemory,
      executionMode: route.suggestedExecutionMode,
    },
  };
}
