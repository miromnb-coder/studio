import { AgentIntentV8, AgentModeV8, AgentMessageV8, RouteResultV8 } from './types';

const financeTokens = [
  'budget',
  'spend',
  'expense',
  'expenses',
  'subscription',
  'subscriptions',
  'bill',
  'savings',
  'cashflow',
  'cancel',
  'price',
  'money',
  'debt',
  'income',
];

const technicalTokens = [
  'bug',
  'error',
  'stack',
  'exception',
  'typescript',
  'next.js',
  'api',
  'database',
  'sql',
  'crash',
  'failure',
  'debug',
  'fix',
  'deploy',
];

const analysisTokens = ['analyze', 'compare', 'evaluate', 'tradeoff', 'risk', 'review', 'audit'];

function score(tokens: string[], text: string): number {
  return tokens.reduce((acc, token) => (text.includes(token) ? acc + 1 : acc), 0);
}

function pickMode(intent: AgentIntentV8): AgentModeV8 {
  if (intent === 'finance') return 'finance';
  if (intent === 'technical') return 'technical';
  return 'general';
}

export function routeIntentV8(message: string, history: AgentMessageV8[] = []): RouteResultV8 {
  const corpus = `${history.slice(-2).map((h) => h.content.toLowerCase()).join(' ')} ${message.toLowerCase()}`;

  const financeScore = score(financeTokens, corpus);
  const technicalScore = score(technicalTokens, corpus);
  const analysisScore = score(analysisTokens, corpus);

  let intent: AgentIntentV8 = 'general';
  let reason = 'No dominant domain keywords detected.';

  if (financeScore >= technicalScore && financeScore >= 2) {
    intent = 'finance';
    reason = 'Finance keywords dominated deterministic routing.';
  } else if (technicalScore > financeScore && technicalScore >= 2) {
    intent = 'technical';
    reason = 'Technical keywords dominated deterministic routing.';
  } else if (analysisScore >= 2) {
    intent = 'analysis';
    reason = 'Analysis keywords crossed deterministic threshold.';
  }

  const maxScore = Math.max(financeScore, technicalScore, analysisScore);
  const confidence = Math.min(0.99, 0.5 + maxScore * 0.1);

  return {
    intent,
    mode: pickMode(intent),
    confidence,
    reason,
  };
}
