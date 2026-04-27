import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  EmailProvider,
  EmailStatus,
  ParsedInboundEmail,
  SendEmailInput,
  SendEmailResult,
  VerifyWebhookInput,
} from '@/email/providers/EmailProvider';

interface ResendProviderConfig {
  apiKey: string;
  defaultFrom?: string;
  webhookSecret?: string;
}

export class ResendProvider implements EmailProvider {
  readonly name = 'resend';

  constructor(private readonly config: ResendProviderConfig) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from ?? this.config.defaultFrom,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        reply_to: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
        tags: input.tags?.map((tag) => ({ name: 'tag', value: tag })),
      }),
    });

    const data = await response.json().catch(() => undefined);
    if (!response.ok) {
      return {
        accepted: false,
        error: typeof data?.message === 'string' ? data.message : 'Failed to send email via Resend',
        raw: data,
      };
    }

    return {
      accepted: true,
      providerMessageId: typeof data?.id === 'string' ? data.id : undefined,
      raw: data,
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<boolean> {
    if (!this.config.webhookSecret) return true;

    const signature = this.getHeader(input.headers, 'x-resend-signature');
    if (!signature) return false;

    const expected = createHmac('sha256', this.config.webhookSecret).update(input.rawBody).digest('hex');
    if (signature.length !== expected.length) return false;

    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  }

  async parseInbound(payload: any): Promise<ParsedInboundEmail> {
    return {
      from: payload?.from ?? payload?.From ?? 'unknown@unknown',
      to: payload?.to ?? payload?.To ?? '',
      subject: payload?.subject ?? payload?.Subject ?? 'No Subject',
      text: payload?.text ?? payload?.TextBody,
      html: payload?.html ?? payload?.HtmlBody,
      providerMessageId: payload?.id,
      raw: payload,
    };
  }

  async getMessageStatus(_providerMessageId: string): Promise<EmailStatus | undefined> {
    return undefined;
  }

  private getHeader(
    headers: Headers | Record<string, string | string[] | undefined>,
    key: string
  ): string | undefined {
    if (headers instanceof Headers) {
      return headers.get(key) ?? undefined;
    }

    const value = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(value)) return value[0];
    return value;
  }
}
