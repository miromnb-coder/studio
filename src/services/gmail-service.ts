export async function sendEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}

export async function sendDigestEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}

export async function processInboundEmail() {
  return { ok: false, skipped: true, reason: 'gmail-service not configured' };
}
