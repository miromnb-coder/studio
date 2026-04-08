export async function processInboundEvent() {
  return { ok: false, skipped: true, reason: 'proactive-service not configured' };
}

export async function triggerProactiveFlow() {
  return { ok: false, skipped: true, reason: 'proactive-service not configured' };
}
