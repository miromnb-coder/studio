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
        'Compare options',
        'find_alternatives',
        'Compare user options by estimated cost and value using available evidence.',
        { query: message, useFinanceBaseline: true },
        true,
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

    return {
      intent: route.intent,
      subtype: route.subtype,
      mode: route.mode,
      planModes,
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
      planModes: ['act'],
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
    planModes: [],
    summary: 'Direct response path. No tools required.',
    steps: [],
  };
}
