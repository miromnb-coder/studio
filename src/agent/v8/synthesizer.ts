import {
  AgentContextV8,
  AgentResponseV8,
  ExecutionPlanV8,
  ExecutionResultV8,
  OperatorModuleV8,
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

    const financeRead = (execution.structuredData.finance_read || {}) as Record<string, unknown>;
    const profile = (financeRead.profile || {}) as Record<string, unknown>;
    const hasRecurringBaseline = Number(profile.active_subscriptions || 0) > 0 || Number(profile.total_monthly_cost || 0) > 0;
    const gmailFetch = (execution.structuredData.gmail_fetch || {}) as Record<string, unknown>;
    const hasGmailData = Number(gmailFetch.emailsAnalyzed || 0) > 0;
    const noGmailFinanceSignals = hasGmailData
      && Number(gmailFetch.subscriptionsFound || 0) === 0
      && Number(gmailFetch.recurringPaymentsFound || 0) === 0;

    if (noGmailFinanceSignals) {
      return [
        { id: 'act_widen_email_window', label: 'Expand email scan (90d)', kind: 'finance' },
        { id: 'act_scan_receipt_keywords', label: 'Include receipt keywords', kind: 'finance' },
      ];
    }
    if (hasRecurringBaseline) {
      return [
        { id: 'act_rank_cancellations', label: 'Rank cancellation targets', kind: 'finance' },
        { id: 'act_review_recurring', label: 'Review recurring charges', kind: 'finance' },
      ];
    }

    return [
      { id: 'act_share_expense', label: 'Share one monthly expense', kind: 'finance' },
      { id: 'act_start_savings_plan', label: 'Build quick savings plan', kind: 'finance' },
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

function buildOperatorModules(input: SynthesisInputV8): OperatorModuleV8[] {
  if (input.route.intent !== 'finance') return [];
  const recommendations = input.context.intelligence.recommendations;
  const alerts = input.context.intelligence.operatorAlerts;
  if (!recommendations.length && !alerts.length) return [];

  const top = recommendations[0];
  const fastestSaving = recommendations
    .filter((item) => (item.estimated_impact.monthly_savings || 0) > 0)
    .sort((a, b) => (b.estimated_impact.monthly_savings || 0) - (a.estimated_impact.monthly_savings || 0))[0];
  const risk = recommendations.find((item) => item.type === 'anomaly_review') || recommendations.find((item) => item.priority === 'critical');

  const modules: OperatorModuleV8[] = [];
  if (top) {
    modules.push({
      id: `module-next-${top.id}`,
      title: 'Best Next Action',
      summary: top.title,
      impactLabel: top.estimated_impact.monthly_savings ? `~$${top.estimated_impact.monthly_savings.toFixed(0)}/mo` : undefined,
      recommendationId: top.id,
      priority: top.priority,
    });
  }
  if (fastestSaving) {
    modules.push({
      id: `module-saving-${fastestSaving.id}`,
      title: 'Fastest Saving Opportunity',
      summary: fastestSaving.summary,
      impactLabel: `~$${(fastestSaving.estimated_impact.monthly_savings || 0).toFixed(0)}/mo`,
      recommendationId: fastestSaving.id,
      priority: fastestSaving.priority,
    });
  }
  if (risk) {
    modules.push({
      id: `module-risk-${risk.id}`,
      title: 'Risk To Watch',
      summary: risk.summary,
      recommendationId: risk.id,
      priority: risk.priority,
    });
  } else if (alerts[0]) {
    modules.push({
      id: `module-risk-alert-${alerts[0].id}`,
      title: 'Risk To Watch',
      summary: alerts[0].summary,
      priority: alerts[0].severity === 'high' ? 'critical' : alerts[0].severity,
    });
  }
  if (top?.suggested_actions?.[0]) {
    modules.push({
      id: `module-input-${top.id}`,
      title: 'What I Need From You',
      summary: top.suggested_actions[0],
      recommendationId: top.id,
      priority: top.priority,
    });
  }
  if (recommendations.length > 1) {
    modules.push({
      id: `module-week-${recommendations[1].id}`,
      title: 'Recommended This Week',
      summary: recommendations[1].title,
      impactLabel: recommendations[1].estimated_impact.monthly_savings
        ? `~$${recommendations[1].estimated_impact.monthly_savings.toFixed(0)}/mo`
        : undefined,
      recommendationId: recommendations[1].id,
      priority: recommendations[1].priority,
    });
  }
  return modules.slice(0, 5);
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
      responseMode: input.route.responseMode,
      goal: input.route.goal,
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
      operatorModules: buildOperatorModules(input),
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
