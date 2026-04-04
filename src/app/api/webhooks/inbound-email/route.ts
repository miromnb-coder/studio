export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { runAgent } from '@/agent/agent';

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

    // Find UserProfile by magic forwarding address
    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const userId = querySnapshot.docs[0].id;

    // Log the ingestion
    await addDoc(collection(firestore, 'users', userId, 'inbox'), {
      userId,
      subject,
      body,
      from: fromAddress,
      receivedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    // Execute Agent v3 Pipeline
    console.log(`WEBHOOK_INGEST: Processing email from ${fromAddress}...`);
    const agentResult = await runAgent(
      `Email Audit Request: Subject: ${subject}\n\nContent: ${body}`,
      userId
    );
    const analysisData = ((agentResult.data as any)?.data ?? agentResult.data) as any;

    // Store the analysis
    await addDoc(collection(firestore, 'users', userId, 'analyses'), {
      userId,
      source: 'email',
      title: agentResult.data?.title || subject,
      summary: agentResult.content,
      estimatedMonthlySavings: analysisData?.savingsEstimate || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      createdAt: serverTimestamp(),
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
