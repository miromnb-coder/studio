import { AgentContextV8, ToolResultV8 } from '../types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAmountFromText(text: string): number {
  const match = text.match(/\$?\s?(\d[\d,.]*)/);
  return asNumber(match?.[1] || 0);
}

function normalizeEvents(context: AgentContextV8): Array<Record<string, unknown>> {
  return Array.isArray(context.memory.financeEvents)
    ? context.memory.financeEvents.filter((event): event is Record<string, unknown> => !!event && typeof event === 'object').slice(0, 40)
    : [];
}

function extractRecurringCharges(context: AgentContextV8): Array<{ name: string; amount: number; category: string }> {
  const profile = asRecord(context.memory.financeProfile);
  const profileSubscriptions = Array.isArray(profile.subscriptions) ? profile.subscriptions : [];
  const fromProfile = profileSubscriptions
    .map((item) => asRecord(item))
    .map((item) => ({
      name: String(item.name || item.service || 'Unknown subscription').trim(),
      amount: asNumber(item.monthly_cost ?? item.amount ?? item.price),
      category: String(item.category || 'subscription').trim(),
    }))
    .filter((item) => item.amount > 0);

  const fromEvents = normalizeEvents(context)
    .map((event) => ({
      name: String(event.merchant || event.name || event.description || 'Unknown charge').trim(),
      amount: Math.abs(asNumber(event.amount)),
      category: String(event.category || event.eventType || 'recurring').toLowerCase(),
      recurring: Boolean(event.recurring) || /subscription|recurring|bill/.test(String(event.eventType || '').toLowerCase()),
    }))
    .filter((item) => item.amount > 0 && item.recurring)
    .map((item) => ({ name: item.name, amount: item.amount, category: item.category }));

  return [...fromProfile, ...fromEvents].slice(0, 20);
}

export async function financeCompareOptionsTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const rawOptions = Array.isArray(input.options) ? input.options : [];
  const query = String(input.query || context.user.message || '').trim();
  const fallbackFromQuery = rawOptions.length
    ? []
    : (() => {
      const pair = query.match(/([^?.,\n]+?)\s+(?:vs|versus)\s+([^?.,\n]+)/i);
      if (!pair) return [];
      return [pair[1], pair[2]].map((segment, index) => ({
        id: `option_${index + 1}`,
        label: segment.replace(/\$?\s?\d[\d,.]*/g, '').trim() || `Option ${index + 1}`,
        monthlyCost: asNumber((segment.match(/(\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))/i) || [])[1]) || parseAmountFromText(segment),
        annualCost: asNumber((segment.match(/(\d[\d,.]*)\s*(?:\/?\s?(?:year|yr|annual|yearly))/i) || [])[1]),
        switchingCost: 0,
        valueScore: 5,
      }));
    })();
  const options = rawOptions
    .concat(fallbackFromQuery)
    .map((item) => asRecord(item))
    .map((item, index) => {
      const monthlyCost = asNumber(item.monthlyCost ?? item.monthly_cost ?? item.cost ?? item.price);
      const annualCost = asNumber(item.annualCost ?? item.annual_cost);
      const valueScore = asNumber(item.valueScore ?? item.value_score ?? item.value) || 5;
      const switchingCost = asNumber(item.switchingCost ?? item.switching_cost);
      const effectiveAnnualCost = (annualCost > 0 ? annualCost : monthlyCost * 12) + switchingCost;
      const score = valueScore > 0 ? effectiveAnnualCost / valueScore : effectiveAnnualCost;

      return {
        id: String(item.id || `option_${index + 1}`),
        label: String(item.label || item.name || `Option ${index + 1}`),
        monthlyCost,
        annualCost: annualCost > 0 ? annualCost : monthlyCost * 12,
        valueScore,
        switchingCost,
        effectiveAnnualCost,
        valueToCostScore: Number.isFinite(score) ? Number(score.toFixed(2)) : 9999,
      };
    })
    .filter((option) => option.monthlyCost > 0 || option.annualCost > 0);

  if (options.length < 2) {
    return {
      ok: false,
      tool: 'finance_compare_options',
      output: {
        compared: 0,
        recommendation: null,
        clarificationQuestion: 'Please share the two options and at least one price (monthly or annual) for each.',
      },
      error: 'Need at least two options with cost inputs to compare.',
    };
  }

  const ranked = [...options].sort((a, b) => a.valueToCostScore - b.valueToCostScore);
  const winner = ranked[0];

  return {
    ok: true,
    tool: 'finance_compare_options',
    output: {
      compared: ranked.length,
      ranked,
      recommendation: {
        id: winner.id,
        label: winner.label,
        reason: `${winner.label} has the strongest value-to-cost ratio based on provided assumptions.`,
      },
      assumptions: ['Costs and value scores were taken from user-provided option data.'],
      clarificationQuestion: null,
    },
  };
}

