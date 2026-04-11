import { ExecutionPlanV8, PlanModeV8, PlanStepV8, RouteResultV8 } from './types';

function buildStep(
  id: string,
  title: string,
  tool: PlanStepV8['tool'],
  description: string,
  input: Record<string, unknown>,
  required: boolean,
): PlanStepV8 {
  return { id, title, tool, description, input, required };
}

function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[$,€£]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractCompareOptions(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();

  const explicitVs = normalized.match(/([^?.,\n]+?)\s+(?:vs|versus)\s+([^?.,\n]+)/i);
  const monthlyVsYearly = normalized.match(/\b(monthly|mo|kuukausi(?:ttain)?)\b.*\b(yearly|annual|yr|vuosi(?:ttain)?)\b/i)
    || normalized.match(/\b(yearly|annual|yr|vuosi(?:ttain)?)\b.*\b(monthly|mo|kuukausi(?:ttain)?)\b/i);

  const segments = explicitVs
    ? [explicitVs[1], explicitVs[2]]
    : monthlyVsYearly
      ? ['monthly plan', 'yearly plan']
      : [];

  if (segments.length < 2) return [];

  const fromSegment = (segment: string, index: number) => {
    const monthlyMatch = segment.match(/[$€£]?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly|kk|kuukausi))/i);
    const yearlyMatch = segment.match(/[$€£]?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:year|yr|yearly|annual|vuosi))/i);
    const genericMoney = segment.match(/[$€£]?\s?(\d[\d,.]*)/i);

    const label = segment
      .replace(/[$€£]?\s?\d[\d,.]*\s*(?:\/?\s?(?:month|mo|monthly|kk|kuukausi|year|yr|yearly|annual|vuosi))?/gi, '')
      .replace(/\b(vs|versus|or)\b/gi, '')
      .trim()
      .replace(/\s{2,}/g, ' ');

    const monthlyCost = parseMoney(monthlyMatch?.[1] || '');
    const annualCost = parseMoney(yearlyMatch?.[1] || '');
    const fallbackAmount = parseMoney(genericMoney?.[1] || '');

    return {
      id: `option_${index + 1}`,
      label: label || `Option ${index + 1}`,
      monthlyCost: monthlyCost || (!annualCost ? fallbackAmount : null),
      annualCost,
      switchingCost: 0,
      valueScore: null as number | null,
      inferredFromMessage: Boolean(monthlyMatch || yearlyMatch || genericMoney),
    };
  };

  return segments.map(fromSegment).filter((item) => item.monthlyCost || item.annualCost);
}

