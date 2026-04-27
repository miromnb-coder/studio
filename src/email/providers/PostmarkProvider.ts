import {
  EmailProvider,
  EmailStatus,
  ParsedInboundEmail,
  SendEmailInput,
  SendEmailResult,
  VerifyWebhookInput,
} from '@/email/providers/EmailProvider';

interface PostmarkProviderConfig {
  serverToken: string;
  defaultFrom?: string;
  webhookToken?: string;
}

export class PostmarkProvider implements EmailProvider {
  readonly name = 'postmark';

  constructor(private readonly config: PostmarkProviderConfig) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const response = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: {
        'X-Postmark-Server-Token': this.config.serverToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: input.from ?? this.config.defaultFrom,
        To: this.list(input.to),
        Cc: this.list(input.cc),
        Bcc: this.list(input.bcc),
        ReplyTo: input.replyTo,
        Subject: input.subject,
        TextBody: input.text,
        HtmlBody: input.html,
        Metadata: input.metadata,
      }),
    });

    const data = await response.json().catch(() => undefined);
    if (!response.ok || data?.ErrorCode) {
      return {
        accepted: false,
        error: data?.Message ?? 'Failed to send email via Postmark',
        raw: data,
      };
    }

    return {
      accepted: true,
      providerMessageId: typeof data?.MessageID === 'string' ? data.MessageID : undefined,
      raw: data,
    };
  }

  async verifyWebhook(input: VerifyWebhookInput): Promise<boolean> {
    if (!this.config.webhookToken) return true;

    const token = this.getHeader(input.headers, 'x-postmark-token');
    return token === this.config.webhookToken;
  }

  async parseInbound(payload: any): Promise<ParsedInboundEmail> {
    return {
      from: payload?.From ?? payload?.from ?? 'unknown@unknown',
      to: payload?.To ?? payload?.to ?? '',
      subject: payload?.Subject ?? payload?.subject ?? 'No Subject',
      text: payload?.TextBody ?? payload?.text,
      html: payload?.HtmlBody ?? payload?.html,
      providerMessageId: payload?.MessageID,
      raw: payload,
    };
  }

  async getMessageStatus(_providerMessageId: string): Promise<EmailStatus | undefined> {
    return undefined;
  }

  private list(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value.join(',') : value;
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
