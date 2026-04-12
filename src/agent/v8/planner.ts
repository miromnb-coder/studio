import { AgentContextV8, ExecutionPlanV8, PlanModeV8, PlanStepV8, RouteResultV8 } from './types';

function buildStep(
  id: string,
  title: string,
  tool: PlanStepV8['tool'],
  description: string,
  input: Record<string, unknown>,
  required: boolean,
  options?: Partial<PlanStepV8>,
): PlanStepV8 {
  return {
    id,
    title,
    tool,
    description,
    input,
    required,
    toolNecessity: required ? 'required' : 'high_value',
    expectedValue: 0.5,
    costEstimate: 0.35,
    confidenceDelta: 0.12,
    ...options,
  };
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,€£]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractCompareOptions(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  const explicitVs = normalized.match(/([^?.,\n]+?)\s+(?:vs|versus)\s+([^?.,\n]+)/i);
  const segments = explicitVs ? [explicitVs[1], explicitVs[2]] : [];

  if (segments.length < 2) return [];

  return segments.map((segment, index) => {
    const monthlyMatch = segment.match(/[$€£]?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))/i);
    const yearlyMatch = segment.match(/[$€£]?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:year|yr|yearly|annual))/i);
    const genericMoney = segment.match(/[$€£]?\s?(\d[\d,.]*)/i);

    return {
      id: `option_${index + 1}`,
      label: segment.replace(/[$€£]?\s?\d[\d,.]*/g, '').replace(/\b(vs|versus|or)\b/gi, '').trim() || `Option ${index + 1}`,
      monthlyCost: parseMoney(monthlyMatch?.[1] || '') || (!yearlyMatch ? parseMoney(genericMoney?.[1] || '') : null),
      annualCost: parseMoney(yearlyMatch?.[1] || ''),
      switchingCost: 0,
      valueScore: null as number | null,
    };
  }).filter((item) => item.monthlyCost || item.annualCost);
}