function extractSavingsInputs(message: string) {
  const lower = message.toLowerCase();

  const timelineMonths = message.match(/(\d+)\s*(month|months|mo)\b/i);
  const timelineYears = message.match(/(\d+)\s*(year|years|yr)\b/i);
  const explicitTarget =
    message.match(/save\s+[$€£]?\s?(\d[\d,.]*)/i)
    || message.match(/target\s+[$€£]?\s?(\d[\d,.]*)/i)
    || message.match(/sääst(?:ää|a|ö)?\s+[$€£]?\s?(\d[\d,.]*)/i);

  const incomeMatch =
    message.match(/income[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i)
    || message.match(/make[^$\d€£]*([$€£]?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i)
    || message.match(/tulo[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i);

  const expensesMatch =
    message.match(/expenses?[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i)
    || message.match(/spend[^$\d€£]*([$€£]?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i)
    || message.match(/kulu[t]?[^$\d€£]*([$€£]?\s?\d[\d,.]*)/i);

  const desiredSavings =
    message.match(/(?:save|saving)[^$\d€£]*([$€£]?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i)
    || message.match(/sääst(?:ää|a|ö)?[^$\d€£]*([$€£]?\s?\d[\d,.]*)\s*(?:\/?\s?(?:kk|kuukausi|month|monthly))?/i);

  const deadlineMonths = timelineMonths
    ? Number(timelineMonths[1])
    : timelineYears
      ? Number(timelineYears[1]) * 12
      : null;

  return {
    targetAmount: parseMoney(explicitTarget?.[1] || ''),
    deadlineMonths,
    monthlyIncome: parseMoney(incomeMatch?.[1] || ''),
    monthlyExpenses: parseMoney(expensesMatch?.[1] || ''),
    desiredMonthlySavings: parseMoney(desiredSavings?.[1] || ''),
    profile: /\bstudent|opiskelija\b/.test(lower)
      ? 'student'
      : /\bfamily|kids|perhe|lapsi\b/.test(lower)
        ? 'family'
        : 'general',
  };
}

function inferCancellationService(message: string): string | null {
  const match = message.match(/\b(cancel|stop|end|unsubscribe|peruuta|lopeta)\b(?:\s+my|\s+the)?\s+([a-z0-9][a-z0-9+ .&-]{1,40})/i);
  if (!match) return null;

  const service = match[2]
    .replace(/\b(subscription|plan|membership|tilaus)\b/gi, '')
    .trim();

  return service.length > 1 ? service : null;
}

function uniquePlanModes(modes: PlanModeV8[]): PlanModeV8[] {
  return Array.from(new Set(modes));
}

export function createPlanV8(route: RouteResultV8, message: string): ExecutionPlanV8 {
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
  const savingsInputs =
    route.subtype === 'savings_audit' || route.subtype === 'budgeting'
      ? extractSavingsInputs(message)
      : null;

  const cancellationService = route.subtype === 'subscriptions' ? inferCancellationService(message) : null;

  const complexitySignals = [
    message.split(/\s+/).length > 22,
    /\b(compare|tradeoff|roadmap|plan|optimi[sz]e|prioriti[sz]e|strategy)\b/i.test(message),
    route.goal.urgency === 'high',
    route.goal.riskLevel === 'high',
    route.goal.blockerLevel === 'high',
    route.goal.hiddenOpportunities.length >= 2,
    route.responseMode === 'operator',
    route.responseMode === 'coach',
    route.ambiguity > 0.55,
  ].filter(Boolean).length;

  const depth: ExecutionPlanV8['depth'] =
    complexitySignals >= 3 ? 'deep' : complexitySignals >= 1 ? 'standard' : 'light';

  const compareNeedsClarification = route.subtype === 'compare_options' && compareOptions.length < 2;
  const savingsNeedsClarification =
    (route.subtype === 'budgeting' || route.subtype === 'savings_audit')
    && savingsInputs
    && !savingsInputs.targetAmount
    && !savingsInputs.monthlyIncome
    && !savingsInputs.monthlyExpenses
    && !savingsInputs.desiredMonthlySavings;

  const needsClarification = route.shouldClarify || (route.intent === 'finance' && (compareNeedsClarification || savingsNeedsClarification));

  const clarificationQuestion = needsClarification
      ? compareNeedsClarification
      ? 'Which two options should I compare, and what are their monthly or annual prices?'
      : route.ambiguity > 0.65
        ? 'Should I focus first on reducing recurring costs, improving cashflow safety, or comparing options?'
        : 'What is one concrete number I should optimize around: monthly budget, target savings, or a recurring cost?'
    : undefined;

  let planModes = mapSubtypeToModes();

  if (needsClarification) {
    planModes.push('clarify');
  }

  planModes.push('verify');
  planModes = uniquePlanModes(planModes);

  if (route.intent === 'finance' && route.needsFinanceData) {
    const steps: PlanStepV8[] = [];
    let stepId = 1;
    const nextStep = () => String(stepId++);

    const scopeBySubtype: Record<string, string> = {
      subscriptions: 'subscriptions',
      bills: 'bills',
      savings_audit: 'savings',
      compare_options: 'comparison',
      budgeting: 'budget',
      cashflow: 'cashflow',
      alerts_review: 'alerts',
      general_finance: 'overview',
    };

    steps.push(
      buildStep(
        nextStep(),
        'Read finance baseline',
        'finance_read',
        'Load finance profile, recurring charges, and baseline cost signals for grounded reasoning.',
        { scope: scopeBySubtype[route.subtype] || 'overview' },
        true,
      ),
    );

    const financeOnlyButNoNeedForEmail =
      route.intent === 'finance'
      && !/\b(email|gmail|inbox|mail|receipt|invoice)\b/i.test(message)
      && (route.subtype === 'compare_options' || route.subtype === 'budgeting' || route.subtype === 'cashflow');

    if (route.needsGmail && !financeOnlyButNoNeedForEmail) {
      steps.push(
        buildStep(
          nextStep(),
          'Fetch finance-related Gmail signals',
          'gmail_fetch',
          'Read only email metadata relevant to billing, receipts, renewals, or finance alerts.',
          {
            financeOnly: true,
            query: message,
            subtype: route.subtype,
          },
          route.subtype === 'bills' || route.subtype === 'alerts_review' || route.goal.riskLevel === 'high',
        ),
      );
    }

    if (route.subtype === 'subscriptions') {
      steps.push(
        buildStep(
          nextStep(),
          'Detect recurring waste',
          'detect_leaks',
          'Detect potentially low-value recurring payments, trials, and duplicate subscription patterns.',
          {
            includeTrials: true,
            maxItems: 8,
          },
          false,
        ),
      );
    }

    if (planModes.includes('compare')) {
      steps.push(
        buildStep(
          nextStep(),
          'Compare financial options',
          'finance_compare_options',
          'Compare available options by cost, timing, switching friction, and value assumptions.',
          {
            query: message,
            useFinanceBaseline: true,
            options: compareOptions,
            requiresUserClarification: compareNeedsClarification,
            allowAssumptionMode: true,
          },
          false,
        ),
      );
    }

    if (route.subtype === 'savings_audit' || route.subtype === 'budgeting') {
      steps.push(
        buildStep(
          nextStep(),
          'Build savings plan',
          'savings_plan_generator',
          'Generate a realistic monthly savings plan from available constraints, goals, and recurring costs.',
          {
            query: message,
            ...(savingsInputs || {}),
            allowStarterPlan: true,
            requiresUserClarification: savingsNeedsClarification,
          },
          false,
        ),
      );
    }

    if (route.subtype === 'subscriptions' && (route.responseMode === 'operator' || cancellationService)) {
      steps.push(
        buildStep(
          nextStep(),
          'Draft subscription cancellation',
          'subscription_cancel_draft',
          'Prepare a ready-to-send cancellation draft and checklist for the most relevant service.',
          {
            service: cancellationService || 'subscription from recent recurring charges',
            requiresServiceDisambiguation: !cancellationService,
          },
          false,
        ),
      );
    }

    const addedRoadmapStep =
      route.subtype === 'savings_audit' || route.subtype === 'cashflow' || route.subtype === 'general_finance';
    if (addedRoadmapStep) {
      steps.push(
        buildStep(
          nextStep(),
          'Build ranked 30-day roadmap',
          'generate_recommendations',
          'Create a staged plan with immediate wins, weekly actions, and risk controls.',
          {
            limit: 6,
            includeRoadmap: true,
            horizonDays: 30,
            responseMode: route.responseMode,
          },
          false,
        ),
      );
    }

    if (route.subtype === 'cashflow' || route.subtype === 'budgeting' || route.subtype === 'bills') {
      steps.push(
        buildStep(
          nextStep(),
          'Summarize cashflow health',
          'cashflow_summary',
          'Summarize inflows, outflows, net pressure, and immediate financial pressure points.',
          { period: 'monthly' },
          route.subtype === 'cashflow',
        ),
      );
    }

    if (
      route.subtype === 'subscriptions'
      || route.subtype === 'bills'
      || route.subtype === 'alerts_review'
      || route.subtype === 'cashflow'
    ) {
      steps.push(
        buildStep(
          nextStep(),
          'Detect suspicious price changes',
          'price_change_detector',
          'Detect unusual recurring price increases, suspicious changes, and possible billing drift.',
          { sensitivity: 'standard' },
          false,
        ),
      );
    }

    if ((route.wantsRecommendations || planModes.includes('recommend') || planModes.includes('monitor')) && !addedRoadmapStep) {
      steps.push(
        buildStep(
          nextStep(),
          'Generate strategic recommendations',
          'generate_recommendations',
          'Rank high-impact recommendations grounded in finance evidence, alerts, and current user goal.',
          {
            limit: planModes.includes('monitor') ? 6 : 5,
            subtype: route.subtype,
            modeHints: planModes,
            responseMode: route.responseMode,
          },
          false,
        ),
      );
    }

    return {
      intent: route.intent,
      subtype: route.subtype,
      mode: route.mode,
      planModes,
      depth,
      clarificationQuestion,
      summary: route.needsGmail
        ? `Finance ${route.subtype} workflow using finance baseline plus minimal Gmail evidence only when justified.`
        : `Finance ${route.subtype} workflow using grounded finance baseline only, keeping the toolchain minimal and useful.`,
      steps,
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
        buildStep(
          '1',
          'Fetch Gmail context',
          'gmail_fetch',
          'Read mailbox metadata needed for the user request.',
          {
            financeOnly: false,
            query: message,
          },
          true,
        ),
      ],
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
  };
}
