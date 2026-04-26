export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { runKernel } from '@/agent/kernel';
import { scanForSignals } from '@/services/proactive-service';

async function resolveUserIdByInboundAddress(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, toAddress: string) {
  const normalizedAddress = toAddress.trim().toLowerCase();
  const inboundLookup = await supabase.from('profiles').select('id').ilike('inbound_email_address', normalizedAddress).maybeSingle();
  if (inboundLookup.data?.id) return String(inboundLookup.data.id);
  const emailLookup = await supabase.from('profiles').select('id,email').ilike('email', normalizedAddress).maybeSingle();
  return emailLookup.data?.id ? String(emailLookup.data.id) : null;
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const toAddress = String(payload.To || payload.to || '').trim();
    const subject = String(payload.Subject || payload.subject || 'Intelligence Ingestion').trim();
    const body = String(payload.TextBody || payload.text || payload.body || '').trim();
    const fromAddress = String(payload.From || payload.from || 'Unknown Source').trim();
    if (!toAddress) return NextResponse.json({ error: 'Protocol error: Missing recipient' }, { status: 400 });

    const supabase = await createSupabaseServerClient();
    const userId = await resolveUserIdByInboundAddress(supabase, toAddress);
    if (!userId) return NextResponse.json({ error: 'Identity mismatch' }, { status: 404 });

    const inboundEvent = await supabase.from('finance_history').insert({ user_id: userId, event_type: 'inbound_email_received', title: `Inbound email: ${subject}`, summary: body.slice(0, 1200), metadata: { to: toAddress, from: fromAddress, source: 'webhook', received_at: new Date().toISOString() } }).select('id').maybeSingle();

    const response = await runKernel({
      userId,
      message: `Autonomous Inbound Audit: [Subject: ${subject}] [Content: ${body}]`,
      mode: 'agent',
      metadata: { source: 'webhook' },
    });

    const analysisEvent = await supabase.from('finance_history').insert({
      user_id: userId,
      event_type: 'inbound_email_analysis',
      title: `ANALYSIS: ${subject}`,
      summary: response.answer || 'Analysis completed.',
      metadata: { source: 'email', input_method: 'email', input_content: body, inbound_event_id: inboundEvent.data?.id ?? null },
    }).select('id').maybeSingle();

    await scanForSignals(userId, `Subject: ${subject}\n\n${body}`, analysisEvent.data?.id ? String(analysisEvent.data.id) : undefined);
    return NextResponse.json({ success: true, mode: response.mode, operationId: userId.slice(0, 8) });
  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL]:', error.message);
    return NextResponse.json({ error: 'Internal sync failure' }, { status: 500 });
  }
}
