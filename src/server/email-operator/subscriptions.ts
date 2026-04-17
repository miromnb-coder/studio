import type { FinancialSubscriptionSignal, GmailFinanceAnalysis, ParsedFinancialEmail } from '@/lib/integrations/gmail';
import type { EmailOperatorPreferences, SubscriptionOpportunity, SubscriptionScannerResult } from './types';

function monthlyAmount(signal: FinancialSubscriptionSignal): number {
  if (!signal.amount || !Number.isFinite(signal.amount)) return 0;
  if (signal.period === 'yearly') return signal.amount / 12;
  return signal.amount;
}

function normalizeMerchant(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function detectStatus(signal: FinancialSubscriptionSignal, emails: ParsedFinancialEmail[]): SubscriptionOpportunity['status'] {
  const matchingText = emails
    .filter((email) => {
      const body = `${email.sender} ${email.subject} ${email.snippet}`.toLowerCase();
      return body.includes(signal.merchant.toLowerCase());
    })
    .map((email) => `${email.subject} ${email.snippet}`.toLowerCase())
    .join(' ');

  if (/trial ending|trial ends|free trial ending/.test(matchingText)) return 'trial';
  if (/renews|renewal|auto-renew/.test(matchingText)) return 'renewal_due';
  if (/price increase|new price|rate change|cost increase/.test(matchingText)) return 'price_increase';
  return 'active';
}

export function buildSubscriptionScannerResult(params: {
  analysis: GmailFinanceAnalysis;
  emails: ParsedFinancialEmail[];
  existingSubscriptions?: Array<Record<string, unknown>>;
  preferences: EmailOperatorPreferences;
}): SubscriptionScannerResult {
  const { analysis, emails, preferences, existingSubscriptions } = params;

  const opportunities: SubscriptionOpportunity[] = [...analysis.subscriptions, ...analysis.recurringPayments].map((signal) => {
    const status = detectStatus(signal, emails);
    return {
      merchant: signal.merchant,
      amount: signal.amount,
      currency: signal.currency || 'USD',
      period: signal.period,
      status,
      confidence: signal.confidence,
      note:
        status === 'trial'
          ? 'Trial appears to be ending soon.'
          : status === 'renewal_due'
            ? 'Renewal language detected.'
            : status === 'price_increase'
              ? 'Possible recent price increase detected.'
              : 'Recurring charge appears active.',
    };
  });

  const byMerchant = new Map<string, SubscriptionOpportunity[]>();
  opportunities.forEach((item) => {
    const key = normalizeMerchant(item.merchant);
    const current = byMerchant.get(key) || [];
    current.push(item);
    byMerchant.set(key, current);
  });

  let duplicateCount = 0;
  for (const group of byMerchant.values()) {
    if (group.length > 1) {
      duplicateCount += 1;
      group.forEach((item) => {
        item.status = item.status === 'active' ? 'duplicate' : item.status;
        item.note = item.status === 'duplicate' ? 'Possible duplicate service or overlapping plan.' : item.note;
      });
    }
  }

  const trialEndingCount = opportunities.filter((item) => item.status === 'trial').length;
  const renewalCount = opportunities.filter((item) => item.status === 'renewal_due').length;
  const priceIncreaseCount = opportunities.filter((item) => item.status === 'price_increase').length;

  const estimatedMonthlySavings =
    Math.round(
      opportunities
        .filter((item) => item.status === 'duplicate' || item.status === 'trial' || item.status === 'price_increase')
        .reduce((sum, item) => sum + monthlyAmount({
          merchant: item.merchant,
          amount: item.amount,
          currency: item.currency,
          period: item.period,
          category: 'subscription',
          confidence: item.confidence,
        }), 0) * 0.6 * 100,
    ) / 100;

  const cancellationOpportunities = opportunities
    .filter((item) => item.status === 'duplicate' || item.status === 'trial' || item.status === 'price_increase')
    .map((item) => `Review ${item.merchant} (${item.status.replace('_', ' ')})`)
    .slice(0, preferences.concise ? 3 : 6);

  const currency = opportunities.find((item) => item.currency)?.currency || 'USD';
  const activeCount = Math.max(opportunities.length, Array.isArray(existingSubscriptions) ? existingSubscriptions.length : 0);

  return {
    generatedAt: new Date().toISOString(),
    activeCount,
    duplicateCount,
    trialEndingCount,
    renewalCount,
    priceIncreaseCount,
    cancellationOpportunities,
    estimatedMonthlySavings,
    currency,
    opportunities: opportunities.slice(0, 16),
    summary:
      analysis.summary ||
      `Detected ${opportunities.length} recurring services with potential savings of ${currency} ${estimatedMonthlySavings.toFixed(2)}/month.`,
  };
}
