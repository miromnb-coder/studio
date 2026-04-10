import type { SupabaseClient } from '@supabase/supabase-js';

type AlertSeverity = 'low' | 'medium' | 'high';
type AlertStatus = 'active' | 'dismissed' | 'completed';

export type OperatorAlertType =
  | 'duplicate_subscription'
  | 'trial_ending'
  | 'price_increase'
  | 'unusual_recurring_charge'
  | 'possible_unused_subscription'
  | 'stale_gmail_sync'
  | 'savings_opportunity'
  | 'spending_concentration';

export type OperatorAlertDraft = {
  type: OperatorAlertType;
  severity: AlertSeverity;
  title: string;
  summary: string;
  suggested_action: string;
  source: string;
  dedupe_key: string;
  metadata: Record<string, unknown>;
};

export type OperatorAlertRecord = OperatorAlertDraft & {
  id: string;
  user_id: string;
  status: AlertStatus;
  created_at: string;
  updated_at: string;
};

type FinanceProfileRow = {
  user_id: string;
  active_subscriptions: Array<Record<string, unknown>> | null;
  total_monthly_cost: number | null;
  estimated_savings: number | null;
  updated_at?: string | null;
  last_analysis: Record<string, unknown> | null;
};

type FinanceHistoryRow = {
  event_type: string | null;
  title: string | null;
  summary: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type ProfileRow = {
  gmail_connected: boolean | null;
  updated_at: string | null;
};

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object') : [];
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeMonthlyAmount(sub: Record<string, unknown>): number {
  const amount =
    toNumber(sub.monthly_amount, Number.NaN) ||
    toNumber(sub.monthlyAmount, Number.NaN) ||
    toNumber(sub.amount, Number.NaN);

  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const period = String(sub.period || sub.billing_cycle || '').toLowerCase();
  if (period.includes('year') || period.includes('annual')) return safeAmount / 12;
  return safeAmount;
}

function normalizeMerchantName(sub: Record<string, unknown>): string {
  return String(sub.merchant || sub.name || sub.provider || 'Unknown').trim();
}

function nowIso() {
  return new Date().toISOString();
}

function daysBetween(fromIso: string, toIso = nowIso()): number {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Number.POSITIVE_INFINITY;
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

function safeDate(input: unknown): Date | null {
  if (typeof input !== 'string' && typeof input !== 'number') return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getSeverityFromAmount(amount: number): AlertSeverity {
  if (amount >= 50) return 'high';
  if (amount >= 20) return 'medium';
  return 'low';
}

export async function evaluateOperatorAlertsForUser(supabase: SupabaseClient, userId: string) {
  console.log('OPERATOR_ALERT_EVALUATION_START', { userId });

  const [profileRes, historyRes, profileInfoRes] = await Promise.all([
    supabase
      .from('finance_profiles')
      .select('user_id,active_subscriptions,total_monthly_cost,estimated_savings,updated_at,last_analysis')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('finance_history')
      .select('event_type,title,summary,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(80),
    supabase.from('profiles').select('gmail_connected,updated_at').eq('id', userId).maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (historyRes.error) throw historyRes.error;
  if (profileInfoRes.error) throw profileInfoRes.error;

  const financeProfile = (profileRes.data || null) as FinanceProfileRow | null;
  const financeHistory = (historyRes.data || []) as FinanceHistoryRow[];
  const profile = (profileInfoRes.data || null) as ProfileRow | null;

  console.log('OPERATOR_ALERT_SOURCE_SUMMARY', {
    userId,
    hasFinanceProfile: Boolean(financeProfile),
    subscriptions: asArray(financeProfile?.active_subscriptions).length,
    financeHistoryEvents: financeHistory.length,
    gmailConnected: Boolean(profile?.gmail_connected),
  });

  const drafts = generateOperatorAlertsFromFinanceData({
    userId,
    financeProfile,
    financeHistory,
    profile,
  });

  const persisted = await dedupeAndPersistAlerts(supabase, userId, drafts);

  console.log('OPERATOR_ALERT_EVALUATION_DONE', {
    userId,
    generated: drafts.length,
    active: persisted.filter((item) => item.status === 'active').length,
  });

  return persisted;
}

export function generateOperatorAlertsFromFinanceData(params: {
  userId: string;
  financeProfile: FinanceProfileRow | null;
  financeHistory: FinanceHistoryRow[];
  profile: ProfileRow | null;
}): OperatorAlertDraft[] {
  const { financeProfile, financeHistory, profile } = params;
  const alerts: OperatorAlertDraft[] = [];
  const subscriptions = asArray(financeProfile?.active_subscriptions);

  const normalized = subscriptions
    .map((sub) => ({
      raw: sub,
      merchant: normalizeMerchantName(sub),
      monthlyAmount: Math.round(normalizeMonthlyAmount(sub) * 100) / 100,
      status: String(sub.status || '').toLowerCase(),
      category: String(sub.category || sub.type || '').toLowerCase(),
      updatedAt: String(sub.updated_at || sub.last_seen_at || sub.last_detected_at || ''),
      usageSignal: toNumber(sub.usage_score, Number.NaN),
    }))
    .filter((sub) => sub.monthlyAmount > 0);

  const groupedByMerchant = new Map<string, typeof normalized>();
  for (const sub of normalized) {
    const key = sub.merchant.toLowerCase();
    groupedByMerchant.set(key, [...(groupedByMerchant.get(key) || []), sub]);
  }

  for (const [merchantKey, items] of groupedByMerchant.entries()) {
    if (items.length < 2) continue;
    const total = items.reduce((sum, item) => sum + item.monthlyAmount, 0);
    alerts.push({
      type: 'duplicate_subscription',
      severity: getSeverityFromAmount(total),
      title: `Possible duplicate ${items[0].merchant} subscriptions`,
      summary: `${items.length} recurring charges for ${items[0].merchant} were detected, totaling about $${total.toFixed(2)}/month.`,
      suggested_action: 'Compare plan tiers and billing owners, then cancel or merge one subscription if redundant.',
      source: 'finance_profiles.active_subscriptions',
      dedupe_key: `duplicate:${merchantKey}`,
      metadata: {
        merchant: items[0].merchant,
        count: items.length,
        monthly_total: total,
      },
    });
  }

  const lastAnalysis = asObject(financeProfile?.last_analysis);
  const gmailImport = asObject(lastAnalysis.gmail_import);
  const trialRisks = asArray(gmailImport.trial_risks);

  for (const risk of trialRisks) {
    const merchant = String(risk.merchant || risk.name || 'Unknown service');
    const endDate = safeDate(risk.trial_end_date || risk.renewal_date || risk.end_date);
    if (!endDate) continue;
    const daysLeft = Math.round((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0 || daysLeft > 10) continue;

    alerts.push({
      type: 'trial_ending',
      severity: daysLeft <= 3 ? 'high' : 'medium',
      title: `${merchant} trial ending in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
      summary: `Gmail billing signals suggest ${merchant} may auto-renew on ${endDate.toLocaleDateString()}.`,
      suggested_action: 'Review the trial now and cancel before renewal if you do not plan to keep it.',
      source: 'finance_profiles.last_analysis.gmail_import.trial_risks',
      dedupe_key: `trial:${merchant.toLowerCase()}:${endDate.toISOString().slice(0, 10)}`,
      metadata: {
        merchant,
        trial_end_date: endDate.toISOString(),
        days_left: daysLeft,
      },
    });
  }

  for (const sub of normalized) {
    const previous = toNumber(sub.raw.previous_amount, Number.NaN);
    if (!Number.isFinite(previous) || previous <= 0 || sub.monthlyAmount <= previous * 1.12) continue;

    alerts.push({
      type: 'price_increase',
      severity: sub.monthlyAmount - previous >= 15 ? 'high' : 'medium',
      title: `${sub.merchant} price increased`,
      summary: `Monthly cost appears to have increased from $${previous.toFixed(2)} to $${sub.monthlyAmount.toFixed(2)}.`,
      suggested_action: 'Check plan details and ask for retention pricing or downgrade options.',
      source: 'finance_profiles.active_subscriptions',
      dedupe_key: `price_increase:${sub.merchant.toLowerCase()}`,
      metadata: {
        merchant: sub.merchant,
        previous_amount: previous,
        current_amount: sub.monthlyAmount,
      },
    });
  }

  for (const sub of normalized) {
    const unknownMerchant = /unknown|unrecognized/.test(sub.merchant.toLowerCase());
    const anomalyScore = toNumber(sub.raw.anomaly_score, 0);
    const expected = toNumber(sub.raw.expected_amount, Number.NaN);
    const expectedDeviation = Number.isFinite(expected) && expected > 0 ? sub.monthlyAmount / expected : 1;
    if (!(unknownMerchant || anomalyScore >= 0.7 || expectedDeviation >= 1.35)) continue;

    alerts.push({
      type: 'unusual_recurring_charge',
      severity: sub.monthlyAmount >= 40 || anomalyScore >= 0.85 ? 'high' : 'medium',
      title: `Unusual recurring charge: ${sub.merchant}`,
      summary: `A recurring payment of $${sub.monthlyAmount.toFixed(2)}/month looks unusual compared with known patterns.`,
      suggested_action: 'Verify this merchant and amount in your account history; flag or cancel if unexpected.',
      source: 'finance_profiles.active_subscriptions',
      dedupe_key: `unusual:${sub.merchant.toLowerCase()}`,
      metadata: {
        merchant: sub.merchant,
        monthly_amount: sub.monthlyAmount,
        anomaly_score: anomalyScore,
        expected_amount: Number.isFinite(expected) ? expected : null,
      },
    });
  }

  for (const sub of normalized) {
    const hasLowUsageSignal = Number.isFinite(sub.usageSignal) && sub.usageSignal <= 0.35;
    const staleEvidenceDays = sub.updatedAt ? daysBetween(sub.updatedAt) : Number.POSITIVE_INFINITY;
    const explicitUnused = sub.status.includes('unused') || sub.category.includes('unused');
    if (!(explicitUnused || hasLowUsageSignal || staleEvidenceDays >= 90)) continue;

    alerts.push({
      type: 'possible_unused_subscription',
      severity: sub.monthlyAmount >= 25 ? 'medium' : 'low',
      title: `Possible unused subscription: ${sub.merchant}`,
      summary: `This subscription costs about $${sub.monthlyAmount.toFixed(2)}/month with weak recent value signals.`,
      suggested_action: 'Confirm whether you used this service recently and cancel/pause if not.',
      source: 'finance_profiles.active_subscriptions',
      dedupe_key: `unused:${sub.merchant.toLowerCase()}`,
      metadata: {
        merchant: sub.merchant,
        monthly_amount: sub.monthlyAmount,
        usage_score: Number.isFinite(sub.usageSignal) ? sub.usageSignal : null,
        stale_evidence_days: Number.isFinite(staleEvidenceDays) ? staleEvidenceDays : null,
      },
    });
  }

  const gmailConnected = Boolean(profile?.gmail_connected);
  const lastSyncedAtRaw = gmailImport.last_synced_at;
  const lastSyncedAt = safeDate(lastSyncedAtRaw);
  const staleDays = lastSyncedAt ? daysBetween(lastSyncedAt.toISOString()) : Number.POSITIVE_INFINITY;

  if (gmailConnected && (!lastSyncedAt || staleDays >= 7)) {
    alerts.push({
      type: 'stale_gmail_sync',
      severity: staleDays >= 14 ? 'high' : 'medium',
      title: 'Gmail billing sync is stale',
      summary: lastSyncedAt
        ? `Last finance sync was ${staleDays} days ago, which may hide new billing risks.`
        : 'Gmail is connected but no successful finance sync timestamp is available.',
      suggested_action: 'Run a Gmail finance sync to refresh trial, renewal, and price-change signals.',
      source: 'profiles + finance_profiles.last_analysis.gmail_import',
      dedupe_key: 'stale_gmail_sync',
      metadata: {
        gmail_connected: gmailConnected,
        last_synced_at: lastSyncedAt ? lastSyncedAt.toISOString() : null,
        stale_days: Number.isFinite(staleDays) ? staleDays : null,
      },
    });
  }

  const monthlyTotal = toNumber(financeProfile?.total_monthly_cost, 0);
  const expensiveAtRisk = alerts
    .filter((alert) => ['possible_unused_subscription', 'duplicate_subscription', 'price_increase'].includes(alert.type))
    .reduce((sum, alert) => sum + toNumber(alert.metadata.monthly_amount, toNumber(alert.metadata.monthly_total, 0)), 0);

  if (expensiveAtRisk >= 20) {
    alerts.push({
      type: 'savings_opportunity',
      severity: expensiveAtRisk >= 60 ? 'high' : 'medium',
      title: 'Meaningful monthly savings opportunity detected',
      summary: `Current alert signals indicate about $${expensiveAtRisk.toFixed(2)}/month could be recoverable with a focused review.`,
      suggested_action: 'Prioritize duplicate and low-value subscriptions first, then renegotiate increased plans.',
      source: 'operator_alert_aggregation',
      dedupe_key: 'savings_opportunity:monthly',
      metadata: {
        potential_monthly_savings: Math.round(expensiveAtRisk * 100) / 100,
        monthly_total: monthlyTotal,
      },
    });
  }

  if (normalized.length >= 2 && monthlyTotal > 0) {
    const sorted = [...normalized].sort((a, b) => b.monthlyAmount - a.monthlyAmount);
    const topThreeTotal = sorted.slice(0, 3).reduce((sum, item) => sum + item.monthlyAmount, 0);
    const concentration = topThreeTotal / monthlyTotal;

    if (concentration >= 0.6) {
      alerts.push({
        type: 'spending_concentration',
        severity: concentration >= 0.75 ? 'high' : 'medium',
        title: 'Monthly spend is concentrated in a few merchants',
        summary: `Top subscriptions account for ${(concentration * 100).toFixed(0)}% of monthly recurring spend.`,
        suggested_action: `Audit your highest-cost services first (${sorted
          .slice(0, 3)
          .map((item) => item.merchant)
          .join(', ')}).`,
        source: 'finance_profiles.active_subscriptions',
        dedupe_key: 'spend_concentration:top3',
        metadata: {
          top_three_total: Math.round(topThreeTotal * 100) / 100,
          monthly_total: monthlyTotal,
          concentration,
          top_merchants: sorted.slice(0, 3).map((item) => ({ merchant: item.merchant, amount: item.monthlyAmount })),
        },
      });
    }
  }

  const hasFinanceHistoryIn30d = financeHistory.some((row) => daysBetween(row.created_at) <= 30);
  if (!hasFinanceHistoryIn30d && gmailConnected) {
    alerts.push({
      type: 'stale_gmail_sync',
      severity: 'low',
      title: 'No recent finance activity detected',
      summary: 'Recent billing activity history is sparse, so proactive detection confidence is lower right now.',
      suggested_action: 'Sync Gmail and review recent transactions to improve operator coverage.',
      source: 'finance_history',
      dedupe_key: 'stale_gmail_sync:history_sparse',
      metadata: {
        has_finance_history_30d: false,
      },
    });
  }

  return alerts;
}

export async function dedupeAndPersistAlerts(
  supabase: SupabaseClient,
  userId: string,
  nextAlerts: OperatorAlertDraft[],
): Promise<OperatorAlertRecord[]> {
  const existingRes = await supabase
    .from('operator_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (existingRes.error) throw existingRes.error;

  const existing = (existingRes.data || []) as OperatorAlertRecord[];
  const existingByKey = new Map(existing.map((alert) => [alert.dedupe_key, alert]));
  const now = nowIso();

  for (const draft of nextAlerts) {
    const current = existingByKey.get(draft.dedupe_key);

    if (!current) {
      const insertRes = await supabase.from('operator_alerts').insert({
        user_id: userId,
        ...draft,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

      if (insertRes.error) throw insertRes.error;
      console.log('OPERATOR_ALERT_CREATED', { userId, type: draft.type, dedupeKey: draft.dedupe_key });
      continue;
    }

    const wasDismissed = current.status === 'dismissed';
    const oldEvidence = asObject(current.metadata);
    const newEvidence = asObject(draft.metadata);
    const oldAmount = toNumber(oldEvidence.monthly_amount, toNumber(oldEvidence.monthly_total, 0));
    const newAmount = toNumber(newEvidence.monthly_amount, toNumber(newEvidence.monthly_total, 0));
    const strongerEvidence = newAmount > oldAmount * 1.25 || draft.severity === 'high';

    const nextStatus: AlertStatus = wasDismissed && !strongerEvidence ? 'dismissed' : 'active';

    const updateRes = await supabase
      .from('operator_alerts')
      .update({
        type: draft.type,
        severity: draft.severity,
        title: draft.title,
        summary: draft.summary,
        suggested_action: draft.suggested_action,
        source: draft.source,
        metadata: draft.metadata,
        status: nextStatus,
        updated_at: now,
      })
      .eq('id', current.id)
      .eq('user_id', userId);

    if (updateRes.error) throw updateRes.error;
    console.log('OPERATOR_ALERT_UPDATED', {
      userId,
      id: current.id,
      dedupeKey: draft.dedupe_key,
      status: nextStatus,
      strongerEvidence,
    });
  }

  const activeKeys = new Set(nextAlerts.map((alert) => alert.dedupe_key));
  const staleActive = existing.filter((alert) => alert.status === 'active' && !activeKeys.has(alert.dedupe_key));

  if (staleActive.length > 0) {
    const staleIds = staleActive.map((alert) => alert.id);
    const staleRes = await supabase
      .from('operator_alerts')
      .update({ status: 'completed', updated_at: now })
      .eq('user_id', userId)
      .in('id', staleIds);
    if (staleRes.error) throw staleRes.error;
  }

  const finalRes = await supabase
    .from('operator_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (finalRes.error) throw finalRes.error;
  return (finalRes.data || []) as OperatorAlertRecord[];
}
