import { ExecutionPlanV8, PlanStepV8, RouteResultV8 } from './types';

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
  if (route.intent === 'finance' && route.needsFinanceData) {
    const steps: PlanStepV8[] = [
      buildStep(
        '1',
        'Read finance baseline',
        'finance_read',
        'Load finance profile and recurring costs needed for a grounded answer.',
        { scope: 'subscriptions' },
        true,
      ),
    ];

    if (route.needsGmail) {
      steps.push(buildStep(
        '2',
        'Fetch finance-related Gmail signals',
        'gmail_fetch',
        'Read only email metadata relevant to billing/receipts.',
        { financeOnly: true, query: message },
        false,
      ));
    }

    if (route.wantsRecommendations) {
      steps.push(buildStep(
        route.needsGmail ? '3' : '2',
        'Generate strategic recommendations',
        'generate_recommendations',
        'Rank high-impact recommendations grounded in user finance and alert evidence.',
        { limit: 5 },
        false,
      ));
    }

    return {
      intent: route.intent,
      mode: route.mode,
      summary: route.needsGmail
        ? 'Use finance data and only the minimum Gmail metadata needed for the user request.'
        : 'Use finance data only. Do not add unrelated tools.',
      steps,
    };
  }

  if (route.intent === 'gmail') {
    return {
      intent: route.intent,
      mode: route.mode,
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
    mode: route.mode,
    summary: 'Direct response path. No tools required.',
    steps: [],
  };
}
