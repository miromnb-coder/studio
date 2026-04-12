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

function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const swedishSignals = [/(\bhur\b|\bjag\b|\bkan\b|\bspara\b|\bvarje\b|\bmånad\b|\binte\b|\bvad\b|\bdet\b|\boch\b|\bför\b)/, /[åäö]/];
  const finnishSignals = [/(\bvoinko\b|\bsäästää\b|\bkuussa\b|\bhelposti\b|\ben\b|\bmitä\b|\btehdä\b|\bkuukausi\b|\braha\b|\btalous\b)/, /[äö]/];
  const englishSignals = [/(\bhow\b|\bwhat\b|\bi\b|\bmonthly\b|\bexpenses\b|\bhelp\b|\bstart\b|\bneed\b)/];

  const fiScore = finnishSignals.reduce((acc, rx) => acc + (rx.test(lower) ? 1 : 0), 0);
  const svScore = swedishSignals.reduce((acc, rx) => acc + (rx.test(lower) ? 1 : 0), 0);
  const enScore = englishSignals.reduce((acc, rx) => acc + (rx.test(lower) ? 1 : 0), 0);

  if (fiScore >= svScore && fiScore >= enScore && fiScore > 0) return 'fi';
  if (svScore > fiScore && svScore >= enScore && svScore > 0) return 'sv';
  return 'en';
}

