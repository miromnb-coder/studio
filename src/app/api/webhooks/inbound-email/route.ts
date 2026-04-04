export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { runAgent } from '@/agent/agent';
import { createAnalysis, createInboundEmail, findUserIdByInboundEmail } from '@/data/firestore';

/**
 * @fileOverview Inbound Email Webhook Handler.
 * Integrates directly with the AI Agent v3 Pipeline.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    const toAddress = payload.To || payload.to || '';
    const subject = payload.Subject || payload.subject || 'No Subject';
    const body = payload.TextBody || payload.text || payload.body || '';
    const fromAddress = payload.From || payload.from || 'Unknown';

    if (!toAddress) return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error("Firestore not initialized.");

    const userId = await findUserIdByInboundEmail(firestore, toAddress);
    if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await createInboundEmail(firestore, userId, {
      userId,
      subject,
      body,
      from: fromAddress,
      toAddress,
      receivedAt: new Date().toISOString(),
    });

    // Execute Agent v3 Pipeline
    console.log(`WEBHOOK_INGEST: Processing email from ${fromAddress}...`);
    const agentResult = await runAgent(`Email Audit Request: Subject: ${subject}\n\nContent: ${body}`);

    await createAnalysis(firestore, userId, {
      userId,
      source: 'email',
      title: agentResult.data?.title || subject,
      summary: agentResult.content,
      estimatedMonthlySavings: agentResult.data?.data?.savingsEstimate || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
    });

    return NextResponse.json({ 
      success: true, 
      intent: agentResult.intent,
      mode: agentResult.mode
    });
  } catch (error: any) {
    console.error('WEBHOOK_ERROR:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
