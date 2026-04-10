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
  const corpus = `${recentContext} ${normalizedMessage}`;

  const financeScore = countTokens(FINANCE_TOKENS, corpus);
  const gmailScore = countTokens(GMAIL_TOKENS, corpus);
  const productivityScore = countTokens(PRODUCTIVITY_TOKENS, corpus);
  const codingScore = countTokens(CODING_TOKENS, corpus);
  const memoryScore = countTokens(MEMORY_TOKENS, corpus);

  let intent: AgentIntentV8 = 'general';
  let reason = 'General chat is the default path.';

  if (gmailScore >= 1 && /\b(email|gmail|inbox|mailbox)\b/.test(normalizedMessage)) {
    intent = 'gmail';
    reason = 'Explicit email/Gmail request.';
  } else if (financeScore >= 2) {
    intent = 'finance';
    reason = 'Clear money/subscription/expense intent.';
  } else if (codingScore >= 2) {
    intent = 'coding';
    reason = 'Technical/coding intent detected.';
  } else if (productivityScore >= 2) {
    intent = 'productivity';
    reason = 'Planning/productivity intent detected.';
  } else if (memoryScore >= 1) {
    intent = 'memory';
    reason = 'User asks to store/retrieve memory.';
  }

  const confidence = Math.min(
    0.98,
    0.5 + Math.max(financeScore, gmailScore, productivityScore, codingScore, memoryScore) * 0.1,
  );

  const needsGmail =
    intent === 'gmail' ||
    (intent === 'finance' && /\b(email|gmail|receipt|invoice|inbox|statement in mail)\b/.test(normalizedMessage));

  return {
    intent,
    mode: pickMode(intent),
    confidence,
    reason,
    needsGmail,
    needsFinanceData: intent === 'finance',
  };
}
