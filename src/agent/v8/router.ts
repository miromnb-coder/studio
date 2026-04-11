import { AgentIntentV8, AgentModeV8, AgentMessageV8, RouteResultV8 } from './types';

const FINANCE_TOKENS = [
  'budget', 'spend', 'expense', 'subscription', 'bill', 'savings', 'money', 'debt', 'income', 'payment',
  'refund', 'finance', 'monthly', 'recurring', 'cash flow', 'bank', 'invest', 'mortgage',
  // Finnish + multilingual reinforcement
  'raha', 'säästä', 'saasto', 'budjet', 'kulu', 'lasku', 'tilaus', 'velka', 'tulo', 'maksu',
  'ahorro', 'dinero', 'gasto', 'suscrip', 'factura', 'épargne', 'epargne', 'argent', 'dépense', 'depense',
];

const GMAIL_TOKENS = [
  'gmail', 'email', 'inbox', 'mailbox', 'mail thread', 'search email', 'scan email', 'my emails',
  'sähköposti', 'sahkoposti', 'posti', 'correo', 'courriel', 'boîte', 'boite de réception', 'eingang',
];

const PRODUCTIVITY_TOKENS = [
  'task', 'todo', 'to-do', 'plan my day', 'schedule', 'calendar', 'reminder', 'organize',
  'tehtävä', 'tehtava', 'suunnitel', 'kalenteri', 'muistutus', 'järjestä', 'jarjesta',
  'tarea', 'agenda', 'organizar', 'rappel', 'calendrier',
];

const CODING_TOKENS = [
  'code', 'typescript', 'javascript', 'python', 'bug', 'debug', 'refactor', 'compile', 'test', 'algorithm',
  'koodi', 'virhe', 'korjaa', 'ohjelm', 'skripti', 'funktion', 'función', 'errore', 'fehler',
];

const MEMORY_TOKENS = [
  'remember this', 'save this', 'store this', 'don\'t forget', 'memory',
  'muista', 'muistat', 'muistuta', 'tallenna', 'pidä mielessä', 'pida mielessa', 'recuerda', 'memoire', 'mémoire',
];

function countTokens(tokens: string[], text: string): number {
  return tokens.reduce((sum, token) => (text.includes(token) ? sum + 1 : sum), 0);
}

function isShortFollowUp(message: string): boolean {
  return message.trim().split(/\s+/).length <= 5;
}

function hasAnyPattern(patterns: RegExp[], text: string): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

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
  /\b(mitä minun pitäisi tehdä|mita minun pitaisi tehda|mitä seuraavaksi|saanko säästö|miten voin säästää)\b/i,
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

function hasAnyStem(stems: string[], text: string): boolean {
  return stems.some((stem) => text.includes(stem));
}

function pickMode(intent: AgentIntentV8): AgentModeV8 {
  if (intent === 'finance') return 'finance';
  if (intent === 'gmail') return 'gmail';
  if (intent === 'productivity') return 'productivity';
  if (intent === 'coding') return 'coding';
  if (intent === 'memory') return 'memory';
  return 'general';
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  const normalizedMessage = message.trim().toLowerCase();
  if (!normalizedMessage) {
    return {
      intent: 'unknown',
      mode: 'general',
      confidence: 0.35,
      reason: 'Empty input.',
      needsGmail: false,
      needsFinanceData: false,
      wantsRecommendations: false,
    };
  }

  const recentContext = history.slice(-3).map((h) => h.content.toLowerCase()).join(' ');
  const corpus = isShortFollowUp(normalizedMessage) ? `${recentContext} ${normalizedMessage}` : normalizedMessage;

  const financeScore = countTokens(FINANCE_TOKENS, corpus);
  const gmailScore = countTokens(GMAIL_TOKENS, corpus);
  const productivityScore = countTokens(PRODUCTIVITY_TOKENS, corpus);
  const codingScore = countTokens(CODING_TOKENS, corpus);
  const memoryScore = countTokens(MEMORY_TOKENS, corpus);
  const explicitFinance = hasAnyPattern(EXPLICIT_FINANCE_PATTERNS, normalizedMessage);
  const explicitGmail = hasAnyPattern(EXPLICIT_GMAIL_PATTERNS, normalizedMessage);
  const explicitCoding = hasAnyPattern(EXPLICIT_CODING_PATTERNS, normalizedMessage);
  const explicitMemory = hasAnyPattern(EXPLICIT_MEMORY_PATTERNS, normalizedMessage);
  const explicitLanguageSwitch = hasAnyPattern(LANGUAGE_SWITCH_PATTERNS, normalizedMessage);
  const wantsRecommendations = hasAnyPattern(RECOMMENDATION_PATTERNS, normalizedMessage);
  const hasFinanceStem = hasAnyStem(['money', 'budget', 'spend', 'subscript', 'raha', 'sääst', 'saast', 'tilaus', 'kulu'], corpus);
  const hasGmailStem = hasAnyStem(['email', 'gmail', 'inbox', 'mail', 'sähköpost', 'sahkopost', 'correo', 'courriel'], corpus);
  const hasMemoryVerbStem = hasAnyStem(['remember', 'recall', 'muista', 'tallenna', 'memor', 'recordar'], normalizedMessage);
  const hasCodingStem = hasAnyStem(['code', 'debug', 'bug', 'api', 'koodi', 'virhe', 'ohjelm'], corpus);
  const hasProductivityStem = hasAnyStem(['task', 'todo', 'schedule', 'calendar', 'plan', 'teht', 'kalenteri', 'suunnitel'], corpus);

  let intent: AgentIntentV8 = 'general';
  let reason = 'General chat is the default path.';

  if (explicitLanguageSwitch) {
    intent = 'general';
    reason = 'Explicit language-control command.';
  } else if (explicitMemory || (memoryScore >= 1 && hasMemoryVerbStem)) {
    intent = 'memory';
    reason = 'User explicitly asks to store or retrieve memory.';
  } else if ((explicitFinance || hasFinanceStem) && (explicitGmail || hasGmailStem)) {
    intent = 'finance';
    reason = 'Finance request that explicitly depends on email/Gmail context.';
  } else if ((explicitGmail || hasGmailStem) && !(explicitFinance || hasFinanceStem)) {
    intent = 'gmail';
    reason = 'Explicit email/Gmail request.';
  } else if (explicitFinance || financeScore >= 2 || hasFinanceStem) {
    intent = 'finance';
    reason = 'Clear money/subscription/expense intent.';
  } else if (explicitCoding || (codingScore >= 1 && hasCodingStem)) {
    intent = 'coding';
    reason = 'Technical/coding intent detected.';
  } else if (productivityScore >= 1 && hasProductivityStem) {
    intent = 'productivity';
    reason = 'Planning/productivity intent detected.';
  }

  const confidence = Math.min(
    0.98,
    0.5 + Math.max(financeScore, gmailScore, productivityScore, codingScore, memoryScore) * 0.1,
  );

  const needsGmail = intent === 'gmail' || (intent === 'finance' && (explicitGmail || hasGmailStem));

  return {
    intent,
    mode: pickMode(intent),
    confidence,
    reason,
    needsGmail,
    needsFinanceData: intent === 'finance',
    wantsRecommendations: wantsRecommendations || intent === 'finance',
  };
}
