import { Timestamp } from 'firebase/firestore';

export type JsonObject = Record<string, unknown>;

export interface FirestoreAuditFields {
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

export interface InboundEmailDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  from: string;
  subject: string;
  body: string;
  toAddress: string;
  receivedAt: string;
  providerMessageId?: string;
}

export interface OutboundEmailDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  to: string;
  subject: string;
  body: string;
  status: 'queued' | 'sent' | 'failed';
  sentAt?: string;
  providerMessageId?: string;
}

export interface EmailDeliveryEventDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  outboundEmailId?: string;
  eventType: 'processed' | 'deferred' | 'delivered' | 'open' | 'click' | 'bounce' | 'spamreport' | 'dropped' | 'unknown';
  occurredAt: string;
  metadata?: JsonObject;
}

export interface AnalysisDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  source: 'email' | 'manual' | 'chat' | 'system';
  title: string;
  summary: string;
  estimatedMonthlySavings: number;
  analysisDate: string;
  status: 'pending' | 'completed' | 'failed';
  inputMethod?: string;
  inputContent?: string;
}

export interface TaskDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  dueAt?: string;
  priority?: 'low' | 'medium' | 'high';
  sourceAnalysisId?: string;
}

export interface NoteDocument extends FirestoreAuditFields {
  id: string;
  userId: string;
  content: string;
  tags?: string[];
  relatedTaskId?: string;
  relatedAnalysisId?: string;
}

export interface LongTermMemoryDocument extends FirestoreAuditFields {
  id: 'main';
  userId: string;
  goals: string[];
  subscriptions: string[];
  preferences: string[];
  behaviorSummary: string;
  profile?: JsonObject;
  lastUpdated?: Timestamp | null;
}
