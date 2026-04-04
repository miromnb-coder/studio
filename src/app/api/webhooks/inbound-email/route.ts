export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { runAgent } from '@/agent/agent';
import { claimInboundWebhook, markWebhookReceiptProcessed, StructuredFailure } from '@/services/email-job-service';

/**
 * @fileOverview Inbound Email Webhook Handler.
 * Integrates directly with the AI Agent v3 Pipeline.
 */

function toFailure(code: string, provider: string, context: Record<string, unknown>): StructuredFailure {
  return { code, provider, context };
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => null);
  const provider = payload?.provider || payload?.Provider || 'unknown';

  try {
    if (!payload || typeof payload !== 'object') {
      const failure = toFailure('INVALID_PAYLOAD', provider, {});
      return NextResponse.json({ success: false, error: failure }, { status: 400 });
    }

    const toAddress = payload.To || payload.to || '';
    const subject = payload.Subject || payload.subject || 'No Subject';
    const body = payload.TextBody || payload.text || payload.body || '';
    const fromAddress = payload.From || payload.from || 'Unknown';
    const providerMessageId =
      payload.MessageID || payload.messageId || payload['Message-Id'] || payload['message-id'] || payload.id || '';

    if (!toAddress) {
      const failure = toFailure('MISSING_RECIPIENT', provider, {});
      return NextResponse.json({ success: false, error: failure }, { status: 400 });
    }

    if (!providerMessageId) {
      const failure = toFailure('MISSING_PROVIDER_MESSAGE_ID', provider, { recipient: toAddress });
      return NextResponse.json({ success: false, error: failure }, { status: 400 });
    }

    const claim = await claimInboundWebhook(provider, providerMessageId, toAddress);
    if (claim.duplicate) {
      return NextResponse.json({ success: true, duplicate: true, idempotencyKey: claim.key });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) {
      const failure = toFailure('FIRESTORE_NOT_INITIALIZED', provider, { recipient: toAddress });
      await markWebhookReceiptProcessed(claim.key, { status: 'failed', error: failure });
      return NextResponse.json({ success: false, error: failure }, { status: 500 });
    }

    // Find UserProfile by magic forwarding address
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const failure = toFailure('USER_NOT_FOUND', provider, { recipient: toAddress });
      await markWebhookReceiptProcessed(claim.key, { status: 'failed', error: failure });
      return NextResponse.json({ success: false, error: failure }, { status: 404 });
    }

    const userId = querySnapshot.docs[0].id;

    // Log the ingestion
    await addDoc(collection(firestore, 'users', userId, 'inbox'), {
      userId,
      subject,
      body,
      from: fromAddress,
      provider,
      providerMessageId,
      receivedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    // Execute Agent v3 Pipeline
    console.log(`WEBHOOK_INGEST: Processing email from ${fromAddress}...`);
    const agentResult = await runAgent(`Email Audit Request: Subject: ${subject}\n\nContent: ${body}`);

    // Store the analysis
    await addDoc(collection(firestore, 'users', userId, 'analyses'), {
      userId,
      source: 'email',
      title: agentResult.data?.title || subject,
      summary: agentResult.content,
      estimatedMonthlySavings: agentResult.data?.data?.savingsEstimate || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      createdAt: serverTimestamp(),
    });

    await markWebhookReceiptProcessed(claim.key, { status: 'processed', userId });

    return NextResponse.json({
      success: true,
      intent: agentResult.intent,
      mode: agentResult.mode,
      idempotencyKey: claim.key,
    });
  } catch (error: unknown) {
    const failure = toFailure('INBOUND_WEBHOOK_PROCESSING_FAILED', provider, {
      reason: error instanceof Error ? error.message : 'Unknown error',
    });

    console.error('WEBHOOK_ERROR:', failure);
    return NextResponse.json({ success: false, error: failure }, { status: 500 });
  }
}
