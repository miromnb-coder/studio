import {
  AgentContextV8,
  AgentResponseV8,
  ExecutionPlanV8,
  ExecutionResultV8,
  RouteResultV8,
  SuggestedActionV8,
  SystemStateV8,
  CriticResultV8,
} from './types';

export type SynthesisInputV8 = {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
  refinedReply: string;
  critic: CriticResultV8;
};

function buildSuggestedActions(input: SynthesisInputV8): SuggestedActionV8[] {
  const { route, execution, context } = input;
  if (route.intent === 'finance') {
    const recommendations = context.intelligence.recommendations.slice(0, 2);
    if (recommendations.length > 0) {
      return recommendations.map((rec) => ({
        id: `rec_${rec.id}`,
        label: rec.title,
        kind: 'finance',
        payload: { recommendationId: rec.id, priority: rec.priority, type: rec.type },
      }));
    }

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

  return Object.keys(execution.structuredData).length ? [{ id: 'act_review_data', label: 'Review data', kind: 'general' }] : [];
}

export function synthesizeResponseV8(input: SynthesisInputV8): AgentResponseV8 {
  const state: SystemStateV8 = 'responding';
  const finalReply = input.refinedReply.trim() || 'I need one concrete detail to answer this correctly.';

  return {
    reply: finalReply,
    metadata: {
      intent: input.route.intent,
      subtype: input.route.subtype,
      mode: input.route.mode,
      plan: input.plan.summary,
      planModes: input.plan.planModes,
      steps: input.execution.steps,
      structuredData: {
        ...input.execution.structuredData,
        ...(input.context.intelligence.recommendations.length
          ? { recommendations: input.context.intelligence.recommendations }
          : {}),
        ...(input.context.intelligence.userProfile
          ? { user_profile_intelligence: input.context.intelligence.userProfile }
          : {}),
      },
      suggestedActions: buildSuggestedActions(input),
      memoryUsed: input.context.memory.relevantMemories.length > 0,
      verificationPassed: input.verificationPassed,
      critic: {
        criticScore: input.critic.criticScore,
        passed: input.critic.passed,
        needsRewrite: input.critic.needsRewrite,
        qualityNotes: input.critic.qualityNotes,
      },
      state,
    },
  };
}
