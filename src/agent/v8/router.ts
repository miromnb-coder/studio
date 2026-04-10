import { AgentIntentV8, AgentModeV8, AgentMessageV8, RouteResultV8 } from './types';

const FINANCE_TOKENS = [
  'budget', 'spend', 'expense', 'subscription', 'bill', 'savings', 'money', 'debt', 'income', 'payment',
  'refund', 'finance', 'monthly', 'recurring', 'cash flow', 'bank', 'invest', 'mortgage',
];

const GMAIL_TOKENS = [
  'gmail', 'email', 'inbox', 'mailbox', 'mail thread', 'search email', 'scan email', 'my emails',
];

const PRODUCTIVITY_TOKENS = [
  'task', 'todo', 'to-do', 'plan my day', 'schedule', 'calendar', 'reminder', 'organize',
];

const CODING_TOKENS = [
  'code', 'typescript', 'javascript', 'python', 'bug', 'debug', 'refactor', 'compile', 'test', 'algorithm',
];

const MEMORY_TOKENS = ['remember this', 'save this', 'store this', 'don\'t forget', 'memory'];

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
  /\b(gmail|inbox|mailbox|email thread|thread)\b/i,
  /\b(search|find|scan|read|triage|summari[sz]e)\b.{0,20}\b(email|emails|inbox|gmail|mail)\b/i,
];

const EXPLICIT_FINANCE_PATTERNS = [
  /\b(budget|spend|expense|subscription|bill|savings|debt|income|cash flow|mortgage|refund)\b/i,
  /\b(stock|etf|crypto|portfolio|invest(ing|ment)?)\b/i,
];

const EXPLICIT_MEMORY_PATTERNS = [
  /\b(remember this|save this|store this|don't forget|memorize)\b/i,
  /\b(what do you remember|recall|memory)\b/i,
];

const EXPLICIT_CODING_PATTERNS = [
  /\b(code|debug|error|bug|refactor|compile|unit test|stack trace|typescript|javascript|python|sql)\b/i,
  /\b(api|endpoint|function|class)\b.{0,24}\b(error|issue|bug|fail|broken)\b/i,
];

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

  let intent: AgentIntentV8 = 'general';
  let reason = 'General chat is the default path.';

  if (explicitMemory || (memoryScore >= 1 && /\bremember|memory|store|save|don't forget\b/.test(normalizedMessage))) {
    intent = 'memory';
    reason = 'User explicitly asks to store or retrieve memory.';
  } else if (explicitFinance && explicitGmail) {
    intent = 'finance';
    reason = 'Finance request that explicitly depends on email/Gmail context.';
  } else if (explicitGmail && !explicitFinance) {
    intent = 'gmail';
    reason = 'Explicit email/Gmail request.';
  } else if (explicitFinance || financeScore >= 2) {
    intent = 'finance';
    reason = 'Clear money/subscription/expense intent.';
  } else if (explicitCoding || (codingScore >= 1 && /\bcode|debug|error|bug|typescript|javascript|python|api|compile|test\b/.test(normalizedMessage))) {
    intent = 'coding';
    reason = 'Technical/coding intent detected.';
  } else if (productivityScore >= 1 && /\b(plan|schedule|task|todo|calendar|organize|priorit)\b/.test(normalizedMessage)) {
    intent = 'productivity';
    reason = 'Planning/productivity intent detected.';
  }

  const confidence = Math.min(
    0.98,
    0.5 + Math.max(financeScore, gmailScore, productivityScore, codingScore, memoryScore) * 0.1,
  );

  const needsGmail = intent === 'gmail' || (intent === 'finance' && explicitGmail);

  return {
    intent,
    mode: pickMode(intent),
    confidence,
    reason,
    needsGmail,
    needsFinanceData: intent === 'finance',
  };
}
