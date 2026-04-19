import { AGENT_VNEXT_MAX_PLAN_STEPS } from './constants';
import type {
  AgentContext,
  AgentPlan,
  AgentPlanStep,
  AgentRouteResult,
  AgentToolCall,
  AgentToolName,
} from './types';

type StepStatus = AgentPlanStep['status'];

type PlanHint = {
  requestText: string;
  wordCount: number;
  isLong: boolean;
  hasComparison: boolean;
  hasFreshnessNeed: boolean;
  hasActionRequest: boolean;
  hasFileReference: boolean;
  hasTimeReference: boolean;
  entities: string[];
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function getRequestText(context: AgentContext): string {
  const request = context.request as typeof context.request & {
    message?: string;
    input?: string;
    prompt?: string;
  };

  return normalizeText(request.message || request.input || request.prompt || '');
}

function getEntities(route: AgentRouteResult, context: AgentContext): string[] {
  const routeEntities = Array.isArray(route.entities)
    ? route.entities.map((item) => normalizeText(item)).filter(Boolean)
    : [];

  const metadataEntities = Array.isArray(context.request.metadata?.entities)
    ? (context.request.metadata.entities as unknown[])
        .map((item) => normalizeText(item))
        .filter(Boolean)
    : [];

  return unique([...routeEntities, ...metadataEntities]).slice(0, 8);
}

function buildHints(route: AgentRouteResult, context: AgentContext): PlanHint {
  const requestText = getRequestText(context);
  const wordCount = requestText.split(/\s+/).filter(Boolean).length;
  const entities = getEntities(route, context);

  return {
    requestText,
    wordCount,
    isLong: wordCount > 24,
    hasComparison: route.intent === 'compare' || route.requiresTools.includes('compare'),
    hasFreshnessNeed: route.intent === 'research' || route.requiresTools.includes('web'),
    hasActionRequest:
      route.intent === 'planning' ||
      route.intent === 'productivity' ||
      route.intent === 'gmail' ||
      route.intent === 'coding',
    hasFileReference: route.requiresTools.includes('file'),
    hasTimeReference: route.requiresTools.includes('calendar'),
    entities,
  };
}

function getMaxSteps(context: AgentContext): number {
  const runtimeMax =
    (context as AgentContext & {
      runtime?: { maxPlanSteps?: number };
    }).runtime?.maxPlanSteps ?? AGENT_VNEXT_MAX_PLAN_STEPS;

  return Math.max(4, runtimeMax);
}

function baseStep(params: {
  id: string;
  title: string;
  description: string;
  priority: number;
  requiredTool?: AgentToolName;
  dependsOn?: string[];
  status?: StepStatus;
  input?: Record<string, unknown>;
}): AgentPlanStep {
  return {
    id: params.id,
    title: params.title,
    description: params.description,
    priority: params.priority,
    status: params.status ?? 'pending',
    requiredTool: params.requiredTool,
    dependsOn: params.dependsOn,
    input: params.input,
  };
}

function buildMemoryStep(): AgentPlanStep {
  return baseStep({
    id: 'step-memory',
    title: 'Retrieve memory context',
    description:
      'Load relevant preferences, prior conversations, and useful historical context.',
    priority: 10,
    requiredTool: 'memory',
    dependsOn: ['step-intake'],
  });
}

function buildComplexityStep(hints: PlanHint): AgentPlanStep | null {
  if (!hints.isLong) return null;

  return baseStep({
    id: 'step-decompose',
    title: 'Decompose complex request',
    description:
      'Break a large request into smaller solvable parts and preserve priorities.',
    priority: 11,
    dependsOn: ['step-intake'],
    input: {
      wordCount: hints.wordCount,
    },
  });
}

function buildIntentSpecificSteps(
  route: AgentRouteResult,
  hints: PlanHint,
  dependencyIds: string[],
): AgentPlanStep[] {
  const dependsOn = dependencyIds.length ? dependencyIds : ['step-intake'];

  switch (route.intent) {
    case 'research':
      return [
        baseStep({
          id: 'step-research-scope',
          title: 'Define research scope',
          description:
            'Clarify what should be researched, freshness needs, and expected output.',
          priority: 14,
          dependsOn,
          input: {
            freshnessRequired: hints.hasFreshnessNeed,
            entities: hints.entities,
          },
        }),
      ];

    case 'compare':
      return [
        baseStep({
          id: 'step-criteria',
          title: 'Define comparison criteria',
          description:
            'Identify metrics, priorities, tradeoffs, and recommendation factors.',
          priority: 14,
          dependsOn,
          input: {
            entities: hints.entities,
            comparisonDetected: hints.hasComparison,
          },
        }),
      ];

    case 'planning':
      return [
        baseStep({
          id: 'step-goals',
          title: 'Clarify goals',
          description:
            'Identify desired outcome, constraints, urgency, and available resources.',
          priority: 14,
          dependsOn,
        }),
      ];

    case 'productivity':
      return [
        baseStep({
          id: 'step-productivity-scope',
          title: 'Clarify productivity scope',
          description:
            'Determine whether the user needs scheduling, prioritization, or execution guidance.',
          priority: 14,
          dependsOn,
          input: {
            timeReference: hints.hasTimeReference,
          },
        }),
      ];

    case 'finance':
      return [
        baseStep({
          id: 'step-finance-goal',
          title: 'Clarify financial goal',
          description:
            'Identify whether the user wants savings, budgeting, subscription review, or broader financial guidance.',
          priority: 14,
          dependsOn,
        }),
      ];

    case 'gmail':
      return [
        baseStep({
          id: 'step-email-scope',
          title: 'Clarify inbox task',
          description:
            'Determine whether the user needs summary, urgent triage, subscription review, or a digest.',
          priority: 14,
          dependsOn,
        }),
      ];

    case 'memory':
      return [
        baseStep({
          id: 'step-memory-filter',
          title: 'Filter memory',
          description:
            'Prioritize the most relevant historical context for this request.',
          priority: 14,
          dependsOn,
        }),
      ];

    case 'coding':
      return [
        baseStep({
          id: 'step-code-scope',
          title: 'Clarify coding scope',
          description:
            'Identify stack, constraints, acceptance criteria, and likely failure modes.',
          priority: 14,
          dependsOn,
          input: {
            hasFileReference: hints.hasFileReference,
          },
        }),
      ];

    case 'shopping':
      return [
        baseStep({
          id: 'step-shopping-criteria',
          title: 'Define shopping criteria',
          description:
            'Clarify budget, constraints, preferences, and deal-breakers.',
          priority: 14,
          dependsOn,
        }),
      ];

    default:
      return [];
  }
}

function buildToolInput(
  tool: AgentToolName,
  route: AgentRouteResult,
  hints: PlanHint,
  context: AgentContext,
): Record<string, unknown> {
  const common = {
    query: hints.requestText,
    entities: hints.entities,
    userGoal: route.userGoal,
    intentHint: route.intent,
    responseLanguage: route.responseLanguage,
    userId: context.request.userId,
  };

  switch (tool) {
    case 'gmail':
      return {
        ...common,
        action:
          route.intent === 'finance'
            ? 'scan_subscriptions'
            : route.intent === 'gmail'
              ? 'summarize_inbox'
              : 'digest',
      };

    case 'calendar':
      return {
        ...common,
        action:
          route.intent === 'planning' || route.intent === 'productivity'
            ? 'today_plan'
            : 'availability',
      };

    case 'web':
      return {
        ...common,
        action: 'search',
        freshnessRequired: hints.hasFreshnessNeed,
      };

    case 'compare':
      return {
        ...common,
        action: 'compare',
        items: hints.entities,
      };

    case 'file':
      return {
        ...common,
        action: 'inspect',
      };

    case 'finance':
      return {
        ...common,
        action: 'overview',
      };

    case 'notes':
      return {
        ...common,
        action: 'list',
      };

    case 'memory':
    default:
      return {
        ...common,
        action: 'search',
      };
  }
}

function createToolSteps(
  route: AgentRouteResult,
  hints: PlanHint,
  context: AgentContext,
  dependsOn: string[],
): AgentPlanStep[] {
  return route.requiresTools.map((tool, index) =>
    baseStep({
      id: `step-tool-${tool}`,
      title: `Use ${tool} tool`,
      description: `Run the ${tool} capability with intent-driven inputs.`,
      priority: 30 + index,
      requiredTool: tool,
      dependsOn,
      input: buildToolInput(tool, route, hints, context),
    }),
  );
}

function buildSynthesisStep(dependsOn: string[]): AgentPlanStep {
  return baseStep({
    id: 'step-synthesize',
    title: 'Synthesize findings',
    description:
      'Merge memory, tool outputs, and reasoning into a coherent answer strategy.',
    priority: 82,
    dependsOn,
  });
}

function buildGenerateStep(dependsOn: string[]): AgentPlanStep {
  return baseStep({
    id: 'step-generate',
    title: 'Generate final answer',
    description:
      'Produce the best final response using the selected language, context, and evidence.',
    priority: 90,
    dependsOn,
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
  if (steps.length <= max) return sortSteps(steps);

  const protectedIds = new Set([
    'step-intake',
    'step-generate',
    'step-evaluate',
  ]);

  const sorted = sortSteps(steps);
  const kept: AgentPlanStep[] = sorted.filter((step) => protectedIds.has(step.id));
  const optional = sorted.filter((step) => !protectedIds.has(step.id));

  for (const step of optional) {
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

function summarizePlan(route: AgentRouteResult, steps: AgentPlanStep[], toolCount: number): string {
  const titles = steps
    .map((step) => step.title)
    .slice(0, 4)
    .join(' → ');

  return titles
    ? `Plan for ${route.intent}: ${titles}${toolCount ? ` (${toolCount} tool steps)` : ''}.`
    : `Plan for ${route.intent} with ${toolCount} tool steps.`;
}

export function createPlan(
  route: AgentRouteResult,
  context: AgentContext,
): AgentPlan {
  const maxSteps = getMaxSteps(context);
  const hints = buildHints(route, context);

  const steps: AgentPlanStep[] = [
    baseStep({
      id: 'step-intake',
      title: 'Interpret request',
      description:
        'Understand user intent, scope, constraints, urgency, desired outcome, and response language.',
      priority: 1,
      input: {
        intent: route.intent,
        responseLanguage: route.responseLanguage,
        entities: hints.entities,
        userGoal: route.userGoal,
      },
    }),
  ];

  if (route.shouldFetchMemory && route.requiresTools.includes('memory')) {
    steps.push(buildMemoryStep());
  }

  const complexityStep = buildComplexityStep(hints);
  if (complexityStep) {
    steps.push(complexityStep);
  }

  const earlyDependencies = unique([
    'step-intake',
    ...(route.shouldFetchMemory && route.requiresTools.includes('memory') ? ['step-memory'] : []),
    ...(complexityStep ? [complexityStep.id] : []),
  ]);

  const intentSpecificSteps = buildIntentSpecificSteps(route, hints, earlyDependencies);
  steps.push(...intentSpecificSteps);

  const toolDependencyBase = unique([
    ...earlyDependencies,
    ...intentSpecificSteps.map((step) => step.id),
  ]);

  const toolSteps = createToolSteps(route, hints, context, toolDependencyBase);
  steps.push(...toolSteps);

  const synthesisDependsOn = unique(
    steps
      .filter((step) => step.id !== 'step-intake')
      .map((step) => step.id),
  );

  steps.push(buildSynthesisStep(synthesisDependsOn));
  steps.push(buildGenerateStep(['step-synthesize']));
  steps.push(buildEvaluateStep());

  const finalSteps = trimSteps(steps, maxSteps);
  const toolCount = finalSteps.filter((step) => step.requiredTool).length;

  return {
    id: `plan-${context.request.requestId}`,
    intent: route.intent,
    summary: summarizePlan(route, finalSteps, toolCount),
    steps: finalSteps,
    createdAt: context.nowIso,
  };
}
