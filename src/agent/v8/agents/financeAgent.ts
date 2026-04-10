import { AgentContextV8, ExecutionResultV8, RouteResultV8 } from '../types';

export type FinanceAgentInput = {
  route: RouteResultV8;
  context: AgentContextV8;
  execution: ExecutionResultV8;
};

export type FinanceAgentOutput = {
  findings: string[];
  answerDraft: string;
  shouldStore: boolean;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function resolveRecommendations(input: FinanceAgentInput) {
  const fromTool = asRecord(input.execution.structuredData.generate_recommendations);
  if (Array.isArray(fromTool.recommendations)) return fromTool.recommendations as Array<Record<string, unknown>>;
  return input.context.intelligence.recommendations as unknown as Array<Record<string, unknown>>;
}

function formatMoney(value: number): string {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '$0.00';
}

export async function runFinanceAgent(input: FinanceAgentInput): Promise<FinanceAgentOutput> {
  const financeData = asRecord(input.execution.structuredData.finance_read);
  const profile = asRecord(financeData.profile);
  const recurringSignals = Array.isArray(financeData.recurringSignals) ? financeData.recurringSignals : [];
  const gmailData = asRecord(input.execution.structuredData.gmail_fetch);

  const activeSubscriptions = Number(profile.active_subscriptions || 0);
  const totalMonthlyCost = Number(profile.total_monthly_cost || 0);
  const estimatedSavings = Number(profile.estimated_savings || 0);
  const recommendations = resolveRecommendations(input).slice(0, 3);

  const findings = [
    activeSubscriptions > 0
      ? `Detected ${activeSubscriptions} active subscriptions.`
      : 'No active subscription count available yet.',
    totalMonthlyCost > 0
      ? `Current recurring monthly spend is about ${totalMonthlyCost.toFixed(2)}.`
      : 'Recurring monthly spend was not found in profile.',
    estimatedSavings > 0
      ? `Known savings opportunity is ${estimatedSavings.toFixed(2)} per month.`
      : 'No validated savings estimate found yet.',
  ];

  if (gmailData.connected) {
    findings.push(
      `Gmail was used for this request${recurringSignals.length ? ` and surfaced ${recurringSignals.length} recurring signals` : ''}.`,
    );
  }

  if (recommendations.length) {
    findings.push(`Generated ${recommendations.length} ranked recommendations.`);
  }

  const message = input.context.user.message.toLowerCase();
  const asksTotal = /\b(total|monthly|spend|cost)\b/.test(message);
  const asksCount = /\b(how many|count|number of)\b/.test(message);
  const asksSavings = /\b(save|savings|reduce|cut)\b/.test(message);
  const asksNextAction = /\b(next|priority|what should i do|best action|deserves attention)\b/.test(message);

  let answerDraft = '';
  if (asksNextAction && recommendations.length) {
    const [first] = recommendations;
    const topImpact = asRecord(first.estimated_impact);
    const monthlySavings = Number(topImpact.monthly_savings || 0);
    const actions = Array.isArray(first.suggested_actions) ? first.suggested_actions.slice(0, 2).join(' ') : '';
    answerDraft = `${first.title}. ${first.summary} ${monthlySavings > 0 ? `Estimated impact: ${formatMoney(monthlySavings)}/month.` : ''} ${actions}`.trim();
  } else if (asksCount && activeSubscriptions > 0) {
    answerDraft = `You currently have ${activeSubscriptions} active subscriptions.`;
  } else if (asksTotal && totalMonthlyCost > 0) {
    answerDraft = `Your recurring monthly spend is about ${formatMoney(totalMonthlyCost)}.`;
  } else if (asksSavings && recommendations.length) {
    const savingsCandidates = recommendations
      .map((item) => Number(asRecord(item.estimated_impact).monthly_savings || 0))
      .filter((value) => value > 0);
    const topSavings = Math.max(...savingsCandidates, estimatedSavings, 0);
    answerDraft = topSavings > 0
      ? `A realistic first savings target is about ${formatMoney(topSavings)}/month by addressing your highest-priority recommendation.`
      : 'I found savings opportunities, but none have a reliable numeric estimate yet.';
  } else if (activeSubscriptions > 0 || totalMonthlyCost > 0) {
    answerDraft = `You have ${activeSubscriptions || 'an unknown number of'} subscriptions with about ${formatMoney(totalMonthlyCost)} in monthly recurring spend.`;
  } else {
    answerDraft = 'I do not have enough finance data yet to answer precisely. Ask me to analyze subscriptions or monthly recurring spend.';
  }

  if (recommendations.length && !asksNextAction) {
    const next = recommendations[0];
    answerDraft += ` Next best action: ${next.title}.`;
  }

  return {
    findings,
    answerDraft,
    shouldStore: activeSubscriptions > 0 || totalMonthlyCost > 0 || estimatedSavings > 0 || recommendations.length > 0,
  };
}
