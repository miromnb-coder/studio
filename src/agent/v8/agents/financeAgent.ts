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

function safeLower(text: unknown): string {
  return String(text || '').toLowerCase();
}

function estimateConfidence(
  hasGroundedFinanceData: boolean,
  recommendations: Array<Record<string, unknown>>,
  gmailEmailsAnalyzed: number,
): 'High' | 'Medium' | 'Low' {
  if (hasGroundedFinanceData && recommendations.length >= 2 && gmailEmailsAnalyzed >= 10) return 'High';
  if (hasGroundedFinanceData) return 'Medium';
  return 'Low';
}

export async function runFinanceAgent(input: FinanceAgentInput): Promise<FinanceAgentOutput> {
  const financeData = asRecord(input.execution.structuredData.finance_read);
  const profile = asRecord(financeData.profile);
  const recurringSignals = Array.isArray(financeData.recurringSignals) ? financeData.recurringSignals : [];
  const gmailData = asRecord(input.execution.structuredData.gmail_fetch);
  const recommendations = resolveRecommendations(input).slice(0, 3);

  const compareOptionsData = asRecord(input.execution.structuredData.finance_compare_options);
  const savingsPlanData = asRecord(input.execution.structuredData.savings_plan_generator);
  const cancelDraftData = asRecord(input.execution.structuredData.subscription_cancel_draft);
  const cashflowData = asRecord(input.execution.structuredData.cashflow_summary);
  const priceChangeData = asRecord(input.execution.structuredData.price_change_detector);
  const decisionContext = input.context.decisionContext;

  const activeSubscriptionsRaw = profile.active_subscriptions;
  const activeSubscriptions = Array.isArray(activeSubscriptionsRaw)
    ? activeSubscriptionsRaw.length
    : Number(activeSubscriptionsRaw || 0);
  const totalMonthlyCost = Number(profile.total_monthly_cost || 0);
  const estimatedSavings = Number(profile.estimated_savings || 0);

  const relevantMemories = (input.context.memory.relevantMemories || []).map((item) => item.content).filter(Boolean);
  const memoryHighlights = relevantMemories.slice(0, 2);
  const memorySummary = String(input.context.memory.summary || '').trim();

  const userFocusOnSavings = [...relevantMemories, memorySummary].some((item) =>
    /\b(save|saving|budget|cut costs|subscriptions?|sääst|saast|raha|tilaus|ahorro|épargne|epargne)\b/i.test(item),
  );

  const gmailConnected = input.context.environment.gmailConnected;
  const gmailSummary = String(gmailData.summary || '').trim();
  const gmailSavingsOpportunities = Array.isArray(gmailData.savingsOpportunities)
    ? gmailData.savingsOpportunities.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const gmailTrialRisks = Array.isArray(gmailData.trialRisks)
    ? gmailData.trialRisks.map((item) => String(item || '').trim()).filter(Boolean)
    : [];
  const emailSubscriptionsFound = Number(gmailData.subscriptionsFound || 0);
  const gmailEmailsAnalyzed = Number(gmailData.emailsAnalyzed || 0);
  const gmailRecurringPaymentsFound = Number(gmailData.recurringPaymentsFound || 0);

  const toolResultKeys = Object.keys(input.execution.structuredData || {});
  const toolsUsed = input.execution.steps.filter((s) => s.status === 'completed').map((s) => s.tool);

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
      `Gmail tool result used${recurringSignals.length ? ` with ${recurringSignals.length} recurring signals` : ''}.`,
    );
  } else if (!gmailConnected) {
    findings.push('Gmail is not connected in the current environment.');
  }

  if (recommendations.length) {
    findings.push(`Generated ${recommendations.length} ranked recommendations.`);
  }

  if (cashflowData.net !== undefined) findings.push(`Cashflow net estimate: ${String(cashflowData.net)}.`);
  if (Number(priceChangeData.suspiciousCount || 0) > 0) findings.push(`Detected ${String(priceChangeData.suspiciousCount)} suspicious price changes.`);

  const message = safeLower(input.context.user.message);
  const asksTotal = /\b(total|monthly|spend|cost|amount|rahaa|kulutus|kulut|kuukaudessa|kokonais|gasto|mensual)\b/.test(message);
  const asksCount = /\b(how many|count|number of|kuinka monta|montako|määrä|maara|cuánt|cuant)\b/.test(message);
  const asksSavings = /\b(save|savings|reduce|cut|sääst|saast|säästö|saasto|halvem|ahorr|épargn|epargn)\b/.test(message);
  const asksNextAction = /\b(next|priority|what should i do|best action|deserves attention|mitä minun pitäisi tehdä|mita minun pitaisi tehda|seuraavaksi|kannattaa|que debo hacer|prochaine action)\b/.test(message);
  const asksEmailCheck = /\b(email|gmail|inbox|mail|sähköposti|sahkoposti|posti|correo|courriel)\b/.test(message);

  const topRecommendation = recommendations[0] || null;
  const topRecRecord = asRecord(topRecommendation);
  const topRecImpact = Number(asRecord(topRecRecord.estimated_impact).monthly_savings || 0);
  const topRecTitle = String(topRecRecord.title || '').trim();
  const topRecSummary = String(topRecRecord.summary || '').trim();

  const weightedSignals = [
    asksNextAction ? 'asks_next_action' : '',
    asksSavings ? 'asks_savings' : '',
    asksEmailCheck && gmailData.connected ? 'gmail_tool_available' : '',
    topRecTitle ? 'has_recommendation' : '',
    activeSubscriptions > 0 ? 'has_subscription_count' : '',
    totalMonthlyCost > 0 ? 'has_monthly_cost' : '',
    userFocusOnSavings ? 'memory_savings_preference' : '',
  ].filter(Boolean);

  const responseParts: string[] = [];
  const evidenceParts: string[] = [];

  const hasGroundedFinanceData =
    activeSubscriptions > 0 ||
    totalMonthlyCost > 0 ||
    estimatedSavings > 0 ||
    gmailEmailsAnalyzed > 0 ||
    gmailSummary.length > 0 ||
    recommendations.length > 0;

  if (!hasGroundedFinanceData) {
    responseParts.push('No grounded finance evidence yet (amounts, due dates, or recurring obligations are missing).');
  }
  if (activeSubscriptions > 0) evidenceParts.push('finance_profile.active_subscriptions');
  if (totalMonthlyCost > 0) evidenceParts.push('finance_profile.total_monthly_cost');
  if (gmailEmailsAnalyzed > 0 || gmailSummary) evidenceParts.push('gmail_fetch');
  if (recommendations.length > 0) evidenceParts.push('recommendations.top');

  const summary: string[] = [];
  if (asksCount && activeSubscriptions > 0) summary.push(`${activeSubscriptions} active subscriptions detected.`);
  if (asksTotal && totalMonthlyCost > 0) summary.push(`Recurring spend is ~${formatMoney(totalMonthlyCost)}/month.`);
  if (!summary.length && totalMonthlyCost > 0) summary.push(`Current recurring spend baseline: ${formatMoney(totalMonthlyCost)}/month.`);
  if (!summary.length && activeSubscriptions > 0) summary.push(`${activeSubscriptions} recurring services identified.`);
  if (!summary.length) summary.push('I can provide sharper estimates after fresh finance data sync.');

  let biggestOpportunity = 'Connect more transaction evidence to identify highest-impact savings.';
  if (topRecTitle) {
    biggestOpportunity = `${topRecTitle}${topRecImpact > 0 ? ` (${formatMoney(topRecImpact)}/month estimated)` : ''}.`;
  } else if (estimatedSavings > 0) {
    biggestOpportunity = `Known optimization in profile: ${formatMoney(estimatedSavings)}/month potential.`;
  }

  const actionLines: string[] = [];
  if (topRecSummary) actionLines.push(topRecSummary);
  if (gmailSavingsOpportunities[0]) actionLines.push(`Review Gmail signal: ${gmailSavingsOpportunities[0]}`);
  if (gmailTrialRisks[0]) actionLines.push(`Cancel or downgrade trial risk: ${gmailTrialRisks[0]}`);
  if (compareOptionsData.recommendation) actionLines.push(`Preferred option: ${String(asRecord(compareOptionsData.recommendation).label || 'best-ranked option')}.`);
  if (savingsPlanData.recommendedMonthlySavings) actionLines.push(`Auto-save ${formatMoney(Number(savingsPlanData.recommendedMonthlySavings))}/month based on current constraints.`);
  if (Number(priceChangeData.suspiciousCount || 0) > 0) actionLines.push(`Investigate ${String(priceChangeData.suspiciousCount)} unusual price increases.`);
  if (cancelDraftData.draft) actionLines.push('Cancellation draft is ready for immediate use.');
  if (!actionLines.length && activeSubscriptions > 0) actionLines.push(`Review your top ${Math.min(activeSubscriptions, 3)} subscriptions for low-usage services.`);
  if (!actionLines.length) actionLines.push('Sync Gmail or finance profile, then re-run savings audit.');

  const estimatedImpact = topRecImpact > 0
    ? `${formatMoney(topRecImpact)}/month (recommendation estimate)`
    : estimatedSavings > 0
      ? `${formatMoney(estimatedSavings)}/month (profile estimate)`
      : 'Unknown (insufficient grounded pricing data)';

  const confidenceLevel = estimateConfidence(hasGroundedFinanceData, recommendations, gmailEmailsAnalyzed);
  const confidenceReason = evidenceParts.length
    ? `based on ${evidenceParts.join(', ')}`
    : 'grounded evidence was limited this turn';

  const nextStep = gmailConnected
    ? 'Tell me “run a focused subscription audit” and I will rank cut candidates with expected impact.'
    : 'Connect Gmail for receipt/bill evidence, then ask me to run a savings audit.';

  const personalizationHint = decisionContext.activeGoal
    ? `Goal in focus: ${decisionContext.activeGoal}.`
    : '';
  const pressureHint = decisionContext.currentFinancialPressure !== 'unknown'
    ? `Financial pressure: ${decisionContext.currentFinancialPressure}.`
    : '';

  responseParts.push(
    [
      `Summary: ${summary.join(' ')}`,
      `Biggest Opportunity: ${biggestOpportunity}`,
      `Top Actions:`,
      ...actionLines.slice(0, 3).map((line) => `- ${line}`),
      `Estimated Monthly Impact: ${estimatedImpact}`,
      `Confidence: ${confidenceLevel} (${confidenceReason}).`,
      ...(pressureHint ? [pressureHint] : []),
      ...(personalizationHint ? [personalizationHint] : []),
      `Next Step: ${nextStep}`,
    ].join('\n'),
  );

  if (userFocusOnSavings && !asksTotal && !asksCount) {
    responseParts.push('I prioritized recurring-cost reductions because your memory profile suggests savings-first decisions.');
  }

  const answerDraft = responseParts.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();

  const memoryUsed = userFocusOnSavings || memoryHighlights.length > 0 || memorySummary.length > 0;
  const toolResultUsed = toolResultKeys.length > 0 && (gmailSummary.length > 0 || activeSubscriptions > 0 || totalMonthlyCost > 0 || toolsUsed.length > 0);
  const intelligenceUsed = recommendations.length > 0;

  console.info('CONTEXT_MEMORY_USED', {
    memoryUsed,
    highlights: memoryHighlights.length,
    summaryType: input.context.memory.summaryType,
  });
  console.info('TOOL_RESULT_USED', {
    toolResultUsed,
    keys: toolResultKeys,
    toolsUsed,
  });
  console.info('INTELLIGENCE_USED', {
    intelligenceUsed,
    recommendationCount: recommendations.length,
    operatorAlertCount: input.context.intelligence.operatorAlerts.length,
  });

  return {
    findings: [...findings, `Reasoning signals combined: ${weightedSignals.join(', ') || 'none'}.`],
    answerDraft,
    shouldStore:
      activeSubscriptions > 0 ||
      totalMonthlyCost > 0 ||
      estimatedSavings > 0 ||
      recommendations.length > 0 ||
      gmailSummary.length > 0,
  };
}