function extractSavingsInputs(message: string) {
  const timelineMonths = message.match(/(\d+)\s*(month|months|mo)\b/i);
  const timelineYears = message.match(/(\d+)\s*(year|years|yr)\b/i);

  const explicitTarget = message.match(/save\s+[$€£]?\s?(\d[\d,.]*)/i) || message.match(/target\s+[$€£]?\s?(\d[\d,.]*)/i);
  const incomeMatch = message.match(/income[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i);
  const expensesMatch = message.match(/expenses?[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i);

  return {
    targetAmount: parseMoney(explicitTarget?.[1] || ''),
    deadlineMonths: timelineMonths ? Number(timelineMonths[1]) : timelineYears ? Number(timelineYears[1]) * 12 : null,
    monthlyIncome: parseMoney(incomeMatch?.[1] || ''),
    monthlyExpenses: parseMoney(expensesMatch?.[1] || ''),
  };
}

function inferCancellationService(message: string): string | null {
  const match = message.match(/\b(cancel|stop|end|unsubscribe)\b(?:\s+my|\s+the)?\s+([a-z0-9][a-z0-9+ .&-]{1,40})/i);
  if (!match) return null;

  const service = match[2].replace(/\b(subscription|plan|membership)\b/gi, '').trim();
  return service.length > 1 ? service : null;
}

function uniquePlanModes(modes: PlanModeV8[]): PlanModeV8[] {
  return Array.from(new Set(modes));
}

function localizedClarificationQuestion(route: RouteResultV8): string {
  if (route.subtype === 'compare_options') return 'Which two options should I compare, and what are their monthly or annual prices?';
  if (route.subtype === 'subscriptions') return 'Should I prioritize biggest monthly savings, lowest cancellation friction, or lowest service risk first?';
  return 'What is one concrete number I should optimize around: monthly budget, target savings, or a recurring cost?';
}

function choosePlanningProfile(route: RouteResultV8, message: string, context?: AgentContextV8): ExecutionPlanV8['planningProfile'] {
  if (route.goal.emotionalTone === 'overwhelmed') return 'low_cognitive_load';
  if (route.goal.urgency === 'high' || route.goal.speedVsDepth === 'speed') return 'fast_path';
  if (route.intent === 'research' || /latest|evidence|sources|verify|compare/i.test(message)) return 'evidence_first';
  if (route.goal.speedVsDepth === 'depth' || message.split(/\s+/).length > 35) return 'deep_analysis';
  if (context?.decisionContext.outcomeLearning.speedFirst) return 'fast_path';
  return 'minimal';
}

function chooseDepth(profile: ExecutionPlanV8['planningProfile'], route: RouteResultV8): ExecutionPlanV8['depth'] {
  if (profile === 'fast_path' || profile === 'minimal') return 'light';
  if (profile === 'deep_analysis' || profile === 'evidence_first') return 'deep';
  if (route.ambiguity > 0.5) return 'deep';
  return 'standard';
}

export function createPlanV8(route: RouteResultV8, message: string, context?: AgentContextV8): ExecutionPlanV8 {
  const mapSubtypeToModes = (): PlanModeV8[] => {
    switch (route.subtype) {
      case 'subscriptions':
        return ['audit', 'recommend', 'act'];
      case 'savings_audit':
        return ['audit', 'recommend'];
      case 'compare_options':
        return ['compare', 'recommend'];
      case 'bills':
        return ['audit', 'monitor'];
      case 'cashflow':
        return ['audit', 'recommend'];
      case 'budgeting':
        return ['recommend'];
      case 'alerts_review':
        return ['monitor', 'recommend'];
      case 'general_finance':
        return ['recommend'];
      default:
        return [];
    }
  };

  const compareOptions = route.subtype === 'compare_options' ? extractCompareOptions(message) : [];
  const savingsInputs = route.subtype === 'savings_audit' || route.subtype === 'budgeting' ? extractSavingsInputs(message) : null;
  const cancellationService = route.subtype === 'subscriptions' ? inferCancellationService(message) : null;

  const compareNeedsClarification = route.subtype === 'compare_options' && compareOptions.length < 2;
  const savingsNeedsClarification = (route.subtype === 'budgeting' || route.subtype === 'savings_audit')
    && savingsInputs
    && !savingsInputs.targetAmount
    && !savingsInputs.monthlyIncome
    && !savingsInputs.monthlyExpenses;

  const profile = choosePlanningProfile(route, message, context);
  const depth = chooseDepth(profile, route);

  const highValueClarification = route.shouldClarify && (route.ambiguity > 0.65 || compareNeedsClarification || savingsNeedsClarification);
  const clarificationQuestion = highValueClarification ? localizedClarificationQuestion(route) : undefined;

  let planModes = mapSubtypeToModes();
  if (highValueClarification) planModes.push('clarify');
  planModes.push('verify');
  planModes = uniquePlanModes(planModes);

  if (route.intent === 'finance' && route.needsFinanceData) {
    const steps: PlanStepV8[] = [];
    let stepId = 1;
    const nextStep = () => String(stepId++);

    steps.push(buildStep(
      nextStep(),
      'Gather baseline signals',
      'finance_read',
      'Load finance profile and recurring cost baselines for grounded prioritization.',
      { scope: route.subtype || 'overview' },
      true,
      {
        expectedValue: 0.95,
        costEstimate: 0.18,
        confidenceDelta: 0.4,
        stopIfConfidenceAbove: profile === 'fast_path' ? 0.76 : undefined,
        decisionNote: 'Always run first: most downstream reasoning quality depends on this baseline.',
      },
    ));

    const shouldUseGmail = route.needsGmail && profile !== 'fast_path';
    if (shouldUseGmail) {
      steps.push(buildStep(
        nextStep(),
        'Pull billing evidence from Gmail',
        'gmail_fetch',
        'Collect only billing/receipt/renewal evidence to improve confidence in recurring-cost detection.',
        { financeOnly: true, query: message, subtype: route.subtype },
        route.subtype === 'bills' || route.subtype === 'alerts_review',
        {
          toolNecessity: route.subtype === 'subscriptions' ? 'high_value' : 'optional',
          expectedValue: route.subtype === 'subscriptions' ? 0.76 : 0.58,
          costEstimate: 0.52,
          confidenceDelta: 0.16,
          decisionNote: 'Use only if likely to change ranking confidence materially.',
        },
      ));
    }

    if (route.subtype === 'subscriptions') {
      steps.push(buildStep(
        nextStep(),
        'Detect recurring leaks and rank cancel targets',
        'detect_leaks',
        'Identify recurring costs and rank candidates by savings, friction, and downside risk.',
        { includeTrials: true, maxItems: depth === 'deep' ? 10 : 6 },
        false,
        {
          toolNecessity: 'high_value',
          expectedValue: 0.84,
          costEstimate: 0.35,
          confidenceDelta: 0.18,
          dependsOn: ['1'],
        },
      ));

      if (cancellationService || route.responseMode === 'operator') {
        steps.push(buildStep(
          nextStep(),
          'Prepare cancellation asset',
          'subscription_cancel_draft',
          'Generate a ready-to-send cancellation draft for the highest-value target.',
          { service: cancellationService || 'highest ranked service', requiresServiceDisambiguation: !cancellationService },
          false,
          {
            toolNecessity: 'optional',
            expectedValue: 0.63,
            costEstimate: 0.25,
            confidenceDelta: 0.09,
            stopIfConfidenceAbove: 0.88,
          },
        ));
      }
    }

    if (planModes.includes('compare')) {
      steps.push(buildStep(
        nextStep(),
        'Compare options and model tradeoffs',
        'finance_compare_options',
        'Quantify tradeoffs, switching friction, and payoff horizon for top options.',
        { query: message, useFinanceBaseline: true, options: compareOptions, requiresUserClarification: compareNeedsClarification },
        false,
        {
          toolNecessity: compareNeedsClarification ? 'fallback' : 'high_value',
          expectedValue: 0.86,
          costEstimate: 0.24,
          confidenceDelta: 0.26,
          dependsOn: ['1'],
        },
      ));
    }

    if (route.subtype === 'savings_audit' || route.subtype === 'budgeting') {
      steps.push(buildStep(
        nextStep(),
        'Build constrained savings plan',
        'savings_plan_generator',
        'Generate a realistic plan from goal, timeline, and monthly constraints.',
        { query: message, ...(savingsInputs || {}), allowStarterPlan: true, requiresUserClarification: savingsNeedsClarification },
        false,
        {
          toolNecessity: 'high_value',
          expectedValue: 0.81,
          costEstimate: 0.28,
          confidenceDelta: 0.22,
          dependsOn: ['1'],
        },
      ));
    }

    if (route.subtype === 'cashflow' || route.subtype === 'budgeting' || route.subtype === 'bills') {
      steps.push(buildStep(
        nextStep(),
        'Summarize cashflow pressure',
        'cashflow_summary',
        'Estimate inflow/outflow pressure and near-term solvency risk.',
        { period: 'monthly' },
        route.subtype === 'cashflow',
        {
          expectedValue: 0.73,
          costEstimate: 0.22,
          confidenceDelta: 0.19,
        },
      ));
    }

    if (route.subtype === 'subscriptions' || route.subtype === 'bills' || route.subtype === 'alerts_review' || route.subtype === 'cashflow') {
      steps.push(buildStep(
        nextStep(),
        'Check for price drift anomalies',
        'price_change_detector',
        'Detect suspicious recurring price increases likely to affect recommendation priority.',
        { sensitivity: profile === 'deep_analysis' ? 'high' : 'standard' },
        false,
        {
          toolNecessity: 'optional',
          expectedValue: 0.6,
          costEstimate: 0.2,
          confidenceDelta: 0.13,
        },
      ));
    }

    steps.push(buildStep(
      nextStep(),
      'Synthesize ranked actions',
      'generate_recommendations',
      'Create a ranked action list informed by evidence, memory, and execution constraints.',
      {
        limit: profile === 'low_cognitive_load' ? 3 : 6,
        includeRoadmap: profile !== 'fast_path',
        horizonDays: profile === 'fast_path' ? 14 : 30,
        modeHints: planModes,
        responseMode: route.responseMode,
      },
      false,
      {
        toolNecessity: 'high_value',
        expectedValue: 0.82,
        costEstimate: 0.3,
        confidenceDelta: 0.2,
        dependsOn: ['1'],
      },
    ));

    return {
      intent: route.intent,
      subtype: route.subtype,
      mode: route.mode,
      planModes,
      summary: `Adaptive finance workflow (${profile}) with dynamic stop/re-plan hooks and value-gated tools.`,
      depth,
      clarificationQuestion,
      steps,
      planningProfile: profile,
    };
  }

  if (route.intent === 'gmail') {
    return {
      intent: route.intent,
      subtype: route.subtype,
      mode: route.mode,
      planModes: ['act', 'verify'],
      depth: 'standard',
      summary: 'Handle explicit Gmail request using email tool only.',
      steps: [
        buildStep('1', 'Fetch Gmail context', 'gmail_fetch', 'Read mailbox metadata needed for the user request.', { financeOnly: false, query: message }, true),
      ],
      planningProfile: 'evidence_first',
    };
  }

  return {
    intent: route.intent,
    subtype: route.subtype,
    mode: route.mode,
    planModes: ['verify'],
    depth: 'light',
    summary: 'Direct response path. No tools required.',
    steps: [],
    planningProfile: 'minimal',
  };
}
