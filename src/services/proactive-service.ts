'use server';

import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { groq } from '@/ai/groq';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Proactive AI Intelligence Service.
 * Exclusively uses Groq Llama 3.3 for signal analysis.
 */

export interface ProactiveEvent {
  title: string;
  explanation: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  type: 'trial' | 'price_increase' | 'duplicate' | 'optimization';
  impact: number;
  analysisId?: string;
}

export async function scanForSignals(userId: string, sourceText: string, analysisId?: string) {
  if (!userId || !sourceText) return;

  const { firestore: db } = initializeFirebase();
  if (!db) return;

  try {
    console.log(`[PROACTIVE] Initiating Groq scan for User ${userId}...`);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the Proactive Intelligence Engine powered by Groq. 
          Analyze the input for:
          1. Upcoming trial endings.
          2. Price increases in recurring bills.
          3. Duplicate charges.
          4. Extreme savings opportunities.

          Return ONLY JSON:
          {
            "detected": boolean,
            "events": [
              {
                "title": "Header",
                "explanation": "Context",
                "urgency": "low|medium|high|urgent",
                "type": "trial|price_increase|duplicate|optimization",
                "impact": number,
                "suggestedAction": "Clear instruction"
              }
            ]
          }`
        },
        { role: 'user', content: sourceText }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"detected": false}');

    if (result.detected && result.events?.length > 0) {
      const alertsRef = collection(db, 'users', userId, 'alerts');
      
      for (const event of result.events) {
        const q = query(alertsRef, where('title', '==', event.title), where('isDismissed', '==', false), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(alertsRef, {
            ...event,
            userId,
            analysisId: analysisId || null,
            isDismissed: false,
            createdAt: serverTimestamp(),
            actionLabel: event.suggestedAction || 'Resolve Signal'
          });
          console.log(`[PROACTIVE] Groq Alert generated: ${event.title}`);
        }
      }
    }
  } catch (err) {
    console.error('[PROACTIVE] Groq Scan failure:', err);
  }
}

export async function getActiveAlerts(userId: string) {
  const { firestore: db } = initializeFirebase();
  if (!db) return [];

  const q = query(
    collection(db, 'users', userId, 'alerts'),
    where('isDismissed', '==', false),
    orderBy('createdAt', 'desc'),
    limit(5)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
