
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
 * Continuously monitors user signals and generates high-clearance alerts.
 * This service runs exclusively on the server.
 */

export interface ProactiveEvent {
  title: string;
  explanation: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  type: 'trial' | 'price_increase' | 'duplicate' | 'optimization';
  impact: number;
  analysisId?: string;
}

/**
 * Main scan entry point. Analyzes new data and creates alerts if thresholds met.
 */
export async function scanForSignals(userId: string, sourceText: string, analysisId?: string) {
  if (!userId || !sourceText) return;

  const { firestore: db } = initializeFirebase();
  if (!db) return;

  try {
    console.log(`[PROACTIVE] Initiating scan for User ${userId}...`);

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are the Proactive Intelligence Engine. 
          Analyze the input for:
          1. Upcoming trial endings (dates).
          2. Price increases in recurring bills.
          3. Duplicate charges for same service.
          4. Extreme savings opportunities (over $20).

          Return ONLY JSON:
          {
            "detected": boolean,
            "events": [
              {
                "title": "Short Header",
                "explanation": "Brief context",
                "urgency": "low|medium|high|urgent",
                "type": "trial|price_increase|duplicate|optimization",
                "impact": number (estimated monthly loss/gain)
              }
            ]
          }
          Only set detected: true if the event is high-confidence and actionable.`
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
        // Deduplication: Don't create same alert twice
        const q = query(alertsRef, where('title', '==', event.title), where('isDismissed', '==', false), limit(1));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          await addDoc(alertsRef, {
            ...event,
            userId,
            analysisId: analysisId || null,
            isDismissed: false,
            createdAt: serverTimestamp(),
            actionLabel: event.type === 'trial' ? 'Cancel Trial' : 'Resolve Leak'
          });
          console.log(`[PROACTIVE] Alert generated: ${event.title}`);
        }
      }
    }
  } catch (err) {
    console.error('[PROACTIVE] Scan failure:', err);
  }
}

/**
 * Fetches active, high-priority signals for the UI.
 */
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
