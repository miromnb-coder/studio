import {
  AgentContextV8,
  AgentResponseV8,
  CriticResultV8,
  ExecutionPlanV8,
  ExecutionResultV8,
  OperatorModuleV8,
  RouteResultV8,
  SuggestedActionV8,
  SystemStateV8,
} from './types';

export type SynthesisInputV8 = {
  route: RouteResultV8;
  plan: ExecutionPlanV8;
  execution: ExecutionResultV8;
  context: AgentContextV8;
  verificationPassed: boolean;
  refinedReply: string;
  critic: CriticResultV8;
};

type LocalizedCopy = {
  defaultReply: string;
  defaultAssumptions: string;
  defaultNextStep: string;
  bestNextAction: string;
  recommendedThisWeek: string;
  riskToWatch: string;
  whatINeedFromYou: string;
  doNow: string;
  expandScan: string;
  addKeywords: string;
  pickExpense: string;
  build7Day: string;
  triageInbox: string;
  shareTrace: string;
  setDeadline: string;
  reviewData: string;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function detectLanguage(route: RouteResultV8): string {
  const lang = (route.responseLanguage || route.inputLanguage || 'en').toLowerCase();
  if (lang.startsWith('fi')) return 'fi';
  if (lang.startsWith('sv')) return 'sv';
  return 'en';
}

function getCopy(language: string): LocalizedCopy {
  if (language === 'fi') {
    return {
      defaultReply: 'Tarvitsen yhden konkreettisen tiedon, jotta voin vastata tähän oikein.',
      defaultAssumptions: 'Joitakin oletuksia jouduttiin tekemään, koska data oli osittainen.',
      defaultNextStep: 'Vahvista tärkein seuraava askel, niin jatketaan.',
      bestNextAction: 'Paras seuraava askel',
      recommendedThisWeek: 'Suositus tälle viikolle',
      riskToWatch: 'Riski jota seurata',
      whatINeedFromYou: 'Mitä tarvitsen sinulta',
      doNow: 'Tee nyt',
      expandScan: 'Laajenna haku 90 päivään',
      addKeywords: 'Lisää kuittiavainsanoja',
      pickExpense: 'Valitse yksi kulu optimoitavaksi',
      build7Day: 'Rakenna 7 päivän suunnitelma',
      triageInbox: 'Järjestä sähköposti',
      shareTrace: 'Jaa virhepolku',
      setDeadline: 'Aseta yksi deadline',
      reviewData: 'Tarkista poimittu data',
    };
  }

  if (language === 'sv') {
    return {
      defaultReply: 'Jag behöver en konkret detalj för att kunna svara rätt på detta.',
      defaultAssumptions: 'Vissa antaganden behövdes eftersom datan var ofullständig.',
      defaultNextStep: 'Bekräfta bästa nästa steg så fortsätter vi.',
      bestNextAction: 'Bästa nästa steg',
      recommendedThisWeek: 'Rekommenderas denna vecka',
      riskToWatch: 'Risk att bevaka',
      whatINeedFromYou: 'Det jag behöver från dig',
      doNow: 'Gör nu',
      expandScan: 'Utöka sökningen till 90 dagar',
      addKeywords: 'Lägg till kvittonyckelord',
      pickExpense: 'Välj en kostnad att optimera',
      build7Day: 'Bygg en 7-dagarsplan',
      triageInbox: 'Sortera inkorgen',
      shareTrace: 'Dela felspåret',
      setDeadline: 'Sätt en deadline',
      reviewData: 'Granska extraherad data',
    };
  }

  return {
    defaultReply: 'I need one concrete detail to answer this correctly.',
    defaultAssumptions: 'Some assumptions were required because the data was partial.',
    defaultNextStep: 'Confirm the best next step to continue.',
    bestNextAction: 'Best Next Action',
    recommendedThisWeek: 'Recommended This Week',
    riskToWatch: 'Risk To Watch',
    whatINeedFromYou: 'What I Need From You',
    doNow: 'Do now',
    expandScan: 'Expand scan to 90 days',
    addKeywords: 'Add receipt keywords',
    pickExpense: 'Pick one expense to optimize',
    build7Day: 'Build 7-day action plan',
    triageInbox: 'Triage inbox',
    shareTrace: 'Share failing trace',
    setDeadline: 'Set one deadline',
    reviewData: 'Review extracted data',
  };
}

function normalizeLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

function extractBullets(reply: string): string[] {
  return reply
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean)
    .filter((line) => /^-\s*(\d+\.)?/.test(line))
    .map((line) => line.replace(/^-\s*/, '').trim())
    .slice(0, 3);
}

