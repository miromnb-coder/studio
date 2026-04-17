import type { InboxSummaryResult, SubscriptionScannerResult, UrgentEmailResult, WeeklyDigestResult } from './types';

export function buildWeeklyDigest(params: {
  inboxSummary: InboxSummaryResult;
  urgent: UrgentEmailResult;
  subscriptions: SubscriptionScannerResult;
}): WeeklyDigestResult {
  const { inboxSummary, urgent, subscriptions } = params;

  const importantHighlights = inboxSummary.importantEmails
    .slice(0, 5)
    .map((email) => `${email.subject || email.from} (${Math.round(email.urgencyScore * 100)} urgency)`);

  const moneyRisks = [
    subscriptions.trialEndingCount ? `${subscriptions.trialEndingCount} trial(s) ending soon` : null,
    subscriptions.priceIncreaseCount ? `${subscriptions.priceIncreaseCount} possible price increase(s)` : null,
    subscriptions.duplicateCount ? `${subscriptions.duplicateCount} possible duplicate service(s)` : null,
  ].filter((item): item is string => Boolean(item));

  const subscriptionsFound = subscriptions.opportunities.slice(0, 6).map((item) => `${item.merchant} (${item.status.replace('_', ' ')})`);

  const cleanupActions = [
    ...inboxSummary.recommendedActions.slice(0, 3),
    ...subscriptions.cancellationOpportunities.slice(0, 2),
  ].slice(0, 5);

  const nextWeekWatchouts = urgent.priorityList
    .slice(0, 4)
    .map((item) => `${item.subject || item.from} — watch date-sensitive follow-up`);

  return {
    generatedAt: new Date().toISOString(),
    title: 'Weekly Email Operator Digest',
    importantHighlights,
    moneyRisks,
    subscriptionsFound,
    cleanupActions,
    nextWeekWatchouts,
    conciseSummary: `This week: ${urgent.totalUrgent} urgent items, ${subscriptions.activeCount} recurring services, and up to ${subscriptions.currency} ${subscriptions.estimatedMonthlySavings.toFixed(2)}/month in potential savings.`,
  };
}
