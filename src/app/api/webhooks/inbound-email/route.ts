
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

/**
 * @fileOverview Inbound Email Webhook Handler using Groq directly.
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
      throw new Error("Firestore not initialized in webhook context.");
    }

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No user found for inbound address: ${toAddress}`);
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

    const analysisResult = await analyzeFinancialDocument({
      documentText: `Subject: ${subject}\nFrom: ${fromAddress}\n\n${body}`,
      source: 'email'
    });

    const analysesRef = collection(firestore, 'users', userId, 'analyses');
    const analysisDoc = await addDoc(analysesRef, {
      userId,
      source: 'email',
      title: analysisResult.title,
      summary: analysisResult.summary,
      estimatedMonthlySavings: analysisResult.savingsEstimate || 0,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: body,
      beforeComparison: JSON.stringify(analysisResult.beforeAfterComparison),
      createdAt: serverTimestamp(),
    });

    const itemsRef = collection(firestore, 'users', userId, 'analyses', analysisDoc.id, 'detected_items');
    for (const item of (analysisResult.detectedItems || [])) {
      await addDoc(itemsRef, {
        ...item,
        userId,
        analysisId: analysisDoc.id,
        status: 'active',
        createdAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ 
      success: true, 
      analysisId: analysisDoc.id, 
      findings: analysisResult.detectedItems?.length || 0 
    });
  } catch (error: any) {
    console.error('Inbound Email Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