function extractSectionValue(reply: string, labels: string[]): string | null {
  const lines = reply.split('\n');

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lower = line.toLowerCase();

    const matched = labels.find((label) => lower.startsWith(label));
    if (!matched) continue;

    const inline = line.slice(matched.length).replace(/^[:\-\s]+/, '').trim();
    if (inline) return inline;

    const next = lines.slice(i + 1).map(normalizeLine).find(Boolean);
    if (next) return next;
  }

  return null;
}

function extractConfidence(reply: string, language: string): string {
  const labels =
    language === 'fi'
      ? ['confidence', 'varmuus', 'varmuustaso']
      : language === 'sv'
        ? ['confidence', 'säkerhet']
        : ['confidence'];

  return (
    extractSectionValue(reply, labels.map((label) => `${label}:`)) ||
    extractSectionValue(reply, labels) ||
    'Medium'
  );
}

function extractAssumptions(reply: string, language: string, fallback: string): string {
  const labels =
    language === 'fi'
      ? ['assumptions:', 'oletukset:']
      : language === 'sv'
        ? ['assumptions:', 'antaganden:']
        : ['assumptions:'];

  return extractSectionValue(reply, labels) || fallback;
}

function extractNextStep(reply: string, language: string, fallback: string): string {
  const labels =
    language === 'fi'
      ? ['next step:', 'seuraava askel:', 'selkeä seuraava siirto:']
      : language === 'sv'
        ? ['next step:', 'nästa steg:', 'tydligt nästa steg:']
        : ['next step:'];

  return extractSectionValue(reply, labels) || fallback;
}

function formatImpactLabel(monthlySavings: unknown, language: string): string | undefined {
  const value = asNumber(monthlySavings, 0);
  if (value <= 0) return undefined;

  if (language === 'fi') return `~$${value.toFixed(0)}/kk`;
  if (language === 'sv') return `~$${value.toFixed(0)}/mån`;
  return `~$${value.toFixed(0)}/mo`;
}

function buildSuggestedActions(input: SynthesisInputV8, language: string): SuggestedActionV8[] {
  const { route, execution, context } = input;
  const copy = getCopy(language);

  if (route.intent === 'finance') {
    const recommendations = context.intelligence.recommendations.slice(0, 3);

    if (recommendations.length > 0) {
      return recommendations.map((rec, idx) => ({
        id: `rec_${rec.id}`,
        label: idx === 0 ? `${copy.doNow}: ${rec.title}` : rec.title,
        kind: 'finance',
        payload: {
          recommendationId: rec.id,
          priority: rec.priority,
          type: rec.type,
          confidence: rec.confidence,
        },
      }));
    }

    const gmailFetch = asRecord(execution.structuredData.gmail_fetch);
    const hasNoSignals =
      asNumber(gmailFetch.emailsAnalyzed) > 0 &&
      asNumber(gmailFetch.subscriptionsFound) === 0 &&
      asNumber(gmailFetch.recurringPaymentsFound) === 0;

    if (hasNoSignals) {
      return [
        { id: 'act_expand_scan', label: copy.expandScan, kind: 'finance' },
        { id: 'act_add_keywords', label: copy.addKeywords, kind: 'finance' },
      ];
    }

    return [
      { id: 'act_pick_expense', label: copy.pickExpense, kind: 'finance' },
      { id: 'act_build_7day', label: copy.build7Day, kind: 'finance' },
    ];
  }

  if (route.intent === 'gmail') {
    return [{ id: 'act_mail_triage', label: copy.triageInbox, kind: 'gmail' }];
  }

  if (route.intent === 'coding') {
    return [{ id: 'act_share_error', label: copy.shareTrace, kind: 'general' }];
  }

  if (route.intent === 'productivity') {
    return [{ id: 'act_define_deadline', label: copy.setDeadline, kind: 'productivity' }];
  }

  return Object.keys(execution.structuredData).length > 0
    ? [{ id: 'act_review_data', label: copy.reviewData, kind: 'general' }]
    : [];
}