export async function savingsPlanGeneratorTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const profile = asRecord(context.memory.financeProfile);
  const monthlyIncome = asNumber(input.monthlyIncome ?? input.monthly_income ?? profile.monthly_income);
  const monthlyExpenses = asNumber(input.monthlyExpenses ?? input.monthly_expenses ?? profile.monthly_expenses ?? profile.total_monthly_cost);
  const targetAmount = asNumber(input.targetAmount ?? input.target_amount);
  const deadlineMonths = Math.max(1, Math.floor(asNumber((input.deadlineMonths ?? input.deadline_months) || 6)));
  const desiredMonthlySavings = targetAmount > 0 ? targetAmount / deadlineMonths : asNumber(input.desiredMonthlySavings ?? input.desired_monthly_savings);

  const recurringCharges = extractRecurringCharges(context);
  const baselineRecurring = recurringCharges.reduce((sum, item) => sum + item.amount, 0);
  const availableCapacity = Math.max(0, monthlyIncome - monthlyExpenses);
  const fallbackStarterSavings = monthlyIncome > 0
    ? monthlyIncome * 0.1
    : baselineRecurring > 0
      ? baselineRecurring * 0.15
      : 100;
  const feasibleMonthlySavings = Math.max(0, Math.min(desiredMonthlySavings || availableCapacity * 0.6 || fallbackStarterSavings, availableCapacity || fallbackStarterSavings));

  const topCuts = recurringCharges
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map((item) => ({ action: `Review ${item.name}`, estimatedMonthlyImpact: Number((item.amount * 0.35).toFixed(2)) }));

  return {
    ok: true,
    tool: 'savings_plan_generator',
    output: {
      targetAmount,
      deadlineMonths,
      baselineRecurring: Number(baselineRecurring.toFixed(2)),
      availableCapacity: Number(availableCapacity.toFixed(2)),
      recommendedMonthlySavings: Number(feasibleMonthlySavings.toFixed(2)),
      projectedTargetDateMonths: feasibleMonthlySavings > 0 && targetAmount > 0
        ? Math.ceil(targetAmount / feasibleMonthlySavings)
        : null,
      plan: [
        { step: 'Set an automatic transfer on payday', monthlyAmount: Number((feasibleMonthlySavings * 0.7).toFixed(2)) },
        { step: 'Apply recurring-cost reductions', monthlyAmount: Number((feasibleMonthlySavings * 0.3).toFixed(2)) },
      ],
      topCuts,
      constraintsUsed: context.decisionContext.knownConstraints,
      assumptions: [
        monthlyIncome > 0 ? 'Monthly income provided or inferred from profile.' : 'Monthly income missing; starter plan uses conservative defaults.',
        monthlyExpenses > 0 ? 'Monthly expenses provided or inferred from profile.' : 'Monthly expenses missing; recurring-charge baseline used for starter plan.',
      ],
    },
  };
}

