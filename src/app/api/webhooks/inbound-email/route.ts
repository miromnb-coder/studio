export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { runAgentVNext } from '@/agent/vNext/orchestrator';
import { scanForSignals } from '@/services/proactive-service';

/**
 * @fileOverview Inbound Email Webhook.
 * Maps incoming magic-forwarded emails to profiles via inbound_email_address.
 * Uses the unified vNext runtime for deep analysis.
 */

async function resolveUserIdByInboundAddress(supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>, toAddress: string) {
  const normalizedAddress = toAddress.trim().toLowerCase();

  // Primary mapping for migration from Firestore's users.inboundEmailAddress.
  const inboundLookup = await supabase
    .from('profiles')
    .select('id')
    .ilike('inbound_email_address', normalizedAddress)
    .maybeSingle();

  if (inboundLookup.data?.id) {
    return String(inboundLookup.data.id);
  }

  // Fallback for environments where inbound alias column is not provisioned yet.
  if (inboundLookup.error) {
    console.warn('INBOUND_EMAIL_ADDRESS_LOOKUP_FAILED', inboundLookup.error);
  }

  const emailLookup = await supabase
    .from('profiles')
    .select('id,email')
    .ilike('email', normalizedAddress)
    .maybeSingle();

  if (emailLookup.error) {
    console.warn('PROFILE_EMAIL_LOOKUP_FAILED', emailLookup.error);
  }

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

    if (!userId) {
      console.warn(`[WEBHOOK] Ingestion failed: No profile matched address ${toAddress}`);
      return NextResponse.json({ error: 'Identity mismatch' }, { status: 404 });
    }

    const inboundEvent = await supabase
      .from('finance_history')
      .insert({
        user_id: userId,
        event_type: 'inbound_email_received',
        title: `Inbound email: ${subject}`,
        summary: body.slice(0, 1200),
        metadata: {
          to: toAddress,
          from: fromAddress,
          source: 'webhook',
          received_at: new Date().toISOString(),
        },
      })
      .select('id')
      .maybeSingle();

    if (inboundEvent.error) {
      console.warn('INBOUND_EVENT_INSERT_FAILED', inboundEvent.error);
    }

    console.log(`[WEBHOOK] Initializing Agent vNext for User ${userId}...`);
    const execution = await runAgentVNext({
      requestId: crypto.randomUUID(),
      userId,
      message: `Autonomous Inbound Audit: [Subject: ${subject}] [Content: ${body}]`,
      conversation: [],
      metadata: {
        source: 'webhook',
        productState: {
          plan: 'FREE',
          usage: { current: 0, limit: 10, remaining: 10 },
          gmailConnected: true,
        },
      },
    });

    const agentResponse = execution.response;

    const analysisEvent = await supabase
      .from('finance_history')
      .insert({
        user_id: userId,
        event_type: 'inbound_email_analysis',
        title: `${String(agentResponse?.route.intent || 'analysis').toUpperCase()}: ${subject}`,
        summary: agentResponse?.answer.text || 'Analysis completed.',
        metadata: {
          source: 'email',
          input_method: 'email',
          estimated_monthly_savings: ((agentResponse?.answer.structuredData?.detect_leaks as any)?.estimatedMonthlySavings || 0),
          input_content: body,
          inbound_event_id: inboundEvent.data?.id ?? null,
        },
      })
      .select('id')
      .maybeSingle();

    if (analysisEvent.error) {
      console.warn('ANALYSIS_EVENT_INSERT_FAILED', analysisEvent.error);
    }

    await scanForSignals(userId, `Subject: ${subject}\n\n${body}`, analysisEvent.data?.id ? String(analysisEvent.data.id) : undefined);

    return NextResponse.json({
      success: true,
      intent: agentResponse?.route.intent || 'fallback',
      operationId: userId.slice(0, 8),
    });
  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL]:', error.message);
    return NextResponse.json({ error: 'Internal sync failure' }, { status: 500 });
  }
}
