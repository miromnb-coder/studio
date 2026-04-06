import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Memory Engine v6: Hierarchical memory with episodic and semantic capabilities.
 */

export interface AgentMemory {
  userId: string;
  goals: string[];
  preferences: string[];
  behaviorSummary: string;
  semanticMemory: string[]; // Long-term, generalized knowledge
  lastUpdated: any;
}

export interface EpisodicEvent {
  timestamp: any;
  input: string;
  action: string;
  observation: any;
  reflection?: string;
}

export async function fetchMemory(userId: string): Promise<AgentMemory | null> {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous') return null;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const snap = await getDoc(memoryRef);
    return snap.exists() ? snap.data() as AgentMemory : null;
  } catch (e) {
    console.error('[MEMORY_V6] Fetch main memory failed:', e);
    return null;
  }
}

export async function updateMemory(userId: string, memoryUpdates: Partial<AgentMemory>) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous' || !memoryUpdates) return;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const currentMemory = await fetchMemory(userId);

    const dataToSave: AgentMemory = {
      userId,
      goals: Array.from(new Set([...(currentMemory?.goals || []), ...(memoryUpdates.goals || [])])),
      preferences: Array.from(new Set([...(currentMemory?.preferences || []), ...(memoryUpdates.preferences || [])])),
      behaviorSummary: memoryUpdates.behaviorSummary || currentMemory?.behaviorSummary || 'Passive intelligence gathering in progress.',
      semanticMemory: Array.from(new Set([...(currentMemory?.semanticMemory || []), ...(memoryUpdates.semanticMemory || [])])),
      lastUpdated: serverTimestamp(),
    };

    await setDoc(memoryRef, dataToSave, { merge: true });
  } catch (e) {
    console.error('[MEMORY_V6] Update main memory failed:', e);
  }
}

export async function addEpisodicEvent(userId: string, event: Omit<EpisodicEvent, 'timestamp'>) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous') return;

  try {
    const eventsRef = collection(firestore, 'users', userId, 'episodic_memory');
    await addDoc(eventsRef, {
      ...event,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error('[MEMORY_V6] Add episodic event failed:', e);
  }
}

export async function fetchRecentEpisodicEvents(userId: string, limitCount: number = 5): Promise<EpisodicEvent[]> {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous') return [];

  try {
    const eventsRef = collection(firestore, 'users', userId, 'episodic_memory');
    const q = query(eventsRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data() as EpisodicEvent);
  } catch (e) {
    console.error('[MEMORY_V6] Fetch episodic events failed:', e);
    return [];
  }
}

export async function summarizeEpisodicMemory(userId: string, events: EpisodicEvent[]): Promise<string> {
  // This would typically involve an LLM call to summarize events into semantic memory
  // For now, a simple concatenation
  return events.map(event => `Input: ${event.input}, Action: ${event.action}, Observation: ${JSON.stringify(event.observation)}`).join('\n');
}
