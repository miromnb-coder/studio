import { AgentIntentV8, AgentModeV8, AgentMessageV8, RouteResultV8 } from './types';

const financeTokens = [
  'budget', 'spend', 'expense', 'expenses', 'subscription', 'subscriptions', 'bill', 'bills', 'savings',
  'cashflow', 'cancel', 'price', 'money', 'debt', 'income', 'receipt', 'receipts', 'cost', 'costs', 'payment',
  'payments', 'refund', 'finance', 'monthly',
];

const gmailTokens = [
  'gmail', 'email', 'emails', 'mailbox', 'inbox', 'mail', 'sync', 'search email', 'find email', 'email thread',
];

const productivityTokens = [
  'task', 'tasks', 'todo', 'to-do', 'plan', 'planning', 'schedule', 'calendar', 'reminder', 'organize',
  'organization', 'prioritize', 'roadmap',
];

function score(tokens: string[], text: string): number {
  return tokens.reduce((acc, token) => (text.includes(token) ? acc + 1 : acc), 0);
}

function pickMode(intent: AgentIntentV8): AgentModeV8 {
  if (intent === 'finance') return 'finance';
  if (intent === 'gmail') return 'gmail';
  if (intent === 'productivity') return 'productivity';
  return 'general';
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  if (!message.trim()) {
    return {
      intent: 'unknown',
      mode: 'general',
      confidence: 0.45,
      reason: 'Message was empty or ambiguous.',
    };
  }

  const corpus = `${history.slice(-2).map((h) => h.content.toLowerCase()).join(' ')} ${message.toLowerCase()}`;

  const financeScore = score(financeTokens, corpus);
  const gmailScore = score(gmailTokens, corpus);
  const productivityScore = score(productivityTokens, corpus);

  let intent: AgentIntentV8 = 'general';
  let reason = 'General conversation default selected.';

  if (financeScore >= 2 && financeScore >= gmailScore && financeScore >= productivityScore) {
    intent = 'finance';
    reason = 'Detected explicit finance intent from spending/cost/subscription language.';
  } else if (gmailScore >= 2 && gmailScore >= financeScore) {
    intent = 'gmail';
    reason = 'Detected explicit Gmail/email intent.';
  } else if (productivityScore >= 2) {
    intent = 'productivity';
    reason = 'Detected planning/task/reminder productivity intent.';
  }

  const maxScore = Math.max(financeScore, gmailScore, productivityScore);
  const confidence = Math.min(0.99, 0.5 + maxScore * 0.1);

  return {
    intent,
    mode: pickMode(intent),
    confidence,
    reason,
  };
}
