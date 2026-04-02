
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

/**
 * @fileOverview Inbound Email Webhook Handler.
 * Processes emails as internal server-side tasks to avoid leaking AI logic to clients.
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

    const usersRef = collection(firestore, 'users');
    const q = query(usersRef, where('inboundEmailAddress', '==', toAddress));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`No user found for inbound address: ${toAddress}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const cleanedBody = body
      .split('\n')
      .filter((line: string) => !line.trim().startsWith('>') && !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    await addDoc(collection(firestore, 'users', userId, 'inbox'), {
      userId,
      subject,
      body: cleanedBody,
      from: fromAddress,
      receivedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    });

    // Run analysis directly using the server action internally
    const analysisResult = await analyzeFinancialDocument({
      documentText: `Subject: ${subject}\n\n${cleanedBody}`,
    });

    const analysesRef = collection(firestore, 'users', userId, 'analyses');
    const analysisDoc = await addDoc(analysesRef, {
      userId,
      source: 'email',
      title: analysisResult.title,
      summary: analysisResult.summary,
      estimatedMonthlySavings: analysisResult.savingsEstimate,
      analysisDate: new Date().toISOString(),
      status: 'completed',
      inputMethod: 'email',
      inputContent: cleanedBody,
      beforeComparison: JSON.stringify(analysisResult.beforeAfterComparison),
      afterComparison: JSON.stringify(analysisResult.beforeAfterComparison),
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

    return NextResponse.json({ success: true, analysisId: analysisDoc.id });
  } catch (error: any) {
    console.error('Inbound Email Webhook Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
