import { AGENT_VNEXT_MAX_PLAN_STEPS } from './constants';
import type {
  AgentContext,
  AgentPlan,
  AgentPlanStep,
  AgentRouteResult,
  AgentToolName,
} from './types';

type StepStatus = AgentPlanStep['status'];

type PlanHint = {
  requestText: string;
  normalizedText: string;
  wordCount: number;
  isLong: boolean;
  isVeryLong: boolean;
  hasComparison: boolean;
  hasFreshnessNeed: boolean;
  hasActionRequest: boolean;
  hasFileReference: boolean;
  hasTimeReference: boolean;
  hasDecisionPressure: boolean;
  hasUrgency: boolean;
  hasPersonalContextNeed: boolean;
  hasOpenEndedResearchNeed: boolean;
  hasMultiToolPotential: boolean;
  entities: string[];
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
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
    ? (context.request.metadata?.entities as unknown[])
        .map((item) => normalizeText(item))
        .filter(Boolean)
    : [];

  return unique([...routeEntities, ...metadataEntities]).slice(0, 8);
}

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function buildHints(route: AgentRouteResult, context: AgentContext): PlanHint {
  const requestText = getRequestText(context);
  const normalizedText = requestText.toLowerCase();
  const wordCount = requestText.split(/\s+/).filter(Boolean).length;
  const entities = getEntities(route, context);

  const hasComparison =
    route.intent === 'compare' ||
    route.requiresTools.includes('compare') ||
    hasAnyPattern(normalizedText, [/\bvs\b/i, /\bversus\b/i]);

  const hasFreshnessNeed =
    route.intent === 'research' ||
    route.requiresTools.includes('web') ||
    hasAnyPattern(normalizedText, [
      /\blatest\b/i,
      /\brecent\b/i,
      /\btoday\b/i,
      /\bcurrent\b/i,
      /\bnews\b/i,
      /\bajankoht/i,
      /\buusin/i,
      /\btänään\b/i,
    ]);

  const hasActionRequest =
    route.intent === 'planning' ||
    route.intent === 'productivity' ||
    route.intent === 'gmail' ||
    route.intent === 'coding' ||
    hasAnyPattern(normalizedText, [
      /\bshould\b/i,
      /\bwhat should i\b/i,
      /\bhelp me\b/i,
      /\bplan\b/i,
      /\bdecide\b/i,
      /\bdo next\b/i,
      /\bkannatta/i,
      /\bsuunnittele/i,
      /\bauta\b/i,
    ]);

  const hasFileReference =
    route.requiresTools.includes('file') ||
    hasAnyPattern(requestText, [/\.(pdf|docx?|csv|xlsx?|txt|md)\b/i]);

  const hasTimeReference =
    route.requiresTools.includes('calendar') ||
    hasAnyPattern(normalizedText, [
      /\btoday\b/i,
      /\btomorrow\b/i,
      /\bthis week\b/i,
      /\bnext week\b/i,
      /\bavailable\b/i,
      /\bschedule\b/i,
      /\bcalendar\b/i,
      /\btänään\b/i,
      /\bhuomenna\b/i,
      /\bviikko\b/i,
      /\bkalenteri\b/i,
      /\bvapaa\b/i,
    ]);

  const hasDecisionPressure = hasAnyPattern(normalizedText, [
    /\bbest\b/i,
    /\brecommend\b/i,
    /\bwhich\b/i,
    /\bworth it\b/i,
    /\bchoose\b/i,
    /\bparas\b/i,
    /\bsuosittele\b/i,
    /\bkumpi\b/i,
  ]);

  const hasUrgency = hasAnyPattern(normalizedText, [
    /\burgent\b/i,
    /\basap\b/i,
    /\bimmediately\b/i,
    /\bright now\b/i,
    /\bkiire/i,
    /\bnyt\b/i,
  ]);

  const hasPersonalContextNeed =
    route.shouldFetchMemory ||
    route.requiresTools.includes('memory') ||
    hasAnyPattern(normalizedText, [
      /\bfor me\b/i,
      /\bmy\b/i,
      /\bmine\b/i,
      /\babout me\b/i,
      /\bminun\b/i,
      /\bminulle\b/i,
      /\bminusta\b/i,
    ]);

  const hasOpenEndedResearchNeed =
    route.intent === 'research' ||
    hasAnyPattern(normalizedText, [
      /\bresearch\b/i,
      /\blook into\b/i,
      /\bfind out\b/i,
      /\bexplain\b/i,
      /\bselvitä\b/i,
      /\btutki\b/i,
      /\betsi tietoa\b/i,
    ]);

  const hasMultiToolPotential =
    route.requiresTools.length > 1 ||
    (hasComparison && hasFreshnessNeed) ||
    (hasTimeReference && hasActionRequest) ||
    (route.intent === 'finance' && route.requiresTools.includes('gmail'));

  return {
    requestText,
    normalizedText,
    wordCount,
    isLong: wordCount > 24,
    isVeryLong: wordCount > 60,
    hasComparison,
    hasFreshnessNeed,
    hasActionRequest,
    hasFileReference,
    hasTimeReference,
    hasDecisionPressure,
    hasUrgency,
    hasPersonalContextNeed,
    hasOpenEndedResearchNeed,
    hasMultiToolPotential,
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

function buildMemoryStep(route: AgentRouteResult, hints: PlanHint): AgentPlanStep {
  return baseStep({
    id: 'step-memory',
    title: 'Retrieve memory context',
    description:
      'Load relevant preferences, prior decisions, and useful historical context.',
    priority: 10,
    requiredTool: 'memory',
    dependsOn: ['step-intake'],
    input: {
      intent: route.intent,
      query: hints.requestText,
      entities: hints.entities,
      personalContextNeeded: hints.hasPersonalContextNeed,
    },
  });
}

function buildComplexityStep(hints: PlanHint): AgentPlanStep | null {
  if (!hints.isLong && !hints.hasMultiToolPotential && !hints.hasDecisionPressure) {
    return null;
  }

  return baseStep({
    id: 'step-decompose',
    title: 'Decompose request',
    description:
      'Break the request into smaller solvable parts, preserve priorities, and reduce ambiguity.',
    priority: 11,
    dependsOn: ['step-intake'],
    input: {
      wordCount: hints.wordCount,
      longRequest: hints.isLong,
      multiToolPotential: hints.hasMultiToolPotential,
      decisionPressure: hints.hasDecisionPressure,
    },
  });
}

function buildConfidenceGuardStep(
  route: AgentRouteResult,
  hints: PlanHint,
  dependsOn: string[],
): AgentPlanStep | null {
  const needsGuard =
    route.confidence < 0.68 ||
    route.intent === 'unknown' ||
    (hints.hasDecisionPressure && route.requiresTools.length === 0);

  if (!needsGuard) return null;

  return baseStep({
    id: 'step-confidence-guard',
    title: 'Validate execution path',
    description:
      'Double-check that the selected execution path is safe, useful, and proportionate before spending tool budget.',
    priority: 12,
    dependsOn,
    input: {
      routeConfidence: route.confidence,
      intent: route.intent,
      requiresTools: route.requiresTools,
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
            'Clarify the research goal, freshness needs, answer depth, and expected output.',
          priority: 14,
          dependsOn,
          input: {
            freshnessRequired: hints.hasFreshnessNeed,
            entities: hints.entities,
            openEnded: hints.hasOpenEndedResearchNeed,
          },
        }),
      ];

    case 'compare':
      return [
        baseStep({
          id: 'step-criteria',
          title: 'Define comparison criteria',
          description:
            'Identify evaluation dimensions, user priorities, tradeoffs, and recommendation factors.',
          priority: 14,
          dependsOn,
          input: {
            entities: hints.entities,
            comparisonDetected: hints.hasComparison,
            decisionPressure: hints.hasDecisionPressure,
          },
        }),
      ];

    case 'planning':
      return [
        baseStep({
          id: 'step-goals',
          title: 'Clarify planning goals',
          description:
            'Identify desired outcome, constraints, urgency, and what a successful plan should optimize for.',
          priority: 14,
          dependsOn,
          input: {
            urgency: hints.hasUrgency,
            timeReference: hints.hasTimeReference,
          },
        }),
      ];

    case 'productivity':
      return [
        baseStep({
          id: 'step-productivity-scope',
          title: 'Clarify productivity scope',
          description:
            'Determine whether the user needs scheduling, prioritization, execution support, or all three.',
          priority: 14,
          dependsOn,
          input: {
            timeReference: hints.hasTimeReference,
            actionRequest: hints.hasActionRequest,
          },
        }),
      ];

    case 'finance':
      return [
        baseStep({
          id: 'step-finance-goal',
          title: 'Clarify financial goal',
          description:
            'Identify whether the user wants savings, budgeting, subscription review, tradeoff analysis, or broader financial guidance.',
          priority: 14,
          dependsOn,
          input: {
            decisionPressure: hints.hasDecisionPressure,
          },
        }),
      ];

    case 'gmail':
      return [
        baseStep({
          id: 'step-email-scope',
          title: 'Clarify inbox task',
          description:
            'Determine whether the user needs inbox summary, urgent triage, subscription review, digest, or reply help.',
          priority: 14,
          dependsOn,
        }),
      ];

    case 'memory':
      return [
        baseStep({
          id: 'step-memory-filter',
          title: 'Filter memory scope',
          description:
            'Prioritize the most relevant historical context and suppress low-value memory noise.',
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
            'Identify stack, constraints, acceptance criteria, file dependencies, and likely failure modes.',
          priority: 14,
          dependsOn,
          input: {
            hasFileReference: hints.hasFileReference,
            entities: hints.entities,
          },
        }),
      ];

    case 'shopping':
      return [
        baseStep({
          id: 'step-shopping-criteria',
          title: 'Define shopping criteria',
          description:
            'Clarify budget, non-negotiables, user preferences, and decision tradeoffs before comparing options.',
          priority: 14,
          dependsOn,
          input: {
            entities: hints.entities,
            decisionPressure: hints.hasDecisionPressure,
          },
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
    inputLanguage: route.inputLanguage,
    userId: context.request.userId,
    decisionPressure: hints.hasDecisionPressure,
    urgency: hints.hasUrgency,
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
        hasTimeReference: hints.hasTimeReference,
      };

    case 'web':
      return {
        ...common,
        action: 'search',
        freshnessRequired: hints.hasFreshnessNeed,
        openEndedResearch: hints.hasOpenEndedResearchNeed,
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
      description: `Run the ${tool} capability with intent-aware, context-aware inputs.`,
      priority: 30 + index,
      requiredTool: tool,
      dependsOn,
      input: buildToolInput(tool, route, hints, context),
    }),
  );
}

function buildSynthesisStep(dependsOn: string[], route: AgentRouteResult): AgentPlanStep {
  return baseStep({
    id: 'step-synthesize',
    title: 'Synthesize findings',
    description:
      'Merge memory, tool outputs, and reasoning into a coherent answer strategy with the right depth.',
    priority: 82,
    dependsOn,
    input: {
      intent: route.intent,
      shouldBeConcise: route.intent === 'general' && route.requiresTools.length === 0,
    },
  });
}

function buildGenerateStep(dependsOn: string[], route: AgentRouteResult): AgentPlanStep {
  return baseStep({
    id: 'step-generate',
    title: 'Generate final answer',
    description:
      'Produce the final response using the selected language, evidence, and best-fit presentation style.',
    priority: 90,
    dependsOn,
    input: {
      responseLanguage: route.responseLanguage,
      intent: route.intent,
    },
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
    'step-synthesize',
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
        routeConfidence: route.confidence,
      },
    }),
  ];

  if (route.shouldFetchMemory && route.requiresTools.includes('memory')) {
    steps.push(buildMemoryStep(route, hints));
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

  const confidenceGuardStep = buildConfidenceGuardStep(route, hints, earlyDependencies);
  if (confidenceGuardStep) {
    steps.push(confidenceGuardStep);
  }

  const intentSpecificDependencies = unique([
    ...earlyDependencies,
    ...(confidenceGuardStep ? [confidenceGuardStep.id] : []),
  ]);

  const intentSpecificSteps = buildIntentSpecificSteps(
    route,
    hints,
    intentSpecificDependencies,
  );
  steps.push(...intentSpecificSteps);

  const toolDependencyBase = unique([
    ...intentSpecificDependencies,
    ...intentSpecificSteps.map((step) => step.id),
  ]);

  const toolSteps = createToolSteps(route, hints, context, toolDependencyBase);
  steps.push(...toolSteps);

  const synthesisDependsOn = unique(
    steps
      .filter((step) => step.id !== 'step-intake')
      .map((step) => step.id),
  );

  steps.push(buildSynthesisStep(synthesisDependsOn, route));
  steps.push(buildGenerateStep(['step-synthesize'], route));
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
