import type { EmailOperatorMessage, EmailOperatorPreferences, InboxSummaryResult } from './types';

const URGENT_KEYWORDS = [
  'urgent',
  'asap',
  'action required',
  'payment due',
  'due today',
  'overdue',
  'verify',
  'deadline',
  'expires',
  'final notice',
  'confirm',
  'reminder',
  'invoice due',
];

const FINANCE_KEYWORDS = ['invoice', 'bill', 'payment', 'subscription', 'renewal', 'charge', 'receipt'];

const LOW_PRIORITY_KEYWORDS = ['newsletter', 'digest', 'promo', 'promotion', 'sale', 'social', 'updates'];

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

function parseFromEmail(from: string): string {
  const emailMatch = from.match(/<([^>]+)>/);
  return (emailMatch?.[1] || from).trim().toLowerCase();
}

export function scoreInboxMessage(input: {
  id: string;
  threadId: string | null;
  from: string;
  subject: string;
  snippet: string;
  date: string | null;
  labels?: string[];
  receivedAt?: string | null;
}): EmailOperatorMessage {
  const subject = input.subject.trim();
  const snippet = input.snippet.trim();
  const combined = `${subject} ${snippet}`.toLowerCase();

  let urgencyScore = 0;
  let relevanceScore = 0;
  const reasons: string[] = [];

  if (containsAny(combined, URGENT_KEYWORDS)) {
    urgencyScore += 0.55;
    reasons.push('Contains time-sensitive language');
  }

  if (containsAny(combined, FINANCE_KEYWORDS)) {
    urgencyScore += 0.12;
    relevanceScore += 0.3;
    reasons.push('Finance-related message');
  }

  if (/\d{1,2}[\/.\-]\d{1,2}|today|tomorrow|this week/i.test(combined)) {
    urgencyScore += 0.2;
    reasons.push('References a near-term date');
  }

  if (containsAny(combined, LOW_PRIORITY_KEYWORDS)) {
    relevanceScore -= 0.35;
    reasons.push('Looks like a low-priority bulk message');
  }

  if (/re:|fwd:/i.test(subject)) {
    relevanceScore += 0.15;
    reasons.push('Likely an active conversation');
  }

  if (subject.length > 0) {
    relevanceScore += 0.2;
  }

  urgencyScore = Math.max(0, Math.min(1, Math.round(urgencyScore * 100) / 100));
  relevanceScore = Math.max(0, Math.min(1, Math.round((relevanceScore + 0.4) * 100) / 100));

  return {
    id: input.id,
    threadId: input.threadId,
    from: input.from,
    fromEmail: parseFromEmail(input.from),
    subject,
    snippet,
    date: input.date,
    labels: input.labels || [],
    receivedAt: input.receivedAt || null,
    urgencyScore,
    relevanceScore,
    reasons,
  };
}

export function buildInboxSummary(messages: EmailOperatorMessage[], preferences: EmailOperatorPreferences): InboxSummaryResult {
  const sorted = [...messages].sort((a, b) => b.urgencyScore + b.relevanceScore - (a.urgencyScore + a.relevanceScore));

  const urgentEmails = sorted.filter((message) => message.urgencyScore >= 0.5).slice(0, 8);
  const importantEmails = sorted
    .filter((message) => message.relevanceScore >= 0.55 || message.urgencyScore >= 0.45)
    .slice(0, 8);

  const lowPriorityEmails = sorted
    .filter((message) => message.relevanceScore <= 0.4 && message.urgencyScore < 0.35)
    .slice(0, 8);

  const bestNextMove = urgentEmails[0]
    ? `Reply to “${urgentEmails[0].subject || urgentEmails[0].from}” first.`
    : importantEmails[0]
      ? `Process “${importantEmails[0].subject || importantEmails[0].from}” next.`
      : 'Run a quick archive pass on low-priority emails.';

  const recommendedActions = [
    urgentEmails[0] ? `Handle urgent: ${urgentEmails[0].subject || urgentEmails[0].from}` : 'No urgent messages detected right now',
    importantEmails[1] ? `Review important: ${importantEmails[1].subject || importantEmails[1].from}` : 'Review recent conversation threads',
    lowPriorityEmails.length ? `Archive ${Math.min(lowPriorityEmails.length, 5)} low-priority items` : 'No low-priority cleanup needed',
  ];

  if (preferences.prioritizeSavings && !recommendedActions.some((line) => line.toLowerCase().includes('bill'))) {
    const financeTarget = sorted.find((message) => /invoice|bill|subscription|payment/i.test(`${message.subject} ${message.snippet}`));
    if (financeTarget) {
      recommendedActions.push(`Check money risk: ${financeTarget.subject || financeTarget.from}`);
    }
  }

  if (preferences.concise) {
    recommendedActions.splice(3);
  }

  return {
    generatedAt: new Date().toISOString(),
    headline: `Inbox Summary: ${importantEmails.length} important, ${urgentEmails.length} urgent, ${lowPriorityEmails.length} safe to ignore.`,
    importantCount: importantEmails.length,
    urgentCount: urgentEmails.length,
    ignoreCount: lowPriorityEmails.length,
    bestNextMove,
    recommendedActions,
    importantEmails,
    urgentEmails,
    lowPriorityEmails,
  };
}
