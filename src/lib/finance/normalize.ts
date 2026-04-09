import { FinanceActionResult, FinanceActionType, FinanceAnalysis, FinanceConfidence, FinanceLeak, FinanceLeakAction, FinanceLeakPeriod, FinanceLeakType, FinanceUrgency } from './types';

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toStringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

function normalizeLeak(item: unknown, defaultCurrency: string | null): FinanceLeak | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  const merchant = toStringOrNull(raw.merchant) || 'Unknown merchant';

  return {
    merchant,
    amount: toNumberOrNull(raw.amount),
    currency: toStringOrNull(raw.currency) || defaultCurrency,
    period: toEnum<FinanceLeakPeriod>(raw.period, ['monthly', 'yearly', 'one-time', 'unknown'], 'unknown'),
    type: toEnum<FinanceLeakType>(raw.type, ['subscription', 'duplicate', 'fee', 'trial', 'price_increase', 'waste', 'unknown'], 'unknown'),
    reason: toStringOrNull(raw.reason) || 'Potential leak detected from spending pattern.',
    action: toEnum<FinanceLeakAction>(raw.action, ['cancel', 'review', 'downgrade', 'consolidate', 'monitor'], 'review'),
    urgency: toEnum<FinanceUrgency>(raw.urgency, ['low', 'medium', 'high'], 'medium'),
  };
}

export function normalizeFinanceAnalysis(structuredData: Record<string, unknown> | undefined): FinanceAnalysis {
  const detectLeaks = structuredData?.detect_leaks && typeof structuredData.detect_leaks === 'object'
    ? (structuredData.detect_leaks as Record<string, unknown>)
    : {};

  const analysis = structuredData?.analyze && typeof structuredData.analyze === 'object'
    ? (structuredData.analyze as Record<string, unknown>)
    : {};

  const currency = toStringOrNull(detectLeaks.currency) || 'USD';
  const leaksRaw = Array.isArray(detectLeaks.leaks) ? detectLeaks.leaks : [];
  const leaks = leaksRaw
    .map((item) => normalizeLeak(item, currency))
    .filter((item): item is FinanceLeak => !!item);

  const recommendationsFromTool = Array.isArray(detectLeaks.recommendations)
    ? detectLeaks.recommendations.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

  const notes = toStringOrNull(detectLeaks.notes);
  const insights = toStringOrNull(analysis.insights);

  const recommendations = recommendationsFromTool.length > 0
    ? recommendationsFromTool
    : [
        ...(notes ? [notes] : []),
        ...(insights ? [insights] : []),
        ...(leaks.length > 0 ? ['Start with high-urgency leaks and verify merchant contracts before cancelling.'] : []),
      ].slice(0, 4);

  return {
    estimatedMonthlySavings: toNumberOrNull(detectLeaks.estimatedMonthlySavings),
    currency,
    confidence: toEnum<FinanceConfidence>(detectLeaks.confidence, ['low', 'medium', 'high'], leaks.length > 0 ? 'medium' : 'low'),
    leaks,
    recommendations,
  };
}

function monthlyEquivalent(amount: number | null, period: string): number {
  if (!amount) return 0;
  if (period === 'yearly') return amount / 12;
  if (period === 'monthly') return amount;
  return 0;
}

export function runFinanceAction(actionType: FinanceActionType, finance: FinanceAnalysis): FinanceActionResult {
  try {
    const topLeak = [...finance.leaks]
      .sort((a, b) => monthlyEquivalent(b.amount, b.period) - monthlyEquivalent(a.amount, a.period))[0];

    if (actionType === 'create_savings_plan') {
      const total = finance.estimatedMonthlySavings ?? finance.leaks.reduce((sum, leak) => sum + monthlyEquivalent(leak.amount, leak.period), 0);
      return {
        type: 'savings_plan',
        title: '30-day savings plan',
        summary: `Potential monthly savings of ${Math.round(total)} ${finance.currency || 'USD'} if top leaks are addressed in order.`,
        data: {
          goalMonthlySavings: total,
          milestones: [
            'Week 1: cancel or downgrade highest-cost subscriptions.',
            'Week 2: review duplicate services and consolidate.',
            'Week 3: negotiate or switch high-fee providers.',
            'Week 4: monitor bank activity and lock in budget guardrails.',
          ],
          priorityMerchants: finance.leaks.slice(0, 5).map((leak) => leak.merchant),
        },
      };
    }

    if (actionType === 'find_alternatives') {
      return {
        type: 'alternatives',
        title: 'Lower-cost alternatives',
        summary: topLeak
          ? `Focus first on replacing ${topLeak.merchant} with lower-cost options.`
          : 'We identified generic lower-cost optimization options.',
        data: {
          targetMerchant: topLeak?.merchant || null,
          strategies: [
            'Check annual billing discounts (10-30% typical savings).',
            'Bundle overlapping services into one provider.',
            'Use free tier or family/shared plans for low-usage tools.',
          ],
        },
      };
    }

    return {
      type: 'cancellation_draft',
      title: 'Cancellation draft ready',
      summary: 'Prepared a cancellation draft you can send to support.',
      data: {
        merchant: topLeak?.merchant || 'service provider',
        draft: `Hello, I want to cancel my subscription effective immediately and stop future charges. Please confirm cancellation and final billing status in writing.`,
      },
    };
  } catch (error) {
    console.error('FINANCE_ACTION_ERROR', error);
    return {
      type: 'error',
      title: 'Partial result',
      summary: 'We couldn’t complete everything, but here’s what we found.',
      data: {},
    };
  }
}

export function safeFinanceActionFallback(): FinanceActionResult {
  return {
    type: 'error',
    title: 'Partial result',
    summary: 'We couldn’t complete everything, but here’s what we found.',
    data: {},
  };
}
