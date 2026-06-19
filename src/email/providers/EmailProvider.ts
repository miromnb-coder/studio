export type EmailStatus = 'queued' | 'sent' | 'delivered' | 'bounced' | 'failed';

export interface SendEmailInput {
  userId: string;
  messageId?: string;
  to: string | string[];
  from?: string;
  subject: string;
  text?: string;
  html?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  accepted: boolean;
  providerMessageId?: string;
  raw?: unknown;
  error?: string;
}

export interface VerifyWebhookInput {
  headers: Headers | Record<string, string | string[] | undefined>;
  rawBody: string;
}

export interface ParsedInboundEmail {
  from: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  providerMessageId?: string;
  raw?: unknown;
}

export interface ParsedDeliveryEvent {
  messageId: string;
  providerMessageId?: string;
  status: Exclude<EmailStatus, 'queued'>;
  reason?: string;
  raw?: unknown;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<boolean>;
  parseInbound(payload: unknown): Promise<ParsedInboundEmail>;
  getMessageStatus?(providerMessageId: string): Promise<EmailStatus | undefined>;
}
