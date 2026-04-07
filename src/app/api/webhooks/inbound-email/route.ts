export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { runAgentV6 } from '@/agent/v6/orchestrator';
import { scanForSignals } from '@/services/proactive-service';

/**
 * @fileOverview Inbound Email Webhook.
 * Maps incoming magic-forwarded emails to UserProfiles via inboundEmailAddress.
 * Now triggers Engine V6.1 for deep analysis.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    const toAddress = payload.To || payload.to || '';
    const subject = (payload.Subject || payload.subject || 'Intelligence Ingestion').trim();
    const body = (payload.TextBody || payload.text || payload.body || '').trim();
    const fromAddress = payload.From || payload.from || 'Unknown Source';

    if (!toAddress) return NextResponse.json({ error: 'Protocol error: Missing recipient' }, { status: 400 });

    const { firestore } = initializeFirebase();
    if (!firestore) throw new Error("Database offline.");

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const snap = await getDocs(q);

    if (snap.empty) {
      console.warn(`[WEBHOOK] Ingestion failed: No UserProfile matched address ${toAddress}`);
      return NextResponse.json({ error: 'Identity mismatch' }, { status: 404 });
    }

    const userDoc = snap.docs[0];
    const userId = userDoc.id;

    const inboxRef = collection(firestore, 'users', userId, 'inbox');
    await addDoc(inboxRef, {
      userId,
      subject,
      body,
      from: fromAddress,
      receivedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      source: 'webhook'
    });

    console.log(`[WEBHOOK] Initializing Agent v6.1 for User ${userId}...`);
    const { stream, metadata } = await runAgentV6(
      `Autonomous Inbound Audit: [Subject: ${subject}] [Content: ${body}]`,
      userId,
      [] // Static history for webhooks
    );

    // Consume stream for database persistence
    let assistantContent = "";
    for await (const chunk of stream) {
      assistantContent += chunk.choices[0]?.delta?.content || "";
    }

    const analysesRef = collection(firestore, 'users', userId, 'analyses');
    const analysisDoc = await addDoc(analysesRef, {
      userId,
      source: 'email',
      title: metadata.intent.toUpperCase() + ": " + subject,
      summary: assistantContent,
      estimatedMonthlySavings: metadata.structuredData?.estimatedMonthlySavings || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      createdAt: serverTimestamp(),
    });

    // TRIGGER PROACTIVE INTELLIGENCE SCAN (Server-side call)
    scanForSignals(userId, `Subject: ${subject}\n\n${body}`, analysisDoc.id);

    return NextResponse.json({ 
      success: true, 
      intent: metadata.intent,
      operationId: userId.slice(0, 8)
    });
  } catch (error: any) {
    console.error('[WEBHOOK_CRITICAL]:', error.message);
    return NextResponse.json({ error: 'Internal sync failure' }, { status: 500 });
  }
}
