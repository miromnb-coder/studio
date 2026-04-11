import {
  AgentIntentV8,
  AgentMessageV8,
  FinanceIntentSubtypeV8,
  GoalUnderstandingV8,
  ResponseModeV8,
  RouteResultV8,
} from './types';

const FINANCE_TOKENS = [
  'budget', 'spend', 'expense', 'subscription', 'bill', 'savings', 'money', 'debt', 'income', 'payment',
  'refund', 'finance', 'monthly', 'recurring', 'cash flow', 'bank', 'invest', 'mortgage',
  'raha', 'rahaa', 'säästä', 'saasto', 'säästö', 'budjet', 'kulu', 'kulut', 'lasku', 'tilaus', 'velka', 'tulo', 'maksu', 'talous',
  'ahorro', 'dinero', 'gasto', 'suscrip', 'factura', 'épargne', 'epargne', 'argent', 'dépense', 'depense',
];

const GMAIL_TOKENS = [
  'gmail', 'email', 'emails', 'inbox', 'mailbox', 'mail thread', 'thread', 'scan email', 'my emails',
  'sähköposti', 'sahkoposti', 'posti', 'postilaatikko', 'correo', 'courriel', 'boîte', 'boite de réception', 'eingang',
];

const PRODUCTIVITY_TOKENS = [
  'task', 'todo', 'to-do', 'plan my day', 'schedule', 'calendar', 'reminder', 'organize',
  'tehtävä', 'tehtava', 'suunnitel', 'kalenteri', 'muistutus', 'järjestä', 'jarjesta',
  'tarea', 'agenda', 'organizar', 'rappel', 'calendrier',
];

const CODING_TOKENS = [
  'code', 'typescript', 'javascript', 'python', 'bug', 'debug', 'refactor', 'compile', 'test', 'algorithm',
  'api', 'endpoint', 'stack trace', 'sql',
  'koodi', 'virhe', 'korjaa', 'ohjelm', 'skripti', 'funktion', 'función', 'errore', 'fehler',
];

const MEMORY_TOKENS = [
  'remember this', 'save this', 'store this', "don't forget", 'memory', 'recall',
  'muista', 'muistat', 'muistuta', 'tallenna', 'pidä mielessä', 'pida mielessa',
  'recuerda', 'memoire', 'mémoire',
];

const EXPLICIT_GMAIL_PATTERNS = [
  /\b(gmail|inbox|mailbox|email thread|thread|email|emails)\b/i,
  /\b(search|find|scan|read|triage|summari[sz]e|check|review)\b.{0,28}\b(email|emails|inbox|gmail|mail)\b/i,
  /\b(sähköposti|sahkoposti|inboxi|postilaatikko)\b/i,
  /\b(tarkista|etsi|hae|lue|skannaa|tiivistä)\b.{0,28}\b(sähköposti|sahkoposti|posti|gmail)\b/i,
];

const EXPLICIT_FINANCE_PATTERNS = [
  /\b(budget|spend|expense|subscription|bill|savings|debt|income|cash flow|mortgage|refund|money|finance)\b/i,
  /\b(raha|rahaa|sääst|saast|budjet|kulu|lasku|tilaus|velka|tulo|maksu|talous)\b/i,
  /\b(stock|etf|crypto|portfolio|invest(ing|ment)?)\b/i,
  /\b(what should i do next|priority|deserves attention|best next action|save money|cut costs)\b/i,
  /\b(mitä minun pitäisi tehdä|mita minun pitaisi tehda|mitä seuraavaksi|mita seuraavaksi|saanko säästö|saanko saasto|miten voin säästää|miten voin saastaa)\b/i,
];

