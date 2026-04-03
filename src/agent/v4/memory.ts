import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Memory Agent: Safe long-term context management.
 */

export async function fetchMemory(userId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId) return null;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const snap = await getDoc(memoryRef);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export async function updateMemory(userId: string, context: any) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || !context.memoryUpdates) return;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    await setDoc(memoryRef, {
      ...context.memoryUpdates,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("[MEMORY] Update failed:", e);
  }
}
