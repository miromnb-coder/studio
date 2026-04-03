
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { runAgent } from '@/agent/agent';

/**
 * @fileOverview Inbound Email Webhook Handler using Agent v3.
 */

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    
    const toAddress = payload.To || payload.to || '';
    const subject = payload.Subject || payload.subject || 'No Subject';
    const body = payload.TextBody || payload.text || payload.body || '';
    const fromAddress = payload.From || payload.from || 'Unknown';

    if (!toAddress) {
      return NextResponse.json({ error: 'Missing recipient' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();
    if (!firestore) {
      throw new Error("Firestore not initialized.");
    }

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    await addDoc(collection(firestore, 'users', userId, 'inbox'), {
      userId,
      subject,
      body,
      from: fromAddress,
      receivedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    const agentResult = await runAgent(`Email Analysis Request: Subject: ${subject}\n\n${body}`);

    const analysesRef = collection(firestore, 'users', userId, 'analyses');
    const analysisDoc = await addDoc(analysesRef, {
      userId,
      source: 'email',
      title: subject,
      summary: agentResult.content,
      estimatedMonthlySavings: 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ 
      success: true, 
      analysisId: analysisDoc.id,
      intent: agentResult.intent
    });
  } catch (error: any) {
    console.error('Email Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
