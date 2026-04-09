export async function sendEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}

export async function sendDigestEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}

export async function processInboundEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}

export class GmailService {
  static async sendEmail(_token: string, _to: string, _subject: string, _body: string) {
    const result = await sendEmail();
    return result.ok;
  }
}