const EXPLICIT_MEMORY_PATTERNS = [
  /\b(remember this|save this|store this|don't forget|memorize|remember that)\b/i,
  /\b(what do you remember|recall|memory|what do you know about me)\b/i,
  /\b(muista|tallenna|pidä mielessä|pida mielessa|älä unohda|ala unohda)\b/i,
  /\b(mitä muistat minusta|mita muistat minusta|mitä tiedät minusta|mita tiedat minusta)\b/i,
];

const LANGUAGE_SWITCH_PATTERNS = [
  /\b(vastaa suomeksi|kirjoita suomeksi|vaihda kieli suomeksi)\b/i,
  /\b(vastaa englanniksi|kirjoita englanniksi|vaihda kieli englanniksi)\b/i,
  /\b(reply|respond|answer|write)\s+(in\s+)?(finnish|english|suomi|englanti)\b/i,
];

const EXPLICIT_CODING_PATTERNS = [
  /\b(code|debug|error|bug|refactor|compile|unit test|stack trace|typescript|javascript|python|sql)\b/i,
  /\b(api|endpoint|function|class)\b.{0,24}\b(error|issue|bug|fail|broken)\b/i,
  /\b(koodi|ohjelmointi|debuggaa|virhe|korjaa|testi|rajapinta)\b/i,
];

const RECOMMENDATION_PATTERNS = [
  /\b(what should i do next|best next action|priority action|deserves attention)\b/i,
  /\b(how can i save|save money|reduce spending|cut costs|cancel subscription)\b/i,
  /\b(what should i cancel|which subscription|low value)\b/i,
  /\b(mitä minun pitäisi tehdä seuraavaksi|mita minun pitaisi tehda seuraavaksi|mitä tekisin seuraavaksi|mita tekisin seuraavaksi)\b/i,
  /\b(miten voin säästää|miten voin saastaa|mitä kannattaa peruuttaa|mita kannattaa peruuttaa)\b/i,
];

const CLARIFICATION_PATTERNS = [
  /\b(entä tämä|enta tama|what about this|and this|this one|that one)\b/i,
  /\b(kumpi|which one|which is better|which is cheaper)\b/i,
  /\b(can you check|voiko tarkistaa|voitko tarkistaa)\b/i,
];

function countTokenMatches(tokens: string[], text: string): number {
  return tokens.reduce((sum, token) => (text.includes(token) ? sum + 1 : sum), 0);
}

function hasAnyPattern(patterns: RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function hasAnyStem(stems: string[], text: string): boolean {
  return stems.some((stem) => text.includes(stem));
}

function isShortFollowUp(message: string): boolean {
  return message.trim().split(/\s+/).length <= 5;
}

function pickDomainMode(intent: AgentIntentV8): RouteResultV8['mode'] {
  switch (intent) {
    case 'finance':
      return 'finance';
    case 'gmail':
      return 'gmail';
    case 'productivity':
      return 'productivity';
    case 'coding':
      return 'coding';
    case 'memory':
      return 'memory';
    default:
      return 'general';
  }
}

function detectResponseMode(message: string, intent: AgentIntentV8): ResponseModeV8 {
  if (
    /\b(overwhelmed|too much|confused|stressed|anxious|worried|panic|i'm behind|behind on bills|can't pay|cannot pay)\b/i.test(message)
    || /\b(stressaa|ahdistaa|olen pulassa|en tiedä mitä tehdä|en tieda mita tehda|liikaa kerralla)\b/i.test(message)
  ) {
    return 'coach';
  }

  if (
    /\b(do it|draft|write the email|checklist|action plan|execute|next actions?)\b/i.test(message)
    || /\b(tee se|tee minulle|kirjoita viesti|toimintasuunnitelma|tee lista)\b/i.test(message)
  ) {
    return 'operator';
  }

  if (
    intent === 'coding'
    || /\b(research|explore|pros and cons|tradeoffs?|compare many options)\b/i.test(message)
    || /\b(tutki|selvitä|selvita|vertaa vaihtoehtoja)\b/i.test(message)
  ) {
    return 'researcher';
  }

  return intent === 'finance' ? 'analyst' : 'researcher';
}

function detectFinanceSubtype(message: string, historyContext: string): FinanceIntentSubtypeV8 {
  const corpus = `${historyContext} ${message}`.trim();

  const subtypeScores: Record<FinanceIntentSubtypeV8, number> = {
    subscriptions: 0,
    bills: 0,
    savings_audit: 0,
    compare_options: 0,
    budgeting: 0,
    cashflow: 0,
    alerts_review: 0,
    general_finance: 0,
    none: 0,
  };

  const add = (subtype: FinanceIntentSubtypeV8, points: number) => {
    subtypeScores[subtype] += points;
  };

  if (/\b(subscription|subscriptions|recurring charge|trial|cancel subscription|membership|member(ship)?|tilaus|tilaukset|peruuta tilaus|toistuva maksu)\b/i.test(corpus)) {
    add('subscriptions', 4);
  }

  if (/\b(bill|bills|invoice|due date|utility bill|lasku|laskut|eräpäivä|erapaiva|maksamaton|due soon)\b/i.test(corpus)) {
    add('bills', 4);
  }

  if (/\b(save money|savings audit|reduce spending|cut costs|lower my expenses|save more|more money left|sääst|saast|kulukarsinta|säästö|saasto)\b/i.test(corpus)) {
    add('savings_audit', 4);
  }

  if (/\b(compare|comparison|which is cheaper|best value|cheaper|vs\.?|halvempi|vertaa|kumpi on halvempi|kannattaako tämä vai tuo|monthly vs yearly|annual vs monthly)\b/i.test(corpus)) {
    add('compare_options', 4);
  }

  if (/\b(budget|budgeting|budget plan|spending plan|allocate|budjet|budjetti|kuukausibudjetti)\b/i.test(corpus)) {
    add('budgeting', 4);
  }

  if (/\b(cash flow|cashflow|income vs expenses|runway|burn rate|kassavirta|tulot ja menot|saldo|monthly leftover)\b/i.test(corpus)) {
    add('cashflow', 4);
  }

  if (/\b(alert|alerts|notification review|risk alert|anomaly|hälytys|halytys|varoitus|ilmoitus)\b/i.test(corpus)) {
    add('alerts_review', 4);
  }

  if (/\b(what should i do next|best next action|priority|deserves attention|mitä minun pitäisi tehdä|mita minun pitaisi tehda|mitä seuraavaksi|mita seuraavaksi)\b/i.test(corpus)) {
    add('savings_audit', 2);
    add('alerts_review', 1);
  }

  if (/\b(student|opiskelija|tight budget|small budget|low income)\b/i.test(corpus)) {
    add('budgeting', 2);
    add('cashflow', 1);
  }

  const ranked = Object.entries(subtypeScores)
    .filter(([key]) => key !== 'none')
    .sort((a, b) => b[1] - a[1]);

  const [topSubtype, topScore] = ranked[0] as [FinanceIntentSubtypeV8, number];
  const [, secondScore] = ranked[1] as [FinanceIntentSubtypeV8, number];

  if (topScore <= 0) return 'general_finance';
  if (topScore - secondScore <= 1 && topScore < 4) return 'general_finance';

  return topSubtype;
}

function buildGoalUnderstanding(message: string, subtype: FinanceIntentSubtypeV8): GoalUnderstandingV8 {
  const cleanMessage = message.trim();

  const urgency: GoalUnderstandingV8['urgency'] =
    /\b(urgent|asap|today|immediately|late fee|behind|overdue|can't pay|cannot pay)\b/i.test(cleanMessage)
      || /\b(heti|tänään|tanaan|myöhässä|myohassa|kiire|pakko)\b/i.test(cleanMessage)
      ? 'high'
      : /\b(this week|soon|quickly|tight)\b/i.test(cleanMessage) || /\b(tällä viikolla|talla viikolla|pian)\b/i.test(cleanMessage)
        ? 'medium'
        : 'low';

  const emotionalTone: GoalUnderstandingV8['emotionalTone'] =
    /\b(overwhelmed|too much|confused)\b/i.test(cleanMessage)
      || /\b(liikaa|en tiedä mitä tehdä|en tieda mita tehda|sekava)\b/i.test(cleanMessage)
      ? 'overwhelmed'
      : /\b(stressed|anxious|worried|scared)\b/i.test(cleanMessage)
        || /\b(stressaa|ahdistaa|pelottaa|huolettaa)\b/i.test(cleanMessage)
        ? 'stressed'
        : /\b(ready|let's do this|motivated|serious)\b/i.test(cleanMessage)
          || /\b(aloitetaan|olen valmis|haluan oikeasti)\b/i.test(cleanMessage)
          ? 'motivated'
          : 'neutral';

  const category: GoalUnderstandingV8['category'] =
    subtype === 'subscriptions'
      ? 'subscriptions'
      : subtype === 'cashflow' || subtype === 'bills'
        ? 'cashflow'
        : /\b(debt|loan|credit card)\b/i.test(cleanMessage) || /\b(velka|laina|luottokortti)\b/i.test(cleanMessage)
          ? 'debt'
          : subtype === 'budgeting' || /\b(budget|plan|roadmap|weekly|monthly)\b/i.test(cleanMessage)
            ? 'planning'
            : subtype === 'savings_audit' || /\b(save|cut costs|reduce spending)\b/i.test(cleanMessage)
              ? 'savings'
              : 'general';

  const hiddenOpportunities = [
    /\b(subscription|recurring|trial|tilaus|toistuva)\b/i.test(cleanMessage)
      ? 'Audit recurring subscriptions for low-value spend.'
      : '',
    /\b(bills?|due|late|lasku|eräpäivä|erapaiva)\b/i.test(cleanMessage)
      ? 'Sequence due dates to reduce fees and cashflow pressure.'
      : '',
    /\b(save|savings|more money left|sääst|saast)\b/i.test(cleanMessage)
      ? 'Lock savings automatically right after income arrives.'
      : '',
    /\b(compare|which is better|vs|vertaa|kumpi)\b/i.test(cleanMessage)
      ? 'Compare by total cost of ownership, not sticker price alone.'
      : '',
  ].filter(Boolean);

  let inferredGoal = 'Clarify the user objective and deliver the most helpful next action.';

  if (subtype === 'savings_audit') {
    inferredGoal = 'Increase monthly free cash by cutting low-value spending.';
  } else if (subtype === 'compare_options') {
    inferredGoal = 'Choose the strongest financial option with clear tradeoffs.';
  } else if (subtype === 'subscriptions') {
    inferredGoal = 'Reduce recurring spend and remove unused or low-value services.';
  } else if (subtype === 'budgeting') {
    inferredGoal = 'Create a realistic monthly plan the user can actually sustain.';
  } else if (subtype === 'cashflow') {
    inferredGoal = 'Improve monthly cashflow stability and lower short-term pressure.';
  } else if (subtype === 'bills') {
    inferredGoal = 'Manage bills more safely and reduce risk of missed or costly payments.';
  } else if (cleanMessage.length > 0) {
    inferredGoal = `Improve financial outcomes for: ${cleanMessage.slice(0, 120)}`;
  }

  return {
    explicitRequest: cleanMessage || 'No explicit request provided.',
    inferredGoal,
    urgency,
    category,
    hiddenOpportunities: hiddenOpportunities.slice(0, 3),
    emotionalTone,
  };
}

function inferFromHistory(history: AgentMessageV8[]): AgentIntentV8 {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const text = history[i]?.content?.toLowerCase?.() || '';
    if (!text) continue;

    if (hasAnyPattern(EXPLICIT_FINANCE_PATTERNS, text) || countTokenMatches(FINANCE_TOKENS, text) >= 2) {
      return 'finance';
    }
    if (hasAnyPattern(EXPLICIT_GMAIL_PATTERNS, text) || countTokenMatches(GMAIL_TOKENS, text) >= 2) {
      return 'gmail';
    }
    if (hasAnyPattern(EXPLICIT_CODING_PATTERNS, text) || countTokenMatches(CODING_TOKENS, text) >= 2) {
      return 'coding';
    }
    if (hasAnyPattern(EXPLICIT_MEMORY_PATTERNS, text) || countTokenMatches(MEMORY_TOKENS, text) >= 1) {
      return 'memory';
    }
    if (countTokenMatches(PRODUCTIVITY_TOKENS, text) >= 1) {
      return 'productivity';
    }
  }

  return 'general';
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  const normalizedMessage = message.trim().toLowerCase();

  if (!normalizedMessage) {
    return {
      intent: 'unknown',
      subtype: 'none',
      mode: 'general',
      confidence: 0.35,
      reason: 'Empty input.',
      responseMode: 'researcher',
      goal: buildGoalUnderstanding('', 'none'),
      needsGmail: false,
      needsFinanceData: false,
      wantsRecommendations: false,
    };
  }

  const recentContext = history.slice(-4).map((h) => h.content.toLowerCase()).join(' ');
  const shortFollowUp = isShortFollowUp(normalizedMessage) || hasAnyPattern(CLARIFICATION_PATTERNS, normalizedMessage);
  const corpus = shortFollowUp ? `${recentContext} ${normalizedMessage}` : normalizedMessage;

  const scores: Record<AgentIntentV8, number> = {
    general: 0,
    finance: 0,
    gmail: 0,
    productivity: 0,
    coding: 0,
    memory: 0,
    unknown: 0,
  };

  scores.finance += countTokenMatches(FINANCE_TOKENS, corpus);
  scores.gmail += countTokenMatches(GMAIL_TOKENS, corpus);
  scores.productivity += countTokenMatches(PRODUCTIVITY_TOKENS, corpus);
  scores.coding += countTokenMatches(CODING_TOKENS, corpus);
  scores.memory += countTokenMatches(MEMORY_TOKENS, corpus);

  if (hasAnyPattern(EXPLICIT_FINANCE_PATTERNS, normalizedMessage)) scores.finance += 4;
  if (hasAnyPattern(EXPLICIT_GMAIL_PATTERNS, normalizedMessage)) scores.gmail += 4;
  if (hasAnyPattern(EXPLICIT_CODING_PATTERNS, normalizedMessage)) scores.coding += 4;
  if (hasAnyPattern(EXPLICIT_MEMORY_PATTERNS, normalizedMessage)) scores.memory += 4;
  if (hasAnyPattern(LANGUAGE_SWITCH_PATTERNS, normalizedMessage)) scores.general += 5;
  if (hasAnyPattern(RECOMMENDATION_PATTERNS, normalizedMessage)) scores.finance += 2;

  const hasFinanceStem = hasAnyStem(
    ['money', 'budget', 'spend', 'subscript', 'raha', 'sääst', 'saast', 'tilaus', 'kulu', 'lasku'],
    corpus,
  );
  const hasGmailStem = hasAnyStem(
    ['email', 'gmail', 'inbox', 'mail', 'sähköpost', 'sahkopost', 'correo', 'courriel'],
    corpus,
  );
  const hasMemoryStem = hasAnyStem(['remember', 'recall', 'muista', 'tallenna', 'memor'], corpus);
  const hasCodingStem = hasAnyStem(['code', 'debug', 'bug', 'api', 'koodi', 'virhe', 'ohjelm'], corpus);
  const hasProductivityStem = hasAnyStem(['task', 'todo', 'schedule', 'calendar', 'plan', 'teht', 'kalenteri'], corpus);

  if (hasFinanceStem) scores.finance += 2;
  if (hasGmailStem) scores.gmail += 2;
  if (hasMemoryStem) scores.memory += 2;
  if (hasCodingStem) scores.coding += 2;
  if (hasProductivityStem) scores.productivity += 1;

  const historyIntent = shortFollowUp ? inferFromHistory(history) : 'general';
  if (shortFollowUp && historyIntent !== 'general') {
    scores[historyIntent] += 3;
  }

  if (scores.finance > 0 && scores.gmail > 0) {
    scores.finance += 2;
  }

  let intent: AgentIntentV8 = 'general';
  let reason = 'General chat is the default path.';

  if (hasAnyPattern(LANGUAGE_SWITCH_PATTERNS, normalizedMessage)) {
    intent = 'general';
    reason = 'Explicit language-control command.';
  } else {
    const ranked = Object.entries(scores)
      .filter(([key]) => key !== 'general' && key !== 'unknown')
      .sort((a, b) => b[1] - a[1]);

    const [topIntent, topScore] = ranked[0] as [AgentIntentV8, number];
    const [, secondScore] = ranked[1] as [AgentIntentV8, number];

    if (topScore <= 0) {
      intent = 'general';
      reason = 'No strong domain-specific intent signal detected.';
    } else {
      intent = topIntent;

      if (intent === 'finance') {
        reason = scores.gmail > 0
          ? 'Finance intent detected with possible Gmail-backed evidence.'
          : 'Clear financial intent detected.';
      } else if (intent === 'gmail') {
        reason = 'Explicit Gmail/email request detected.';
      } else if (intent === 'coding') {
        reason = 'Technical/coding request detected.';
      } else if (intent === 'memory') {
        reason = 'Memory storage/retrieval request detected.';
      } else if (intent === 'productivity') {
        reason = 'Planning/productivity request detected.';
      }

      if (topScore - secondScore <= 1 && shortFollowUp && historyIntent !== 'general') {
        intent = historyIntent;
        reason = 'Short follow-up inherited the dominant recent conversation intent.';
      }
    }
  }

  const subtype = intent === 'finance' ? detectFinanceSubtype(normalizedMessage, recentContext) : 'none';

  const topIntentScore = Math.max(
    scores.finance,
    scores.gmail,
    scores.productivity,
    scores.coding,
    scores.memory,
    0,
  );

  const secondaryScore = Object.entries(scores)
    .filter(([key]) => key !== intent && key !== 'general' && key !== 'unknown')
    .map(([, score]) => score)
    .sort((a, b) => b - a)[0] || 0;

  const ambiguityPenalty = topIntentScore > 0 && topIntentScore - secondaryScore <= 1 ? 0.14 : 0;
  const followUpPenalty = shortFollowUp ? 0.05 : 0;

  const confidence = Math.max(
    0.35,
    Math.min(
      0.98,
      0.52 + topIntentScore * 0.08 - ambiguityPenalty - followUpPenalty,
    ),
  );

  const financeNeedsGmailBySubtype =
    subtype === 'subscriptions'
    || subtype === 'bills'
    || subtype === 'alerts_review';

  const explicitGmail = hasAnyPattern(EXPLICIT_GMAIL_PATTERNS, normalizedMessage) || hasGmailStem;

  return {
    intent,
    subtype,
    mode: pickDomainMode(intent),
    confidence: Number(confidence.toFixed(2)),
    reason,
    responseMode: detectResponseMode(normalizedMessage, intent),
    goal: buildGoalUnderstanding(message, subtype),
    needsGmail:
      intent === 'gmail'
      || (intent === 'finance' && financeNeedsGmailBySubtype && explicitGmail),
    needsFinanceData: intent === 'finance',
    wantsRecommendations: hasAnyPattern(RECOMMENDATION_PATTERNS, normalizedMessage) || intent === 'finance',
  };
}
