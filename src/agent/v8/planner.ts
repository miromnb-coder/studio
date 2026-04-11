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
  const cleaned = raw.replace(/[$,]/g, '').trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function extractCompareOptions(message: string) {
  const normalized = message.replace(/\s+/g, ' ').trim();
  const pairs = normalized.match(/([^?.,\n]+?)\s+(?:vs|versus)\s+([^?.,\n]+)/i);
  if (!pairs) return [];

  const fromSegment = (segment: string, index: number) => {
    const monthlyMatch = segment.match(/\$?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))/i);
    const yearlyMatch = segment.match(/\$?\s?(\d[\d,.]*)\s*(?:\/?\s?(?:year|yr|yearly|annual))/i);
    const genericMoney = segment.match(/\$+\s?(\d[\d,.]*)/i) || segment.match(/\b(\d[\d,.]*)\b/);
    const label = segment
      .replace(/\$?\s?\d[\d,.]*\s*(?:\/?\s?(?:month|mo|monthly|year|yr|yearly|annual))?/gi, '')
      .replace(/\b(vs|versus|or)\b/gi, '')
      .trim()
      .replace(/\s{2,}/g, ' ');

    return {
      id: `option_${index + 1}`,
      label: label || `Option ${index + 1}`,
      monthlyCost: parseMoney(monthlyMatch?.[1] || ''),
      annualCost: parseMoney(yearlyMatch?.[1] || ''),
      switchingCost: 0,
      valueScore: null as number | null,
      inferredFromMessage: Boolean(monthlyMatch || yearlyMatch || genericMoney),
      fallbackAmount: parseMoney(genericMoney?.[1] || ''),
    };
  };

  const options = [fromSegment(pairs[1], 0), fromSegment(pairs[2], 1)].map((item) => {
    if (!item.monthlyCost && !item.annualCost && item.fallbackAmount) {
      return { ...item, monthlyCost: item.fallbackAmount };
    }
    return item;
  });

  return options;
}

