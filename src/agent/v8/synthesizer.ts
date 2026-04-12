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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function buildSuggestedActions(input: SynthesisInputV8): SuggestedActionV8[] {
  const { route, execution, context } = input;

  if (route.intent === 'finance') {
    const recommendations = context.intelligence.recommendations.slice(0, 3);
    if (recommendations.length > 0) {
      return recommendations.map((rec, idx) => ({
        id: `rec_${rec.id}`,
        label: idx === 0 ? `Do now: ${rec.title}` : rec.title,
        kind: 'finance',
        payload: {
          recommendationId: rec.id,
          priority: rec.priority,
          type: rec.type,
          confidence: rec.confidence,
        },
      }));
    }

    const gmailFetch = asRecord(execution.structuredData.gmail_fetch);
    const hasNoSignals = Number(gmailFetch.emailsAnalyzed || 0) > 0
      && Number(gmailFetch.subscriptionsFound || 0) === 0
      && Number(gmailFetch.recurringPaymentsFound || 0) === 0;

    if (hasNoSignals) {
      return [
        { id: 'act_expand_scan', label: 'Expand scan to 90 days', kind: 'finance' },
        { id: 'act_add_keywords', label: 'Add receipt keywords', kind: 'finance' },
      ];
    }

    return [
      { id: 'act_pick_expense', label: 'Pick one expense to optimize', kind: 'finance' },
      { id: 'act_build_7day', label: 'Build 7-day action plan', kind: 'finance' },
    ];
  }

  if (route.intent === 'gmail') return [{ id: 'act_mail_triage', label: 'Triage inbox', kind: 'gmail' }];
  if (route.intent === 'coding') return [{ id: 'act_share_error', label: 'Share failing trace', kind: 'general' }];
  if (route.intent === 'productivity') return [{ id: 'act_define_deadline', label: 'Set one deadline', kind: 'productivity' }];

  return Object.keys(execution.structuredData).length > 0
    ? [{ id: 'act_review_data', label: 'Review extracted data', kind: 'general' }]
    : [];
}

function buildOperatorModules(input: SynthesisInputV8): OperatorModuleV8[] {
  if (input.route.intent !== 'finance') return [];
  const recommendations = input.context.intelligence.recommendations;
  const alerts = input.context.intelligence.operatorAlerts;
  if (!recommendations.length && !alerts.length) return [];

  const modules: OperatorModuleV8[] = [];
  const top = recommendations[0];
  const second = recommendations[1];
  const risk = recommendations.find((item) => item.type === 'anomaly_review' || item.priority === 'critical');

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

  if (second) {
    modules.push({
      id: `module-week-${second.id}`,
      title: 'Recommended This Week',
      summary: second.title,
      impactLabel: second.estimated_impact.monthly_savings ? `~$${second.estimated_impact.monthly_savings.toFixed(0)}/mo` : undefined,
      recommendationId: second.id,
      priority: second.priority,
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

  return modules.slice(0, 5);
}

function extractConfidence(reply: string): string {
  const match = reply.match(/confidence:\s*([^\n.]+)/i);
  return (match?.[1] || 'Medium').trim();
}

function extractAssumptions(reply: string): string {
  const match = reply.match(/assumptions:\s*([^\n]+)/i);
  return (match?.[1] || 'Some financial assumptions were required due to partial data.').trim();
}

function extractNextStep(reply: string): string {
  const match = reply.match(/next step:\s*([^\n]+)/i);
  return (match?.[1] || 'Confirm the top action to proceed.').trim();
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
        synthesized: {
          answer: finalReply,
          topActions: finalReply
            .split('\n')
            .filter((line) => /^-\s*\d+\./.test(line) || /^-\s/.test(line))
            .slice(0, 3),
          nextStep: extractNextStep(finalReply),
          confidence: extractConfidence(finalReply),
          assumptions: extractAssumptions(finalReply),
          suggestedModules: buildOperatorModules(input).map((item) => item.title),
          metadata: {
            routeConfidence: input.route.confidence,
            routeAmbiguity: input.route.ambiguity,
            responseLanguage: input.route.responseLanguage,
            inputLanguage: input.route.inputLanguage,
            criticScore: input.critic.criticScore,
            verificationPassed: input.verificationPassed,
            memoryUsed: input.context.memory.relevantMemories.length > 0,
            partialSuccess: input.execution.partialSuccess,
          },
        },
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
