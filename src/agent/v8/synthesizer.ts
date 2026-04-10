import { AgentContextV8, AgentResponseV8, ExecutionPlanV8, ExecutionResultV8, RouteResultV8, SuggestedActionV8 } from './types';

function buildSuggestedActions(route: RouteResultV8, structuredData: Record<string, unknown>): SuggestedActionV8[] {
  const actions: SuggestedActionV8[] = [];

  if (route.intent === 'finance') {
    actions.push({ id: 'act_cancel', label: 'Draft cancellation email', kind: 'premium', payload: { actionType: 'draft_cancellation' } });
    actions.push({ id: 'act_plan', label: 'Create savings plan', kind: 'finance', payload: { actionType: 'create_savings_plan' } });
  } else if (route.intent === 'technical') {
    actions.push({ id: 'act_patch', label: 'Generate patch checklist', kind: 'technical' });
  } else {
    actions.push({ id: 'act_next', label: 'Show next best steps', kind: 'general' });
  }

  if (structuredData.check_gmail_connection && (structuredData.check_gmail_connection as Record<string, unknown>).connected) {
    actions.push({ id: 'act_gmail', label: 'Import Gmail finance data', kind: 'finance', payload: { actionType: 'import_gmail_finance' } });
  }

  return actions;
}

function buildReply(route: RouteResultV8, execution: ExecutionResultV8, context: AgentContextV8): string {
  if (route.intent === 'finance') {
    const leakData = (execution.structuredData.detect_leaks as Record<string, unknown> | undefined) || {};
    const savings = typeof leakData.estimatedMonthlySavings === 'number' ? leakData.estimatedMonthlySavings : 0;
    return `I analyzed your finances and found savings opportunities. Estimated monthly savings is $${savings.toFixed(2)}. I also prepared a prioritized plan and next actions.`;
  }

  if (route.intent === 'technical') {
    return 'I analyzed the technical issue, identified likely root causes, and prepared a focused fix strategy with next steps.';
  }

  return `I reviewed your request with available context${context.memory.summary ? ' and memory signals' : ''}, then prepared actionable insights and next steps.`;
}

export function synthesizeResponseV8(params: {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
}): AgentResponseV8 {
  const { route, plan, execution, context, verificationPassed } = params;

  return {
    reply: buildReply(route, execution, context),
    metadata: {
      intent: route.intent,
      mode: route.mode,
      plan: plan.summary,
      steps: execution.steps,
      structuredData: execution.structuredData,
      suggestedActions: buildSuggestedActions(route, execution.structuredData),
      memoryUsed: context.memory.summary !== 'No prior context available.',
      verificationPassed,
    },
  };
}
