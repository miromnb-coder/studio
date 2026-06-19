import {
  EmailProvider,
  EmailStatus,
  ParsedInboundEmail,
  SendEmailInput,
  SendEmailResult,
  VerifyWebhookInput,
} from '@/email/providers/EmailProvider';

interface NodemailerTransporter {
  sendMail(input: {
    from?: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    subject: string;
    text?: string;
    html?: string;
    headers?: Record<string, string>;
  }): Promise<{ messageId?: string } & Record<string, unknown>>;
}

interface NodemailerProviderConfig {
  transporter: NodemailerTransporter;
  defaultFrom?: string;
}

export class NodemailerProvider implements EmailProvider {
  readonly name = 'nodemailer';

  constructor(private readonly config: NodemailerProviderConfig) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const result = await this.config.transporter.sendMail({
        from: input.from ?? this.config.defaultFrom,
        to: input.to,
        cc: input.cc,
        bcc: input.bcc,
        replyTo: input.replyTo,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      return {
        accepted: true,
        providerMessageId: result.messageId,
        raw: result,
      };
    } catch (error: any) {
      return {
        accepted: false,
        error: error?.message ?? 'Failed to send email via Nodemailer',
        raw: error,
      };
    }
  }

  async verifyWebhook(_input: VerifyWebhookInput): Promise<boolean> {
    return true;
  }

  async parseInbound(payload: any): Promise<ParsedInboundEmail> {
    return {
      from: payload?.from ?? payload?.envelope?.from ?? 'unknown@unknown',
      to: payload?.to ?? payload?.envelope?.to ?? '',
      subject: payload?.subject ?? 'No Subject',
      text: payload?.text,
      html: payload?.html,
      providerMessageId: payload?.messageId,
      raw: payload,
    };
  }

  async getMessageStatus(_providerMessageId: string): Promise<EmailStatus | undefined> {
    return undefined;
  }
}