function extractSavingsInputs(message: string) {
  const lower = message.toLowerCase();
  const money = Array.from(message.matchAll(/\$?\s?(\d[\d,.]*)/g)).map((m) => parseMoney(m[1])).filter((n): n is number => Boolean(n));
  const timelineMonths = message.match(/(\d+)\s*(month|months|mo)\b/i);
  const timelineYears = message.match(/(\d+)\s*(year|years|yr)\b/i);
  const explicitTarget = message.match(/save\s+\$?\s?(\d[\d,.]*)/i) || message.match(/target\s+\$?\s?(\d[\d,.]*)/i);
  const incomeMatch = message.match(/income[^$\d]*(\$?\s?\d[\d,.]*)/i) || message.match(/make[^$\d]*(\$?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i);
  const expensesMatch = message.match(/expenses?[^$\d]*(\$?\s?\d[\d,.]*)/i) || message.match(/spend[^$\d]*(\$?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i);
  const desiredSavings = message.match(/(?:save|saving)[^$\d]*(\$?\s?\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))?/i);

  const deadlineMonths = timelineMonths
    ? Number(timelineMonths[1])
    : timelineYears
      ? Number(timelineYears[1]) * 12
      : null;
  const targetAmount = parseMoney(explicitTarget?.[1] || '') || (money.length === 1 ? money[0] : null);

  return {
    targetAmount,
    deadlineMonths,
    monthlyIncome: parseMoney(incomeMatch?.[1] || ''),
    monthlyExpenses: parseMoney(expensesMatch?.[1] || ''),
    desiredMonthlySavings: parseMoney(desiredSavings?.[1] || ''),
    profile: /\bstudent\b/.test(lower) ? 'student' : /\bfamily|kids\b/.test(lower) ? 'family' : 'general',
  };
}

function inferCancellationService(message: string): string | null {
  const match = message.match(/\b(cancel|stop|end|unsubscribe)\b(?:\s+my|\s+the)?\s+([a-z0-9][a-z0-9+ .&-]{1,40})/i);
  if (!match) return null;
  const service = match[2].replace(/\b(subscription|plan|membership)\b/gi, '').trim();
  return service.length > 1 ? service : null;
}

export function createPlanV8(route: RouteResultV8, message: string): ExecutionPlanV8 {
  const mapSubtypeToModes = (): PlanModeV8[] => {
    switch (route.subtype) {
      case 'subscriptions':
      case 'savings_audit':
        return ['audit', 'recommend'];
      case 'compare_options':
        return ['compare'];
      case 'bills':
      case 'cashflow':
        return ['audit'];
      case 'budgeting':
      case 'general_finance':
        return ['recommend'];
      case 'alerts_review':
        return ['monitor', 'recommend'];
      default:
        return [];
    }
  };

  const planModes = mapSubtypeToModes();
  const compareOptions = route.subtype === 'compare_options' ? extractCompareOptions(message) : [];
  const savingsInputs = route.subtype === 'savings_audit' || route.subtype === 'budgeting' ? extractSavingsInputs(message) : null;
  const cancellationService = route.subtype === 'subscriptions' ? inferCancellationService(message) : null;
  const complexitySignals = [
    message.split(/\s+/).length > 22,
    /\b(compare|tradeoff|roadmap|plan|optimi[sz]e|prioriti[sz]e)\b/i.test(message),
    route.goal.urgency === 'high',
    route.goal.hiddenOpportunities.length >= 2,
  ].filter(Boolean).length;
  const depth: ExecutionPlanV8['depth'] = complexitySignals >= 3 ? 'deep' : complexitySignals >= 1 ? 'standard' : 'light';
  const needsClarification = route.intent === 'finance'
    && ((route.subtype === 'compare_options' && compareOptions.length < 2)
      || ((route.subtype === 'budgeting' || route.subtype === 'savings_audit') && !/\$|\d/.test(message)));
  const clarificationQuestion = needsClarification
    ? route.subtype === 'compare_options'
      ? 'Which two options should I compare, and what are their monthly or annual prices?'
      : 'What is one concrete number I should optimize around (monthly budget, debt payment, or target savings)?'
    : undefined;

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

    steps.push(buildStep(
      nextStep(),
      'Read finance baseline',
      'finance_read',
      'Load finance profile and recurring costs needed for a grounded answer.',
      { scope: scopeBySubtype[route.subtype] || 'overview' },
      true,
    ));

    if (route.needsGmail) {
      steps.push(buildStep(
        nextStep(),
        'Fetch finance-related Gmail signals',
        'gmail_fetch',
        'Read only email metadata relevant to billing/receipts.',
        { financeOnly: true, query: message, subtype: route.subtype },
        route.subtype === 'bills' || route.subtype === 'alerts_review',
      ));
    }

    if (planModes.includes('audit') && route.subtype === 'subscriptions') {
      steps.push(buildStep(
        nextStep(),
        'Detect recurring waste',
        'detect_leaks',
        'Detect potentially low-value recurring payments to cut.',
        { includeTrials: true, maxItems: 8 },
        false,
      ));
    }

    if (planModes.includes('compare')) {
      steps.push(buildStep(
        nextStep(),
        'Compare financial options',
        'finance_compare_options',
        'Compare user options by cost/value and select the strongest choice with assumptions.',
        {
          query: message,
          useFinanceBaseline: true,
          options: compareOptions,
          requiresUserClarification: compareOptions.length < 2,
        },
        true,
      ));
    }


    if (route.subtype === 'savings_audit' || route.subtype === 'budgeting') {
      steps.push(buildStep(
        nextStep(),
        'Build savings plan',
        'savings_plan_generator',
        'Generate a realistic monthly savings plan from available constraints and recurring costs.',
        {
          query: message,
          ...(savingsInputs || {}),
        },
        false,
      ));
    }

    if (route.subtype === 'subscriptions') {
      steps.push(buildStep(
        nextStep(),
        'Draft subscription cancellation',
        'subscription_cancel_draft',
        'Prepare ready-to-send cancellation language and checklist for a target service.',
        {
          service: cancellationService || 'subscription from recent recurring charges',
          requiresServiceDisambiguation: !cancellationService,
        },
        false,
      ));
    }

    if (route.subtype === 'cashflow' || route.subtype === 'budgeting') {
      steps.push(buildStep(
        nextStep(),
        'Summarize cashflow health',
        'cashflow_summary',
        'Summarize inflows/outflows, net pressure, and immediate actions.',
        { period: 'monthly' },
        true,
      ));
    }

    if (route.subtype === 'subscriptions' || route.subtype === 'bills' || route.subtype === 'alerts_review') {
      steps.push(buildStep(
        nextStep(),
        'Detect suspicious price changes',
        'price_change_detector',
        'Detect unusual recurring price increases and suspicious changes.',
        { sensitivity: 'standard' },
        false,
      ));
    }

    if (route.wantsRecommendations || planModes.includes('recommend') || planModes.includes('monitor')) {
      steps.push(buildStep(
        nextStep(),
        'Generate strategic recommendations',
        'generate_recommendations',
        'Rank high-impact recommendations grounded in user finance and alert evidence.',
        { limit: planModes.includes('monitor') ? 6 : 5, subtype: route.subtype, modeHints: planModes },
        false,
      ));
    }

    if (needsClarification) {
      planModes.push('clarify');
    }
    planModes.push('verify');

    return {
      intent: route.intent,
      subtype: route.subtype,
      mode: route.mode,
      planModes,
      depth,
      clarificationQuestion,
      summary: route.needsGmail
        ? `Finance ${route.subtype} workflow using finance baseline plus minimal Gmail evidence when justified.`
        : `Finance ${route.subtype} workflow using grounded baseline only. Keep toolchain minimal.`,
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
          'Read mailbox metadata needed for user request.',
          { financeOnly: false, query: message },
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