function detectFinanceSubtype(message: string, historyContext: string): FinanceIntentSubtypeV8 {
  const corpus = `${historyContext} ${message}`;
  if (/\b(compare|vs\.?|versus|which is better|annual vs monthly|monthly vs yearly)\b/i.test(corpus)) return 'compare_options';
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

function detectResponseMode(message: string, intent: AgentIntentV8): ResponseModeV8 {
  if (/\b(overwhelmed|stressed|panic|anxious|lost|don't know what to do)\b/i.test(message)) return 'coach';
  if (/\b(execute|do it|draft|checklist|exact steps)\b/i.test(message)) return 'operator';
  if (intent === 'coding' || /\b(research|investigate|tradeoff)\b/i.test(message)) return 'researcher';
  return intent === 'finance' ? 'analyst' : 'researcher';
}

function buildGoalUnderstanding(message: string, subtype: FinanceIntentSubtypeV8, historyContext = '', inputLanguage = 'en'): GoalUnderstandingV8 {
  const corpus = `${historyContext} ${message}`.trim();
  const explicitRequest = message.trim();
  const emotionalTone = /\b(overwhelmed|too much|can't handle|lost|don't know what to do|en tiedä mitä tehdä)\b/i.test(message)
    ? 'overwhelmed'
    : /\b(stressed|anxious|worried|behind|stressad|ahdist)\b/i.test(message)
      ? 'stressed'
      : /\b(let's do this|ready|motivated)\b/i.test(message)
        ? 'motivated'
        : 'neutral';

  const urgency = /\b(urgent|asap|today|immediately|overdue|late fee|nyt heti)\b/i.test(message) ? 'high' : /\b(this week|soon|quick|snabbt)\b/i.test(message) ? 'medium' : 'low';
  const effortTolerance = /\b(simple|quick|fast|easy|one step|helposti|enkelt|snabbt)\b/i.test(message) ? 'low' : /\b(deep|full audit|comprehensive|thorough)\b/i.test(message) ? 'high' : 'medium';
  const speedVsDepth: GoalUnderstandingV8['speedVsDepth'] = effortTolerance === 'low' || urgency === 'high' ? 'speed' : effortTolerance === 'high' ? 'depth' : 'balanced';

  const inferredGoal =
    subtype === 'subscriptions'
      ? 'Reduce recurring spend without damaging essentials.'
      : subtype === 'compare_options'
        ? 'Choose the strongest option with transparent tradeoffs.'
        : subtype === 'savings_audit'
          ? 'Increase monthly free cash quickly and sustainably.'
          : subtype === 'budgeting'
            ? 'Build a realistic plan that the user can maintain.'
            : subtype === 'cashflow'
              ? 'Reduce near-term cash pressure and avoid late fees.'
              : explicitRequest || 'Clarify objective and deliver best next action.';

  const hiddenRequest = emotionalTone === 'overwhelmed'
    ? 'Reduce cognitive load and provide one clear first step.'
    : speedVsDepth === 'speed'
      ? 'Get a high-impact answer fast with minimal effort.'
      : 'Improve decision quality with practical ranking.';

  const decisionType: GoalUnderstandingV8['decisionType'] = emotionalTone === 'overwhelmed'
    ? 'emotional'
    : /\b(compare|which|choose|vs|versus|kumpi|vilken)\b/i.test(corpus)
      ? 'choice'
      : /\b(cancel|reduce|save|optimize|start|do next|mitä teen)\b/i.test(corpus)
        ? 'execution'
        : 'informational';

  const userConfidenceLevel: GoalUnderstandingV8['userConfidenceLevel'] = /\b(i don't know|not sure|confused|help me|en tiedä|jag vet inte)\b/i.test(corpus)
    ? 'low'
    : /\b(maybe|perhaps|likely)\b/i.test(corpus)
      ? 'medium'
      : 'high';

  const missingCriticalData = [
    !/\$?\d[\d,.]*/.test(corpus) ? 'No concrete numeric anchor provided yet.' : '',
    subtype === 'compare_options' && !/\b(month|year|annual|monthly|price|cost)\b/i.test(corpus)
      ? 'Comparison request is missing price or value constraints.'
      : '',
    (subtype === 'budgeting' || subtype === 'savings_audit') && !/\b(income|expenses?|spend|budget|tulo|kulu|utgift|inkomst)\b/i.test(corpus)
      ? 'Budget request is missing income/expense baseline.'
      : '',
  ].filter(Boolean);

  return {
    explicitRequest,
    hiddenRequest,
    inferredGoal,
    realObjective: hiddenRequest,
    urgency,
    blockerLevel: userConfidenceLevel === 'low' ? 'high' : 'some',
    riskLevel: /\b(overdue|late fee|cannot pay|can't pay|debt spiral|overdrawn)\b/i.test(message) ? 'high' : urgency === 'high' ? 'medium' : 'low',
    effortTolerance,
    speedVsDepth,
    decisionType,
    userConfidenceLevel,
    horizon: /\b(30-day|month|quarter|long term|kuukausi|månad)\b/i.test(message) ? 'long_term' : /\b(week|7-day|this week)\b/i.test(message) ? 'short_term' : 'immediate',
    preferredStyle: emotionalTone === 'overwhelmed' ? 'supportive' : speedVsDepth === 'speed' ? 'concise' : 'structured',
    category:
      subtype === 'subscriptions'
        ? 'subscriptions'
        : subtype === 'cashflow' || subtype === 'bills'
          ? 'cashflow'
          : subtype === 'savings_audit'
            ? 'savings'
            : subtype === 'budgeting'
              ? 'planning'
              : /\b(debt|loan|credit card)\b/i.test(message)
                ? 'debt'
                : 'general',
    hiddenOpportunities: [
      /\b(subscription|recurring|trial|tilaus|abonnemang)\b/i.test(message) ? 'Audit top 3 recurring charges by cost and value.' : '',
      /\b(compare|vs|versus|kumpi|vilken)\b/i.test(message) ? 'Compare total annual cost, switching cost, and failure risk.' : '',
      /\b(save|savings|money left|budget|sääst|spara)\b/i.test(message) ? 'Create automatic transfer immediately after income lands.' : '',
    ].filter(Boolean).slice(0, 3),
    priorityLens: ['impact', 'speed', 'effort', 'certainty', 'risk_reduction'],
    missingCriticalData,
    emotionalTone,
    inputLanguage,
    responseLanguage: inputLanguage,
  };
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  const normalized = message.trim();
  const inputLanguage = detectLanguage(normalized || history.at(-1)?.content || '');

  if (!normalized) {
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
      goal: buildGoalUnderstanding('', 'none', '', inputLanguage),
      needsGmail: false,
      needsFinanceData: false,
      wantsRecommendations: false,
      inputLanguage,
      responseLanguage: inputLanguage,
    };
  }

  const shortFollowUp = normalized.split(/\s+/).length <= 5 || /\b(this|that|same|what about it|entä tämä|kumpi|det här)\b/i.test(normalized);
  const historyText = history.slice(-5).map((item) => item.content).join(' ');
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
  const stress = /\b(overwhelmed|stressed|anxious|panic|can't handle|en tiedä mitä tehdä|överväldigad)\b/i.test(normalized) ? 0.9 : 0.2;
  const urgency = /\b(urgent|asap|today|immediately|overdue|nyt|snabbt)\b/i.test(normalized) ? 0.9 : /\b(soon|this week|kohta)\b/i.test(normalized) ? 0.6 : 0.2;
  const confusion = /\b(not sure|don't know|confused|what should i do|help me prioritize|en tiedä|jag vet inte)\b/i.test(normalized) ? 0.85 : 0.25;

  const confidence = Math.max(0.35, Math.min(0.98, 0.58 + top.score * 0.07 - ambiguityRaw * 0.2 - (shortFollowUp ? 0.04 : 0)));
  const shouldClarify = ambiguityRaw > 0.68 || (normalizedIntent === 'finance' && subtype === 'compare_options' && !/\d/.test(normalized));

  const needsGmail =
    /\b(gmail|email|inbox|receipt|invoice)\b/i.test(normalized) ||
    (normalizedIntent === 'finance' && ['bills', 'subscriptions', 'alerts_review'].includes(subtype));

  return {
    intent: normalizedIntent,
    subtype,
    mode: toMode(normalizedIntent),
    confidence: Number(confidence.toFixed(2)),
    ambiguity: Number(ambiguityRaw.toFixed(2)),
    shouldClarify,
    userState: { stress, urgency, confusion },
    reason: top.score > 0 ? top.reason : 'No strong domain signal.',
    responseMode: detectResponseMode(normalized, normalizedIntent),
    goal: buildGoalUnderstanding(normalized, subtype, historyText, inputLanguage),
    needsGmail,
    needsFinanceData: normalizedIntent === 'finance',
    wantsRecommendations: normalizedIntent === 'finance' || /\b(best next|priorit|recommend|smartest next move|suositus)\b/i.test(normalized),
    inputLanguage,
    responseLanguage: inputLanguage,
  };
}
