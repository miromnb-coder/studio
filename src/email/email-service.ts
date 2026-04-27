import { randomUUID } from 'node:crypto';
import {
  collection,
  doc,
  Firestore,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import {
  EmailProvider,
  EmailStatus,
  ParsedDeliveryEvent,
  SendEmailInput,
  SendEmailResult,
} from '@/email/providers/EmailProvider';

export interface EmailMessageRecord {
  messageId: string;
  userId: string;
  provider: string;
  providerMessageId?: string;
  to: string | string[];
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  text?: string;
  html?: string;
  metadata?: Record<string, unknown>;
  status: EmailStatus;
  error?: string;
  createdAt: ReturnType<typeof serverTimestamp>;
  updatedAt: ReturnType<typeof serverTimestamp>;
  queuedAt?: ReturnType<typeof serverTimestamp>;
  sentAt?: ReturnType<typeof serverTimestamp>;
  deliveredAt?: ReturnType<typeof serverTimestamp>;
  bouncedAt?: ReturnType<typeof serverTimestamp>;
  failedAt?: ReturnType<typeof serverTimestamp>;
}

interface EmailServiceConfig {
  firestore: Firestore;
  providers: EmailProvider[];
  defaultProvider: string;
  storageMode?: 'top-level' | 'user-scoped';
  topLevelCollection?: string;
}

interface SendEmailOptions {
  providerName?: string;
}

export class EmailService {
  private readonly providers = new Map<string, EmailProvider>();
  private readonly storageMode: 'top-level' | 'user-scoped';
  private readonly topLevelCollection: string;

  constructor(private readonly config: EmailServiceConfig) {
    config.providers.forEach((provider) => this.providers.set(provider.name, provider));
    this.storageMode = config.storageMode ?? 'top-level';
    this.topLevelCollection = config.topLevelCollection ?? 'emailMessages';
  }

  async sendEmail(input: SendEmailInput, options?: SendEmailOptions): Promise<SendEmailResult & { messageId: string }> {
    const provider = this.getProvider(options?.providerName ?? this.config.defaultProvider);
    const messageId = input.messageId ?? randomUUID();

    await this.persistRecord({
      messageId,
      userId: input.userId,
      provider: provider.name,
      providerMessageId: undefined,
      to: input.to,
      from: input.from,
      cc: input.cc,
      bcc: input.bcc,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
      metadata: input.metadata,
      status: 'queued',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      queuedAt: serverTimestamp(),
    });

    const result = await provider.sendEmail({ ...input, messageId });

    if (result.accepted) {
      await this.updateStatus({
        userId: input.userId,
        messageId,
        status: 'sent',
        providerMessageId: result.providerMessageId,
      });
    } else {
      await this.updateStatus({
        userId: input.userId,
        messageId,
        status: 'failed',
        providerMessageId: result.providerMessageId,
        error: result.error,
      });
    }

    return {
      ...result,
      messageId,
    };
  }

  async handleDeliveryEvent(userId: string, event: ParsedDeliveryEvent): Promise<void> {
    await this.updateStatus({
      userId,
      messageId: event.messageId,
      status: event.status,
      providerMessageId: event.providerMessageId,
      error: event.reason,
    });
  }

  async updateStatus(input: {
    userId: string;
    messageId: string;
    status: Exclude<EmailStatus, 'queued'>;
    providerMessageId?: string;
    error?: string;
  }): Promise<void> {
    const timestampField = this.timestampFieldForStatus(input.status);
    await updateDoc(this.messageDocRef(input.userId, input.messageId), {
      status: input.status,
      providerMessageId: input.providerMessageId,
      error: input.error,
      updatedAt: serverTimestamp(),
      [timestampField]: serverTimestamp(),
    });
  }

  private async persistRecord(record: EmailMessageRecord): Promise<void> {
    await setDoc(this.messageDocRef(record.userId, record.messageId), record);
  }

  private messageDocRef(userId: string, messageId: string) {
    if (this.storageMode === 'user-scoped') {
      return doc(this.config.firestore, 'users', userId, 'emails', messageId);
    }

    return doc(collection(this.config.firestore, this.topLevelCollection), messageId);
  }

  private getProvider(providerName: string): EmailProvider {
    const provider = this.providers.get(providerName);
    if (!provider) throw new Error(`Unknown email provider: ${providerName}`);
    return provider;
  }

  private timestampFieldForStatus(status: Exclude<EmailStatus, 'queued'>): keyof EmailMessageRecord {
    switch (status) {
      case 'sent':
        return 'sentAt';
      case 'delivered':
        return 'deliveredAt';
      case 'bounced':
        return 'bouncedAt';
      case 'failed':
      default:
        return 'failedAt';
    }
  }
}
