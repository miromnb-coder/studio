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

export async function runFinanceAgent(input: FinanceAgentInput): Promise<FinanceAgentOutput> {
  const financeData = asRecord(input.execution.structuredData.finance_read);
  const profile = asRecord(financeData.profile);
  const recurringSignals = Array.isArray(financeData.recurringSignals) ? financeData.recurringSignals : [];
  const gmailData = asRecord(input.execution.structuredData.gmail_fetch);
  const recommendations = resolveRecommendations(input).slice(0, 3);

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

  if (userFocusOnSavings) {
    responseParts.push('Since your memory profile indicates you prefer saving money, prioritize actions that reduce recurring costs first.');
  } else if (memoryHighlights.length) {
    responseParts.push(`From your memory context: ${memoryHighlights[0]}.`);
  }

  if (asksCount && activeSubscriptions > 0) {
    responseParts.push(`You currently have ${activeSubscriptions} active subscriptions.`);
    evidenceParts.push('finance_profile.active_subscriptions');
  }
  if (asksTotal && totalMonthlyCost > 0) {
    responseParts.push(`Your recurring monthly spend is about ${formatMoney(totalMonthlyCost)}.`);
    evidenceParts.push('finance_profile.total_monthly_cost');
  }

  if ((asksSavings || asksNextAction || responseParts.length === 0) && topRecTitle) {
    responseParts.push(
      `${topRecTitle}${topRecSummary ? ` — ${topRecSummary}` : ''}${topRecImpact > 0 ? ` Estimated impact: ${formatMoney(topRecImpact)}/month.` : '.'}`,
    );
    evidenceParts.push('recommendations.top');
  }

  if (asksEmailCheck || asksSavings || asksNextAction) {
    if (gmailData.connected) {
      const emailInsight = emailSubscriptionsFound > 0 || gmailRecurringPaymentsFound > 0
        ? `Gmail tool found ${emailSubscriptionsFound} subscription and ${gmailRecurringPaymentsFound} recurring payment signals from ${gmailEmailsAnalyzed} analyzed emails.`
        : `Gmail tool executed${gmailEmailsAnalyzed > 0 ? ` on ${gmailEmailsAnalyzed} emails` : ''}, but returned no strong finance signal.`;
      responseParts.push(emailInsight);
      evidenceParts.push('gmail_fetch');

      if (gmailSummary) responseParts.push(`Email summary: ${gmailSummary}`);
      if (gmailSavingsOpportunities[0]) responseParts.push(`Top Gmail savings opportunity: ${gmailSavingsOpportunities[0]}.`);
      if (gmailTrialRisks[0]) responseParts.push(`Trial risk to review: ${gmailTrialRisks[0]}.`);
    } else if (gmailConnected) {
      responseParts.push('Gmail is connected, but no gmail_fetch data was returned for this turn, so I cannot make email-grounded claims yet.');
    } else {
      responseParts.push('Gmail is not connected in your current environment, so recommendations are based on available finance memory and profile data.');
    }
  }

  const hasGroundedFinanceData =
    activeSubscriptions > 0 ||
    totalMonthlyCost > 0 ||
    estimatedSavings > 0 ||
    gmailEmailsAnalyzed > 0 ||
    gmailSummary.length > 0 ||
    recommendations.length > 0;

  if (!hasGroundedFinanceData) {
    responseParts.length = 0;
    responseParts.push(
      'I do not currently have grounded finance evidence for invoices, amounts, due dates, or obligations.',
      'If you want, I can re-run analysis after fresh Gmail import or updated finance profile data.',
    );
  }

  if (!responseParts.length) {
    responseParts.push('I do not have enough finance data yet to answer precisely. Ask me to analyze subscriptions or monthly recurring spend.');
  }

  if (evidenceParts.length) {
    responseParts.push(`Confidence: medium, based on ${evidenceParts.join(', ')}.`);
  } else {
    responseParts.push('Confidence: low, because grounded data was limited this turn.');
  }

  const answerDraft = responseParts.join(' ').replace(/\s{2,}/g, ' ').trim();

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
