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

  const answerDraft = [
    findings[0],
    findings[1],
    estimatedSavings > 0
      ? `Next best move: target one recurring charge this week and lock in ~${estimatedSavings.toFixed(2)}/month.`
      : 'Next best move: identify the single least-used recurring payment and cancel or downgrade it first.',
  ].join(' ');

  return {
    findings,
    answerDraft,
    shouldStore: activeSubscriptions > 0 || totalMonthlyCost > 0 || estimatedSavings > 0,
  };
}
