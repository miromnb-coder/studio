import { scoreInboxMessage } from './summarize';
import type { EmailOperatorPreferences, UrgentEmailResult } from './types';

interface RawInboxMessage {
  id: string;
  threadId: string | null;
  from: string;
  subject: string;
  snippet: string;
  date: string | null;
  labels?: string[];
  receivedAt?: string | null;
}

export function detectUrgentEmails(messages: RawInboxMessage[], preferences: EmailOperatorPreferences): UrgentEmailResult {
  const scored = messages.map((item) => scoreInboxMessage(item));
  const priorityList = scored
    .filter((message) => message.urgencyScore >= 0.45)
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .slice(0, 10);

  const suggestedActions: string[] = priorityList.slice(0, 3).map((message) => `Respond today: ${message.subject || message.from}`);

  if (preferences.actionOriented && priorityList.length > 0) {
    suggestedActions.push('Block a 20-minute email triage sprint now.');
  }

  if (!suggestedActions.length) {
    suggestedActions.push('No immediate urgencies detected. Check again tomorrow.');
  }

  return {
    generatedAt: new Date().toISOString(),
    totalUrgent: priorityList.length,
    priorityList,
    suggestedActions: preferences.concise ? suggestedActions.slice(0, 2) : suggestedActions,
  };
}
