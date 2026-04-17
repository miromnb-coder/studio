export type EmailOperatorAction =
  | 'inbox_summary'
  | 'urgent'
  | 'subscriptions'
  | 'digest'
  | 'draft';

export interface EmailOperatorPreferences {
  concise: boolean;
  prioritizeSavings: boolean;
  ignoreNewsletters: boolean;
  actionOriented: boolean;
}

export interface EmailOperatorMessage {
  id: string;
  threadId: string | null;
  from: string;
  fromEmail: string;
  subject: string;
  snippet: string;
  date: string | null;
  labels: string[];
  receivedAt: string | null;
  urgencyScore: number;
  relevanceScore: number;
  reasons: string[];
}

export interface InboxSummaryResult {
  generatedAt: string;
  headline: string;
  importantCount: number;
  urgentCount: number;
  ignoreCount: number;
  bestNextMove: string;
  recommendedActions: string[];
  importantEmails: EmailOperatorMessage[];
  urgentEmails: EmailOperatorMessage[];
  lowPriorityEmails: EmailOperatorMessage[];
}

export interface UrgentEmailResult {
  generatedAt: string;
  totalUrgent: number;
  priorityList: EmailOperatorMessage[];
  suggestedActions: string[];
}

export interface SubscriptionOpportunity {
  merchant: string;
  amount: number | null;
  currency: string;
  period: 'monthly' | 'yearly' | 'unknown';
  status: 'active' | 'trial' | 'renewal_due' | 'price_increase' | 'duplicate';
  confidence: number;
  note: string;
}

export interface SubscriptionScannerResult {
  generatedAt: string;
  activeCount: number;
  duplicateCount: number;
  trialEndingCount: number;
  renewalCount: number;
  priceIncreaseCount: number;
  cancellationOpportunities: string[];
  estimatedMonthlySavings: number;
  currency: string;
  opportunities: SubscriptionOpportunity[];
  summary: string;
}

export interface DraftReplySet {
  generatedAt: string;
  messageId: string;
  subject: string;
  from: string;
  shortReply: string;
  professionalReply: string;
  friendlyReply: string;
  politeDecline: string;
  askForMoreTime: string;
}

export interface WeeklyDigestResult {
  generatedAt: string;
  title: string;
  importantHighlights: string[];
  moneyRisks: string[];
  subscriptionsFound: string[];
  cleanupActions: string[];
  nextWeekWatchouts: string[];
  conciseSummary: string;
}
