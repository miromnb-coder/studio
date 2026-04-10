import {
  AgentContextV8,
  AgentResponseV8,
  ExecutionPlanV8,
  ExecutionResultV8,
  RouteResultV8,
  SuggestedActionV8,
  SystemStateV8,
} from './types';

export type SynthesisInputV8 = {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
  refinedReply: string;
};

function buildSuggestedActions(route: RouteResultV8, structuredData: Record<string, unknown>): SuggestedActionV8[] {
  if (route.intent === 'finance') {
    return [
      { id: 'act_budget_review', label: 'Review recurring payments', kind: 'finance' },
      { id: 'act_cut_one', label: 'Cut one subscription', kind: 'finance' },
    ];
  }

  if (route.intent === 'gmail') {
    return [{ id: 'act_mail_triage', label: 'Triage inbox', kind: 'gmail' }];
  }

  if (route.intent === 'coding') {
    return [{ id: 'act_share_error', label: 'Share error trace', kind: 'general' }];
  }

  if (route.intent === 'productivity') {
    return [{ id: 'act_define_deadline', label: 'Set deadline', kind: 'productivity' }];
  }

  return Object.keys(structuredData).length ? [{ id: 'act_review_data', label: 'Review data', kind: 'general' }] : [];
}

export function synthesizeResponseV8(input: SynthesisInputV8): AgentResponseV8 {
  const state: SystemStateV8 = 'responding';

  return {
    reply: input.refinedReply,
    metadata: {
      intent: input.route.intent,
      mode: input.route.mode,
      plan: input.plan.summary,
      steps: input.execution.steps,
      structuredData: input.execution.structuredData,
      suggestedActions: buildSuggestedActions(input.route, input.execution.structuredData),
      memoryUsed: input.context.memory.relevantMemories.length > 0,
      verificationPassed: input.verificationPassed,
      state,
    },
  };
}
