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

export async function runFinanceAgent(input: FinanceAgentInput): Promise<FinanceAgentOutput> {
  const financeData = asRecord(input.execution.structuredData.finance_read);
  const profile = asRecord(financeData.profile);
  const recurringSignals = Array.isArray(financeData.recurringSignals) ? financeData.recurringSignals : [];
  const gmailData = asRecord(input.execution.structuredData.gmail_fetch);

  const activeSubscriptions = Number(profile.active_subscriptions || 0);
  const totalMonthlyCost = Number(profile.total_monthly_cost || 0);
  const estimatedSavings = Number(profile.estimated_savings || 0);

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

  const message = input.context.user.message.toLowerCase();
  const asksTotal = /\b(total|monthly|spend|cost)\b/.test(message);
  const asksCount = /\b(how many|count|number of)\b/.test(message);
  const asksSavings = /\b(save|savings|reduce|cut)\b/.test(message);

  let answerDraft = '';
  if (asksCount && activeSubscriptions > 0) {
    answerDraft = `You currently have ${activeSubscriptions} active subscriptions.`;
  } else if (asksTotal && totalMonthlyCost > 0) {
    answerDraft = `Your recurring monthly spend is about ${totalMonthlyCost.toFixed(2)}.`;
  } else if (asksSavings && estimatedSavings > 0) {
    answerDraft = `You can likely save about ${estimatedSavings.toFixed(2)} per month by removing one low-value recurring charge first.`;
  } else if (activeSubscriptions > 0 || totalMonthlyCost > 0) {
    answerDraft = `You have ${activeSubscriptions || 'an unknown number of'} subscriptions with about ${totalMonthlyCost.toFixed(2)} in monthly recurring spend.`;
  } else {
    answerDraft = 'I do not have enough finance data yet to answer precisely. Ask me to analyze subscriptions or monthly recurring spend.';
  }

  if (estimatedSavings > 0 && !asksSavings) {
    answerDraft += ` A realistic first savings target is ${estimatedSavings.toFixed(2)} per month.`;
  }

  return {
    findings,
    answerDraft,
    shouldStore: activeSubscriptions > 0 || totalMonthlyCost > 0 || estimatedSavings > 0,
  };
}