function buildOperatorModules(input: SynthesisInputV8, language: string): OperatorModuleV8[] {
  if (input.route.intent !== 'finance') return [];

  const copy = getCopy(language);
  const recommendations = input.context.intelligence.recommendations;
  const alerts = input.context.intelligence.operatorAlerts;

  if (!recommendations.length && !alerts.length) return [];

  const modules: OperatorModuleV8[] = [];
  const top = recommendations[0];
  const second = recommendations[1];
  const risk = recommendations.find(
    (item) => item.type === 'anomaly_review' || item.priority === 'critical',
  );

  if (top) {
    modules.push({
      id: `module-next-${top.id}`,
      title: copy.bestNextAction,
      summary: top.title,
      impactLabel: formatImpactLabel(top.estimated_impact.monthly_savings, language),
      recommendationId: top.id,
      priority: top.priority,
    });
  }

  if (second) {
    modules.push({
      id: `module-week-${second.id}`,
      title: copy.recommendedThisWeek,
      summary: second.title,
      impactLabel: formatImpactLabel(second.estimated_impact.monthly_savings, language),
      recommendationId: second.id,
      priority: second.priority,
    });
  }

  if (risk) {
    modules.push({
      id: `module-risk-${risk.id}`,
      title: copy.riskToWatch,
      summary: risk.summary,
      recommendationId: risk.id,
      priority: risk.priority,
    });
  } else if (alerts[0]) {
    modules.push({
      id: `module-risk-alert-${alerts[0].id}`,
      title: copy.riskToWatch,
      summary: alerts[0].summary,
      priority: alerts[0].severity === 'high' ? 'critical' : alerts[0].severity,
    });
  }

  if (top?.suggested_actions?.[0]) {
    modules.push({
      id: `module-input-${top.id}`,
      title: copy.whatINeedFromYou,
      summary: top.suggested_actions[0],
      recommendationId: top.id,
      priority: top.priority,
    });
  }

  return modules.slice(0, 4);
}

function buildToolInsightSummary(execution: ExecutionResultV8): string[] {
  const raw = asRecord(execution.structuredData._toolInsights);
  const values = Object.values(raw).filter((value): value is string => typeof value === 'string');
  return values.slice(0, 5);
}

function buildSynthesizedMetadata(input: SynthesisInputV8, finalReply: string, language: string) {
  const copy = getCopy(language);
  const operatorModules = buildOperatorModules(input, language);
  const topActions = extractBullets(finalReply);

  return {
    answer: finalReply,
    topActions,
    nextStep: extractNextStep(finalReply, language, copy.defaultNextStep),
    confidence: extractConfidence(finalReply, language),
    assumptions: extractAssumptions(finalReply, language, copy.defaultAssumptions),
    suggestedModules: operatorModules.map((item) => item.title),
    metadata: {
      routeConfidence: input.route.confidence,
      routeAmbiguity: input.route.ambiguity,
      responseLanguage: input.route.responseLanguage,
      inputLanguage: input.route.inputLanguage,
      criticScore: input.critic.criticScore,
      verificationPassed: input.verificationPassed,
      memoryUsed: input.context.memory.relevantMemories.length > 0,
      partialSuccess: input.execution.partialSuccess,
      toolInsightCount: buildToolInsightSummary(input.execution).length,
    },
  };
}

export function synthesizeResponseV8(input: SynthesisInputV8): AgentResponseV8 {
  const state: SystemStateV8 = 'responding';
  const language = detectLanguage(input.route);
  const copy = getCopy(language);
  const finalReply = input.refinedReply.trim() || copy.defaultReply;
  const operatorModules = buildOperatorModules(input, language);
  const suggestedActions = buildSuggestedActions(input, language);
  const toolInsights = buildToolInsightSummary(input.execution);

  return {
    reply: finalReply,
    metadata: {
      intent: input.route.intent,
      subtype: input.route.subtype,
      mode: input.route.mode,
      responseMode: input.route.responseMode,
      goal: input.route.goal,
      plan: input.plan.summary,
      planModes: input.plan.planModes,
      steps: input.execution.steps,
      structuredData: {
        ...input.execution.structuredData,
        synthesized: buildSynthesizedMetadata(input, finalReply, language),
        ...(toolInsights.length ? { toolInsights } : {}),
        ...(input.context.intelligence.recommendations.length
          ? { recommendations: input.context.intelligence.recommendations }
          : {}),
        ...(input.context.intelligence.userProfile
          ? { user_profile_intelligence: input.context.intelligence.userProfile }
          : {}),
      },
      suggestedActions,
      operatorModules,
      memoryUsed: input.context.memory.relevantMemories.length > 0,
      verificationPassed: input.verificationPassed,
      critic: {
        criticScore: input.critic.criticScore,
        passed: input.critic.passed,
        needsRewrite: input.critic.needsRewrite,
        qualityNotes: input.critic.qualityNotes,
      },
      state,
      inputLanguage: asString(input.route.inputLanguage, language),
      responseLanguage: asString(input.route.responseLanguage, language),
      partialSuccess: input.execution.partialSuccess,
    },
  };
}
