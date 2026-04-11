import { AgentContextV8, ExecutionPlanV8, ExecutionResultV8, RouteResultV8 } from '../types';

export type FinanceAgentInput = {
  route: RouteResultV8;
  context: AgentContextV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
};

export type FinanceAgentOutput = {
  findings: string[];
  answerDraft: string;
  shouldStore: boolean;
};

type ActionCandidate = {
  title: string;
  rationale: string;
  impact: number;
  urgency: number;
  ease: number;
  confidence: number;
  category: 'savings' | 'risk' | 'decision' | 'execution';
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    : [];
}

function toNum(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function formatMoney(value: number): string {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '$0.00';
}

function scoreAction(item: ActionCandidate): number {
  return item.impact * 0.42 + item.urgency * 0.28 + item.ease * 0.18 + item.confidence * 0.12;
}

function estimateConfidence(args: {
  groundedSignals: number;
  recommendations: number;
  toolsCompleted: number;
  assumptions: number;
}): 'High' | 'Medium' | 'Low' {
  const base = args.groundedSignals * 0.18 + args.recommendations * 0.12 + args.toolsCompleted * 0.08 - args.assumptions * 0.1;
  if (base >= 1.2) return 'High';
  if (base >= 0.65) return 'Medium';
  return 'Low';
}

function resolveRecommendations(input: FinanceAgentInput): Array<Record<string, unknown>> {
  const fromTool = asRecord(input.execution.structuredData.generate_recommendations);
  if (Array.isArray(fromTool.recommendations)) return fromTool.recommendations as Array<Record<string, unknown>>;
  return input.context.intelligence.recommendations as unknown as Array<Record<string, unknown>>;
}

function chooseMode(input: FinanceAgentInput): 'analyst' | 'operator' | 'coach' | 'researcher' {
  if (input.route.responseMode === 'coach' || input.route.goal.emotionalTone === 'overwhelmed') return 'coach';
  if (input.route.responseMode === 'operator') return 'operator';
  if (input.route.subtype === 'compare_options') return 'researcher';
  return 'analyst';
}

function buildNoResultsRecovery(gmailSignals: { connected: boolean; analyzed: number; found: number }): string[] {
  if (!gmailSignals.connected || gmailSignals.analyzed === 0 || gmailSignals.found > 0) return [];
  return [
    'Likely issue: scan window is too short for monthly/quarterly billing cycles.',
    'Likely issue: merchants use parent-company domains, so simple keyword matches miss them.',
    'Recovery: run a 90-day scan with invoice/order/payment/renewal terms and merchant aliases.',
  ];
}

export async function runFinanceAgent(input: FinanceAgentInput): Promise<FinanceAgentOutput> {
  const financeRead = asRecord(input.execution.structuredData.finance_read);
  const profile = asRecord(financeRead.profile);
  const gmailFetch = asRecord(input.execution.structuredData.gmail_fetch);
  const compareData = asRecord(input.execution.structuredData.finance_compare_options);
  const savingsPlan = asRecord(input.execution.structuredData.savings_plan_generator);
  const cashflow = asRecord(input.execution.structuredData.cashflow_summary);
  const cancelDraft = asRecord(input.execution.structuredData.subscription_cancel_draft);
  const priceChange = asRecord(input.execution.structuredData.price_change_detector);

  const recommendations = resolveRecommendations(input).slice(0, 4);
  const mode = chooseMode(input);

  const activeSubscriptions = Array.isArray(profile.active_subscriptions)
    ? profile.active_subscriptions.length
    : toNum(profile.active_subscriptions, 0);
  const totalMonthly = toNum(profile.total_monthly_cost, 0);
  const estimatedSavings = toNum(profile.estimated_savings, 0);
  const monthlyIncome = toNum(profile.monthly_income, 0);
  const monthlyNet = toNum(cashflow.net, monthlyIncome > 0 ? monthlyIncome - totalMonthly : 0);

  const gmailConnected = input.context.environment.gmailConnected || Boolean(gmailFetch.connected);
  const emailsAnalyzed = toNum(gmailFetch.emailsAnalyzed, 0);
  const recurringFound = toNum(gmailFetch.recurringPaymentsFound, 0);
  const subscriptionsFound = toNum(gmailFetch.subscriptionsFound, 0);
  const savingsOps = (gmailFetch.savingsOpportunities as unknown[] || []).map((x) => String(x || '')).filter(Boolean);
  const trialRisks = (gmailFetch.trialRisks as unknown[] || []).map((x) => String(x || '')).filter(Boolean);

  const userProfile = input.context.intelligence.userProfile;
  const decision = input.context.decisionContext;
  const relevantMemories = input.context.memory.relevantMemories.map((item) => item.content).filter(Boolean);
  const acceptedIds = new Set(decision.successfulRecommendationIds);
  const ignoredIds = new Set(decision.deprioritizedRecommendationIds);

  const actionCandidates: ActionCandidate[] = [];

  for (const rec of recommendations) {
    const recObj = asRecord(rec);
    const recId = String(recObj.id || '');
    const impact = toNum(asRecord(recObj.estimated_impact).monthly_savings, 20);
    const priority = String(recObj.priority || 'medium');
    const urgency = priority === 'critical' ? 1 : priority === 'high' ? 0.85 : priority === 'medium' ? 0.6 : 0.4;
    const learningBoost = acceptedIds.has(recId) ? 0.12 : ignoredIds.has(recId) ? -0.18 : 0;

    actionCandidates.push({
      title: String(recObj.title || 'Recommendation'),
      rationale: String(recObj.summary || recObj.reasoning || 'Prioritized from current financial signals.'),
      impact: Math.min(1, Math.max(0.2, impact / 120)),
      urgency,
      ease: /cancel|downgrade|switch|pause/i.test(String(recObj.title || '')) ? 0.78 : 0.55,
      confidence: Math.max(0.4, Math.min(0.95, toNum(recObj.confidence, 0.66) + learningBoost)),
      category: /risk|anomaly|price/i.test(String(recObj.type || '')) ? 'risk' : 'savings',
    });
  }

  if (trialRisks[0]) {
    actionCandidates.push({
      title: 'Stop imminent trial renewals first',
      rationale: `Detected trial risk: ${trialRisks[0]}.`,
      impact: 0.58,
      urgency: 0.92,
      ease: 0.86,
      confidence: 0.74,
      category: 'risk',
    });
  }

  if (subscriptionsFound > 0 || activeSubscriptions > 0) {
    actionCandidates.push({
      title: 'Rank cancellation targets by savings-per-minute',
      rationale: `You have ${Math.max(subscriptionsFound, activeSubscriptions)} recurring services that can be prioritized quickly.`,
      impact: 0.71,
      urgency: 0.66,
      ease: 0.67,
      confidence: 0.75,
      category: 'execution',
    });
  }

  if (toNum(compareData.netDifference, 0) !== 0 || compareData.recommendation) {
    const recommendation = asRecord(compareData.recommendation);
    actionCandidates.push({
      title: `Choose: ${String(recommendation.label || 'best-value option')}`,
      rationale: String(compareData.summary || 'Comparison shows a measurable cost/value gap.'),
      impact: 0.62,
      urgency: 0.58,
      ease: 0.72,
      confidence: 0.7,
      category: 'decision',
    });
  }

  if (toNum(savingsPlan.recommendedMonthlySavings, 0) > 0) {
    const amount = toNum(savingsPlan.recommendedMonthlySavings, 0);
    actionCandidates.push({
      title: `Automate ${formatMoney(amount)}/month as a default transfer`,
      rationale: 'Automation removes willpower friction and compounds quickly.',
      impact: Math.min(1, Math.max(0.4, amount / 300)),
      urgency: 0.72,
      ease: 0.8,
      confidence: 0.78,
      category: 'savings',
    });
  }

  if (!actionCandidates.length) {
    actionCandidates.push({
      title: 'Create a 7-day cash leak audit',
      rationale: 'No strong structured signals available, so start with fast evidence gathering and one immediate cut.',
      impact: 0.48,
      urgency: 0.62,
      ease: 0.72,
      confidence: 0.56,
      category: 'execution',
    });
  }

  const personalizedEaseShift = userProfile?.decision_style === 'aggressive' ? 0.06 : userProfile?.decision_style === 'conservative' ? -0.05 : 0;
  const stressedPenalty = input.route.goal.emotionalTone === 'overwhelmed' ? -0.08 : 0;

  const rankedActions = actionCandidates
    .map((candidate) => ({
      ...candidate,
      ease: Math.max(0.2, Math.min(1, candidate.ease + personalizedEaseShift + stressedPenalty)),
      rankScore: scoreAction(candidate),
    }))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 3);

  const highestImpact = rankedActions[0];
  const fastestWin = [...rankedActions].sort((a, b) => b.ease - a.ease)[0];
  const biggestRisk = rankedActions.find((a) => a.category === 'risk')
    || (toNum(priceChange.suspiciousCount, 0) > 0
      ? {
        title: `Review ${toNum(priceChange.suspiciousCount, 0)} suspicious price changes`,
        rationale: 'Silent price drift compounds quickly if ignored.',
      }
      : null);

  const noResultsRecovery = buildNoResultsRecovery({
    connected: gmailConnected,
    analyzed: emailsAnalyzed,
    found: subscriptionsFound + recurringFound + savingsOps.length,
  });

  const groundedSignals = [
    activeSubscriptions > 0,
    totalMonthly > 0,
    estimatedSavings > 0,
    emailsAnalyzed > 0,
    recommendations.length > 0,
    monthlyNet !== 0,
  ].filter(Boolean).length;

  const assumptions: string[] = [];
  if (totalMonthly <= 0) assumptions.push('Recurring spend baseline is incomplete.');
  if (monthlyIncome <= 0 && String(input.route.subtype) !== 'subscriptions') assumptions.push('Monthly income is unknown, so affordability is inferred.');
  if (!recommendations.length) assumptions.push('Recommendation engine returned no ranked candidates this turn.');

  const confidence = estimateConfidence({
    groundedSignals,
    recommendations: recommendations.length,
    toolsCompleted: input.execution.steps.filter((s) => s.status === 'completed').length,
    assumptions: assumptions.length,
  });

  const moduleHints = [
    highestImpact?.category === 'decision' ? 'comparison' : '',
    highestImpact?.category === 'risk' ? 'alerts' : '',
    totalMonthly > 0 || activeSubscriptions > 0 ? 'subscription_audit' : '',
    toNum(savingsPlan.recommendedMonthlySavings, 0) > 0 ? 'savings_plan' : '',
  ].filter(Boolean);

  const calmLead = input.route.goal.emotionalTone === 'overwhelmed'
    ? 'You are not failing; we will reduce load and move one step at a time.'
    : input.route.goal.emotionalTone === 'stressed'
      ? 'Let’s remove pressure first, then optimize.'
      : '';

  const summary = [
    totalMonthly > 0 ? `Recurring baseline is ${formatMoney(totalMonthly)}/month.` : 'Recurring baseline is not fully available yet.',
    activeSubscriptions > 0 ? `${activeSubscriptions} active subscriptions detected.` : 'Subscription count is not fully verified.',
    monthlyNet !== 0 ? `Estimated monthly net: ${formatMoney(monthlyNet)}.` : '',
  ].filter(Boolean).join(' ');

  const nextStep = mode === 'operator'
    ? `Reply "execute: ${highestImpact.title}" and I will generate a checklist or ready-to-send message.`
    : `Reply "do action 1" and I will turn the top move into a concrete 7-day plan.`;

  const answerDraft = [
    calmLead,
    `Summary: ${summary}`,
    `Operator Read: Goal = ${input.route.goal.inferredGoal}`,
    `Top Priority: ${highestImpact.title} — ${highestImpact.rationale}`,
    `Fastest Win: ${fastestWin.title}.`,
    biggestRisk ? `Biggest Risk: ${biggestRisk.title}.` : '',
    'Ranked Actions:',
    ...rankedActions.map((item, index) => `- ${index + 1}. ${item.title} (${item.rationale})`),
    noResultsRecovery.length ? `Recovery Plan: ${noResultsRecovery.join(' ')}` : '',
    cancelDraft.draft ? `Execution Asset: Cancellation draft is ready for ${String(cancelDraft.service || 'the selected service')}.` : '',
    `Confidence: ${confidence}.`,
    assumptions.length ? `Assumptions: ${assumptions.join(' ')}` : 'Assumptions: Minimal assumptions; most guidance is grounded in available signals.',
    `Suggested Modules: ${moduleHints.join(', ') || 'subscription_audit, savings_plan'}.`,
    relevantMemories[0] ? `Personalization Signal: ${relevantMemories[0]}` : '',
    decision.activeGoal ? `Active Goal in Memory: ${decision.activeGoal}` : '',
    `Next Step: ${nextStep}`,
  ].filter(Boolean).join('\n');

  return {
    findings: [
      `Mode selected: ${mode}`,
      `Grounded signals: ${groundedSignals}`,
      `Recommendations considered: ${recommendations.length}`,
      `Memory-sensitive ranking applied: ${acceptedIds.size > 0 || ignoredIds.size > 0}`,
      `Top action score: ${highestImpact ? scoreAction(highestImpact as ActionCandidate).toFixed(2) : 'n/a'}`,
    ],
    answerDraft,
    shouldStore: groundedSignals > 1 || rankedActions.length > 0,
  };
}