export async function subscriptionCancelDraftTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const explicitService = String(input.service || input.subscription || '').trim();
  const recurringCandidatesRaw = Array.isArray(input.recurringCandidates) ? input.recurringCandidates : [];
  const recurringCandidates = recurringCandidatesRaw
    .map((item) => asRecord(item))
    .map((item) => String(item.name || item.service || '').trim())
    .filter(Boolean);
  const message = String(context.user.message || '').trim();
  const mentionedService = message.match(/\b(cancel|stop|end|unsubscribe)\b(?:\s+my|\s+the)?\s+([a-z0-9][a-z0-9+ .&-]{1,40})/i)?.[2]?.trim();
  const inferredService = mentionedService || recurringCandidates[0] || explicitService || 'the subscription';
  const service = inferredService.replace(/\b(subscription|plan|membership)\b/gi, '').trim();
  const reason = String(input.reason || 'I no longer use this service enough to justify the cost.').trim();
  const needsClarification = !mentionedService && recurringCandidates.length > 1 && !explicitService;

  const draft = [
    'Subject: Cancellation request',
    '',
    `Hello ${service} Support,`,
    '',
    `Please cancel my ${service} subscription effective immediately and confirm that no further charges will be made.`,
    `Reason: ${reason}`,
    '',
    'If cancellation must be completed through a portal, please send the exact steps.',
    '',
    'Thank you.',
  ].join('\n');

  return {
    ok: true,
    tool: 'subscription_cancel_draft',
    output: {
      service,
      draft,
      clarificationQuestion: needsClarification
        ? `I found multiple candidates (${recurringCandidates.slice(0, 3).join(', ')}). Which one should I cancel first?`
        : null,
      checklist: [
        'Take a screenshot of cancellation confirmation.',
        'Remove stored payment method if no longer needed.',
        'Check statement in 30 days for any residual charge.',
        'Set a calendar reminder 3 days before the next billing date to confirm cancellation was applied.',
      ],
    },
  };
}

export async function cashflowSummaryTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const events = normalizeEvents(context);
  const inflows = events.filter((event) => asNumber(event.amount) > 0);
  const outflows = events.filter((event) => asNumber(event.amount) < 0);

  const monthlyIn = inflows.reduce((sum, event) => sum + asNumber(event.amount), 0);
  const monthlyOut = Math.abs(outflows.reduce((sum, event) => sum + asNumber(event.amount), 0));
  const net = monthlyIn - monthlyOut;

  const pressure: 'low' | 'medium' | 'high' = net >= 400 ? 'low' : net >= 0 ? 'medium' : 'high';
  const topOutflows = outflows
    .map((event) => ({
      name: String(event.merchant || event.name || event.description || 'Unknown'),
      amount: Math.abs(asNumber(event.amount)),
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  return {
    ok: true,
    tool: 'cashflow_summary',
    output: {
      incoming: Number(monthlyIn.toFixed(2)),
      outgoing: Number(monthlyOut.toFixed(2)),
      net: Number(net.toFixed(2)),
      pressureLevel: pressure,
      pressurePoints: topOutflows,
      recommendation: net < 0
        ? 'Prioritize cancelling or downgrading the largest recurring outflow this week.'
        : 'Preserve positive net flow with an automatic transfer to savings.',
    },
  };
}

export async function priceChangeDetectorTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const events = normalizeEvents(context);
  const grouped = new Map<string, number[]>();

  for (const event of events) {
    const key = String(event.merchant || event.name || event.description || '').trim();
    const amount = Math.abs(asNumber(event.amount));
    if (!key || amount <= 0) continue;
    const list = grouped.get(key) || [];
    list.push(amount);
    grouped.set(key, list);
  }

  const changes = Array.from(grouped.entries())
    .map(([merchant, amounts]) => {
      if (amounts.length < 2) return null;
      const sorted = [...amounts].sort((a, b) => a - b);
      const previous = sorted[0];
      const latest = sorted[sorted.length - 1];
      const pctChange = previous > 0 ? ((latest - previous) / previous) * 100 : 0;
      return {
        merchant,
        previous: Number(previous.toFixed(2)),
        latest: Number(latest.toFixed(2)),
        pctChange: Number(pctChange.toFixed(1)),
        suspicious: pctChange >= 15,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((a, b) => b.pctChange - a.pctChange);

  const suspicious = changes.filter((item) => item.suspicious).slice(0, 5);

  return {
    ok: true,
    tool: 'price_change_detector',
    output: {
      analyzedMerchants: grouped.size,
      suspiciousCount: suspicious.length,
      suspicious,
      allChanges: changes.slice(0, 10),
    },
  };
}
