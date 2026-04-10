import { AgentContextV8, AgentResponseV8, ExecutionPlanV8, ExecutionResultV8, RouteResultV8, SuggestedActionV8 } from './types';

function isEmailAccessQuestion(message: string): boolean {
  const text = message.toLowerCase();
  if (!text) return false;
  return /\b(email|emails|gmail|inbox|subscription emails|mailbox)\b/.test(text)
    && /\b(can|able|access|analy[sz]e|scan|read|check|look|do you)\b/.test(text);
}

function buildSuggestedActions(route: RouteResultV8, structuredData: Record<string, unknown>): SuggestedActionV8[] {
  const actions: SuggestedActionV8[] = [];

  if (route.intent === 'finance') {
    const leaks = (structuredData.detect_leaks as Record<string, unknown> | undefined) || {};
    const hasSavings = typeof leaks.estimatedMonthlySavings === 'number' && leaks.estimatedMonthlySavings > 0;
    if (hasSavings) {
      actions.push({ id: 'act_plan', label: 'Create savings plan', kind: 'finance', payload: { actionType: 'create_savings_plan' } });
      actions.push({ id: 'act_alt', label: 'Find cheaper alternatives', kind: 'finance', payload: { actionType: 'find_alternatives' } });
    }
    actions.push({ id: 'act_cancel', label: 'Draft cancellation message', kind: 'premium', payload: { actionType: 'draft_cancellation' } });
  } else if (route.intent === 'technical') {
    actions.push({ id: 'act_patch', label: 'Run fix checklist', kind: 'technical' });
  } else {
    actions.push({ id: 'act_next', label: 'Show next best step', kind: 'general' });
  }

  if (structuredData.check_gmail_connection && (structuredData.check_gmail_connection as Record<string, unknown>).connected) {
    actions.push({ id: 'act_gmail', label: 'Import Gmail finance data', kind: 'finance', payload: { actionType: 'import_gmail_finance' } });
  }

  return actions.slice(0, 3);
}

function buildReply(route: RouteResultV8, execution: ExecutionResultV8, context: AgentContextV8): string {
  if (isEmailAccessQuestion(context.user.message)) {
    if (!context.environment.gmailConnected) {
      return 'Your Gmail is not connected yet. Connect it so I can analyze your emails and find subscriptions.';
    }
    return 'Yes, I can analyze your emails. Do you want me to scan for subscriptions and recurring payments?';
  }

  if (route.intent === 'finance') {
    const leakData = (execution.structuredData.detect_leaks as Record<string, unknown> | undefined) || {};
    const savings = typeof leakData.estimatedMonthlySavings === 'number' ? leakData.estimatedMonthlySavings : 0;
    const headline = savings > 0
      ? `You can likely recover about $${savings.toFixed(2)}/month.`
      : 'I found a few targeted areas to optimize your recurring spend.';
    const next = savings > 0
      ? 'Next step: run "Create savings plan" and execute the first action today.'
      : 'Next step: review your top subscription and confirm whether it is still needed.';
    return `${headline} ${next}`;
  }

  if (route.intent === 'technical') {
    return 'Root cause is narrowed. Next step: apply the fix checklist in order and verify after each change.';
  }

  return `Here’s the fastest path: start with the highest-impact action now${context.memory.summary ? ', based on your prior context' : ''}.`;
}

export function synthesizeResponseV8(params: {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
}): AgentResponseV8 {
  const { route, execution, context, verificationPassed } = params;
  const userFacingPlan = route.intent === 'finance'
    ? 'Reviewed your finance context and prepared practical next actions.'
    : route.intent === 'technical'
      ? 'Reviewed the issue and prepared a clear fix path.'
      : 'Prepared a focused next-step response.';

  return {
    reply: buildReply(route, execution, context),
    metadata: {
      intent: route.intent,
      mode: route.mode,
      plan: userFacingPlan,
      steps: execution.steps,
      structuredData: execution.structuredData,
      suggestedActions: buildSuggestedActions(route, execution.structuredData),
      memoryUsed: context.memory.summary !== 'No prior context available.',
      verificationPassed,
    },
  };
}
