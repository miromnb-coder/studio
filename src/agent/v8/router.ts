import {
  AgentIntentV8,
  AgentMessageV8,
  FinanceIntentSubtypeV8,
  GoalUnderstandingV8,
  ResponseModeV8,
  RouteResultV8,
} from './types';

type IntentSignal = {
  intent: AgentIntentV8;
  score: number;
  reason: string;
};

type LanguageCode = 'en' | 'fi' | 'sv' | 'other';

const DOMAIN_PATTERNS: Array<{ intent: AgentIntentV8; weight: number; reason: string; patterns: RegExp[] }> = [
  {
    intent: 'finance',
    weight: 4,
    reason: 'Financial planning/spending signal.',
    patterns: [
      /\b(budget|spend|expense|subscription|bill|savings|debt|income|payment|cash ?flow|mortgage|refund|money|finance)\b/i,
      /\b(what should i cancel|more money left|cut costs|reduce spending|afford|recurring charges?)\b/i,
      /\b(raha|sääst|saast|budjet|kulu|lasku|tilaus|velka|tulo|maksu|talous|pengar|spara|utgift|räkning)\b/i,
    ],
  },
  {
    intent: 'gmail',
    weight: 4,
    reason: 'Email/Gmail workflow signal.',
    patterns: [
      /\b(gmail|email|emails|inbox|mailbox|thread|receipt email|invoice email)\b/i,
      /\b(scan|triage|check|review|summari[sz]e)\b.{0,25}\b(email|inbox|gmail|mail)\b/i,
    ],
  },
  {
    intent: 'productivity',
    weight: 3,
    reason: 'Task management signal.',
    patterns: [/\b(task|todo|plan my day|schedule|calendar|reminder|organize)\b/i],
  },
  {
    intent: 'planning',
    weight: 3,
    reason: 'Explicit planning horizon signal.',
    patterns: [/\b(7-day|30-day|roadmap|plan for this month|weekly plan|monthly plan|recovery plan)\b/i],
  },
  {
    intent: 'comparison',
    weight: 3,
    reason: 'Comparison request detected.',
    patterns: [/\b(compare|comparison|vs\.?|versus|which is better|tradeoff|pros and cons)\b/i],
  },
  {
    intent: 'decision',
    weight: 3,
    reason: 'Decision-support request detected.',
    patterns: [/\b(what should i do next|best next action|prioriti[sz]e|help me decide|smartest next move)\b/i],
  },
  {
    intent: 'memory',
    weight: 4,
    reason: 'Memory read/write signal.',
    patterns: [/\b(remember this|save this|store this|don't forget|what do you remember)\b/i],
  },
  {
    intent: 'coding',
    weight: 4,
    reason: 'Technical/coding request.',
    patterns: [/\b(code|debug|typescript|javascript|python|api|stack trace|refactor|compile|test)\b/i],
  },
  {
    intent: 'research',
    weight: 3,
    reason: 'Research/exploration request.',
    patterns: [/\b(research|investigate|deep dive|analyze options|market scan|sources?)\b/i],
  },
  {
    intent: 'emotional_support',
    weight: 3,
    reason: 'Emotional stress signal.',
    patterns: [
      /\b(overwhelmed|stressed|anxious|panic|i feel lost|can't handle|too much|i don't know what to do)\b/i,
      /\b(en tiedä mitä tehdä|en jaksa|uupunut|stressaantunut|ahdistaa)\b/i,
      /\b(jag vet inte vad jag ska göra|överväldigad|stressad|orolig)\b/i,
    ],
  },
];

const LANGUAGE_KEYWORDS: Record<LanguageCode, string[]> = {
  en: ['how', 'what', 'help', 'need', 'plan', 'money', 'costs', 'monthly', 'reduce'],
  fi: ['voinko', 'säästää', 'kuussa', 'mitä', 'auta', 'tarvitsen', 'talous', 'kulu', 'lasku'],
  sv: ['hur', 'sparar', 'månad', 'hjälp', 'behöver', 'kostnad', 'räkning', 'budget'],
  other: [],
};

function scoreLanguage(text: string, lang: LanguageCode): number {
  const lower = text.toLowerCase();
  if (lang === 'fi' && /[äö]/.test(lower)) return 2 + LANGUAGE_KEYWORDS.fi.reduce((a, k) => a + Number(lower.includes(k)), 0);
  if (lang === 'sv' && /[åäö]/.test(lower)) return 2 + LANGUAGE_KEYWORDS.sv.reduce((a, k) => a + Number(lower.includes(k)), 0);
  return LANGUAGE_KEYWORDS[lang].reduce((a, k) => a + Number(lower.includes(k)), 0);
}

function detectLanguage(text: string): LanguageCode {
  const fi = scoreLanguage(text, 'fi');
  const sv = scoreLanguage(text, 'sv');
  const en = scoreLanguage(text, 'en');
  const top = Math.max(fi, sv, en);
  if (top <= 0) return 'en';
  if (fi === top && fi >= sv + 1) return 'fi';
  if (sv === top && sv >= fi + 1) return 'sv';
  if (en === top) return 'en';
  return fi >= sv ? 'fi' : 'sv';
}

function detectFinanceSubtype(message: string, historyContext: string): FinanceIntentSubtypeV8 {
  const corpus = `${historyContext} ${message}`;
  if (/\b(compare|vs\.?|versus|which is better|annual vs monthly|monthly vs yearly|kumpi|vilken)\b/i.test(corpus)) return 'compare_options';
  if (/\b(subscription|trial|recurring|cancel|membership|tilaus|peruuta|abonnemang)\b/i.test(corpus)) return 'subscriptions';
  if (/\b(bill|invoice|due date|late fee|utility|lasku|räkning)\b/i.test(corpus)) return 'bills';
  if (/\b(cash ?flow|runway|paycheck to paycheck|monthly leftover)\b/i.test(corpus)) return 'cashflow';
  if (/\b(budget|allocate|spending plan|budjet|budgetera)\b/i.test(corpus)) return 'budgeting';
  if (/\b(alert|anomaly|price increase|price change|risk)\b/i.test(corpus)) return 'alerts_review';
  if (/\b(save money|savings plan|cut costs|more money left|what should i do next|sääst|spara)\b/i.test(corpus)) return 'savings_audit';
  return 'general_finance';
}

function inferFromHistory(history: AgentMessageV8[]): AgentIntentV8 {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const text = history[i]?.content || '';
    for (const domain of DOMAIN_PATTERNS) {
      if (domain.patterns.some((pattern) => pattern.test(text))) return domain.intent;
    }
  }
  return 'general';
}

function normalizeIntent(intent: AgentIntentV8): AgentIntentV8 {
  if (intent === 'planning' || intent === 'comparison' || intent === 'decision') return 'finance';
  if (intent === 'research' || intent === 'emotional_support') return 'general';
  return intent;
}

function toMode(intent: AgentIntentV8): RouteResultV8['mode'] {
  if (intent === 'finance') return 'finance';
  if (intent === 'gmail') return 'gmail';
  if (intent === 'productivity') return 'productivity';
  if (intent === 'coding') return 'coding';
  if (intent === 'memory') return 'memory';
  return 'general';
}

function inferRequestKind(message: string): GoalUnderstandingV8['requestKind'] {
  if (/\b(what is|why|explain|understand|selitä|förklara)\b/i.test(message)) return 'explanation';
  if (/\b(compare|which|kumpi|vilken|decide|valitse)\b/i.test(message)) return 'decision';
  if (/\b(do this|execute|draft|build|create|toteuta|gör)\b/i.test(message)) return 'action';
  if (/\b(help|advice|recommend|should i|mitä kannattaisi|råd)\b/i.test(message)) return 'advice';
  return 'clarification';
}

function detectResponseMode(message: string, intent: AgentIntentV8): ResponseModeV8 {
  if (/\b(overwhelmed|stressed|panic|anxious|lost|don't know what to do|en tiedä|överväldigad)\b/i.test(message)) return 'coach';
  if (/\b(execute|do it|draft|checklist|exact steps|toteuta|toimi nyt)\b/i.test(message)) return 'operator';
  if (intent === 'coding' || /\b(research|investigate|tradeoff)\b/i.test(message)) return 'researcher';
  return intent === 'finance' ? 'analyst' : 'researcher';
}

function buildGoalUnderstanding(message: string, subtype: FinanceIntentSubtypeV8, historyContext = '', inputLanguage = 'en'): GoalUnderstandingV8 {
  const corpus = `${historyContext} ${message}`.trim();
  const explicitRequest = message.trim();

  const emotionalTone = /\b(overwhelmed|too much|can't handle|lost|don't know what to do|en tiedä mitä tehdä|överväldigad)\b/i.test(corpus)
    ? 'overwhelmed'
    : /\b(stressed|anxious|worried|behind|stressad|ahdist)\b/i.test(corpus)
      ? 'stressed'
      : /\b(ready|motivated|let's do this|mennään|kör)\b/i.test(corpus)
        ? 'motivated'
        : 'neutral';

  const urgency = /\b(urgent|asap|today|immediately|overdue|late fee|nyt heti|idag)\b/i.test(corpus)
    ? 'high'
    : /\b(this week|soon|quick|snabbt)\b/i.test(corpus)
      ? 'medium'
      : 'low';

  const effortTolerance = /\b(simple|quick|fast|easy|one step|helposti|enkelt|snabbt)\b/i.test(corpus)
    ? 'low'
    : /\b(deep|full audit|comprehensive|thorough|detaljerat|perusteellinen)\b/i.test(corpus)
      ? 'high'
      : 'medium';

  const speedVsDepth: GoalUnderstandingV8['speedVsDepth'] =
    effortTolerance === 'low' || urgency === 'high'
      ? 'speed'
      : effortTolerance === 'high'
        ? 'depth'
        : 'balanced';

  const complexitySignals = [
    message.split(/\s+/).length > 25,
    /\b(compare|tradeoff|strategy|roadmap|constraints?|pros and cons)\b/i.test(corpus),
    subtype === 'compare_options',
    subtype === 'cashflow',
    /\b(multiple|several|many|many options)\b/i.test(corpus),
  ].filter(Boolean).length;

  const complexityLevel: GoalUnderstandingV8['complexityLevel'] =
    complexitySignals >= 3 ? 'high' : complexitySignals >= 1 ? 'medium' : 'low';

  const inferredGoal =
    subtype === 'subscriptions'
      ? 'Reduce recurring spend without harming essentials.'
      : subtype === 'compare_options'
        ? 'Select the strongest option with transparent tradeoffs.'
        : subtype === 'savings_audit'
          ? 'Increase monthly free cash quickly and sustainably.'
          : subtype === 'budgeting'
            ? 'Build a realistic budget the user can maintain.'
            : subtype === 'cashflow'
              ? 'Reduce short-term cash pressure and avoid penalties.'
              : explicitRequest || 'Clarify objective and deliver the best next move.';

  const hiddenRequest = emotionalTone === 'overwhelmed'
    ? 'Reduce cognitive load and give one safe first step.'
    : speedVsDepth === 'speed'
      ? 'Give the highest-probability action now.'
      : 'Improve decision quality with clear prioritization.';

  const requestKind = inferRequestKind(corpus);

  const decisionType: GoalUnderstandingV8['decisionType'] = emotionalTone === 'overwhelmed'
    ? 'emotional'
    : requestKind === 'decision'
      ? 'choice'
      : requestKind === 'action'
        ? 'execution'
        : 'informational';

  const userConfidenceLevel: GoalUnderstandingV8['userConfidenceLevel'] = /\b(i don't know|not sure|confused|help me|en tiedä|jag vet inte)\b/i.test(corpus)
    ? 'low'
    : /\b(maybe|perhaps|likely)\b/i.test(corpus)
      ? 'medium'
      : 'high';

  const wantsImmediateNextStep = urgency === 'high' || speedVsDepth === 'speed' || emotionalTone === 'overwhelmed';

  const missingCriticalData = [
    !/[$€£]?\d[\d,.]*/.test(corpus) ? 'No concrete numeric anchor provided yet.' : '',
    subtype === 'compare_options' && !/\b(month|year|annual|monthly|price|cost|hinta|pris)\b/i.test(corpus)
      ? 'Comparison request is missing price/value constraints.'
      : '',
    (subtype === 'budgeting' || subtype === 'savings_audit') && !/\b(income|expenses?|spend|budget|tulo|kulu|utgift|inkomst)\b/i.test(corpus)
      ? 'Budget request is missing income/expense baseline.'
      : '',
  ].filter(Boolean);

  const clarificationNeeded =
    explicitRequest.length < 8
    || /^(help|i need help|apua|hjälp)$/i.test(explicitRequest)
    || (requestKind === 'decision' && missingCriticalData.length > 0)
    || (complexityLevel === 'high' && userConfidenceLevel === 'low');

  const interpretationConfidence: GoalUnderstandingV8['interpretationConfidence'] =
    clarificationNeeded || missingCriticalData.length >= 2
      ? 'low'
      : missingCriticalData.length === 1 || complexityLevel === 'high'
        ? 'medium'
        : 'high';

  const clarificationReason = clarificationNeeded
    ? missingCriticalData[0] || 'Intent is broad; a single target constraint is needed.'
    : undefined;

  return {
    explicitRequest,
    hiddenRequest,
    inferredGoal,
    realObjective: hiddenRequest,
    interpretationConfidence,
    urgency,
    complexityLevel,
    blockerLevel: userConfidenceLevel === 'low' ? 'high' : 'some',
    riskLevel: /\b(overdue|late fee|cannot pay|can't pay|debt spiral|overdrawn)\b/i.test(corpus) ? 'high' : urgency === 'high' ? 'medium' : 'low',
    effortTolerance,
    speedVsDepth,
    decisionType,
    requestKind,
    userConfidenceLevel,
    horizon: /\b(30-day|month|quarter|long term|kuukausi|månad)\b/i.test(corpus) ? 'long_term' : /\b(week|7-day|this week)\b/i.test(corpus) ? 'short_term' : 'immediate',
    preferredStyle: emotionalTone === 'overwhelmed' ? 'supportive' : speedVsDepth === 'speed' ? 'concise' : complexityLevel === 'high' ? 'detailed' : 'structured',
    category:
      subtype === 'subscriptions'
        ? 'subscriptions'
        : subtype === 'cashflow' || subtype === 'bills'
          ? 'cashflow'
          : subtype === 'savings_audit'
            ? 'savings'
            : subtype === 'budgeting'
              ? 'planning'
              : /\b(debt|loan|credit card)\b/i.test(corpus)
                ? 'debt'
                : 'general',
    hiddenOpportunities: [
      /\b(subscription|recurring|trial|tilaus|abonnemang)\b/i.test(corpus) ? 'Audit top 3 recurring charges by cost and value.' : '',
      /\b(compare|vs|versus|kumpi|vilken)\b/i.test(corpus) ? 'Compare annual cost, switching friction, and failure risk.' : '',
      /\b(save|savings|money left|budget|sääst|spara)\b/i.test(corpus) ? 'Automate transfer immediately after income lands.' : '',
    ].filter(Boolean).slice(0, 3),
    priorityLens: emotionalTone === 'overwhelmed'
      ? ['speed', 'certainty', 'risk_reduction']
      : ['impact', 'speed', 'effort', 'certainty', 'risk_reduction'],
    missingCriticalData,
    clarificationNeeded,
    clarificationReason,
    wantsImmediateNextStep,
    emotionalTone,
    inputLanguage,
    responseLanguage: inputLanguage,
  };
}

function localizedClarificationPrompt(language: LanguageCode, subtype: FinanceIntentSubtypeV8): string {
  if (language === 'fi') {
    if (subtype === 'compare_options') return 'Tarkenna kaksi vaihtoehtoa ja niiden hinta per kk/vuosi.';
    return 'Tarkenna yksi asia: haluatko säästää, pienentää kuluja vai lisätä tuloja ensin?';
  }
  if (language === 'sv') {
    if (subtype === 'compare_options') return 'Förtydliga två alternativ och deras månads-/årspris.';
    return 'Förtydliga en sak: vill du spara mer, minska kostnader eller öka inkomsten först?';
  }
  if (subtype === 'compare_options') return 'Clarify the two options and their monthly/annual price.';
  return 'Clarify one thing first: save more, cut costs, or increase income?';
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  const normalized = message.trim();
  const inputLanguage = detectLanguage(normalized || history.at(-1)?.content || '');

  if (!normalized) {
    const goal = buildGoalUnderstanding('', 'none', '', inputLanguage);
    return {
      intent: 'unknown',
      subtype: 'none',
      mode: 'general',
      confidence: 0.3,
      ambiguity: 1,
      shouldClarify: true,
      userState: { stress: 0, urgency: 0, confusion: 0 },
      reason: 'Empty input',
      responseMode: 'researcher',
      goal,
      needsGmail: false,
      needsFinanceData: false,
      wantsRecommendations: false,
      inputLanguage,
      responseLanguage: inputLanguage,
    };
  }

  const shortFollowUp = normalized.split(/\s+/).length <= 5 || /\b(this|that|same|what about it|entä tämä|kumpi|det här)\b/i.test(normalized);
  const historyText = history.slice(-6).map((item) => item.content).join(' ');
  const inheritedIntent = shortFollowUp ? inferFromHistory(history) : 'general';

  const signals: IntentSignal[] = DOMAIN_PATTERNS.map((domain) => {
    const matches = domain.patterns.reduce((sum, pattern) => sum + (pattern.test(normalized) ? 1 : 0), 0);
    const inheritedBoost = shortFollowUp && inheritedIntent === domain.intent ? 2 : 0;
    return { intent: domain.intent, score: matches * domain.weight + inheritedBoost, reason: domain.reason };
  });

  const ranked = signals.sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const second = ranked[1];
  const rawIntent: AgentIntentV8 = top.score > 0 ? top.intent : 'general';
  const normalizedIntent = normalizeIntent(rawIntent);
  const subtype = normalizedIntent === 'finance' ? detectFinanceSubtype(normalized.toLowerCase(), historyText.toLowerCase()) : 'none';

  const ambiguityRaw = top.score <= 0 ? 1 : Math.max(0, 1 - (top.score - second.score) / Math.max(top.score, 1));
  const stress = /\b(overwhelmed|stressed|anxious|panic|can't handle|en tiedä mitä tehdä|överväldigad)\b/i.test(normalized) ? 0.92 : 0.25;
  const urgency = /\b(urgent|asap|today|immediately|overdue|nyt|snabbt)\b/i.test(normalized) ? 0.9 : /\b(soon|this week|kohta)\b/i.test(normalized) ? 0.6 : 0.2;
  const confusion = /\b(not sure|don't know|confused|what should i do|help me prioritize|i need help|en tiedä|jag vet inte)\b/i.test(normalized) ? 0.88 : 0.22;

  const confidence = Math.max(0.33, Math.min(0.98, 0.56 + top.score * 0.07 - ambiguityRaw * 0.22 - (shortFollowUp ? 0.03 : 0)));
  const goal = buildGoalUnderstanding(normalized, subtype, historyText, inputLanguage);

  const shouldClarify =
    ambiguityRaw > 0.68
    || goal.clarificationNeeded
    || /^(help|i need help|apua|hjälp)$/i.test(normalized)
    || (normalizedIntent === 'finance' && subtype === 'compare_options' && !/\d/.test(normalized));

  const needsGmail =
    /\b(gmail|email|inbox|receipt|invoice)\b/i.test(normalized)
    || (normalizedIntent === 'finance' && ['bills', 'subscriptions', 'alerts_review'].includes(subtype));

  const reason = top.score > 0
    ? shouldClarify
      ? `${top.reason} Clarification needed: ${goal.clarificationReason || localizedClarificationPrompt(inputLanguage, subtype)}.`
      : top.reason
    : 'No strong domain signal.';

  return {
    intent: normalizedIntent,
    subtype,
    mode: toMode(normalizedIntent),
    confidence: Number(confidence.toFixed(2)),
    ambiguity: Number(ambiguityRaw.toFixed(2)),
    shouldClarify,
    userState: { stress, urgency, confusion },
    reason,
    responseMode: detectResponseMode(normalized, normalizedIntent),
    goal,
    needsGmail,
    needsFinanceData: normalizedIntent === 'finance',
    wantsRecommendations:
      normalizedIntent === 'finance'
      || goal.requestKind === 'advice'
      || /\b(best next|priorit|recommend|smartest next move|suositus|rekommendation)\b/i.test(normalized),
    inputLanguage,
    responseLanguage: inputLanguage,
  };
}
