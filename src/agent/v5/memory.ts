import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Memory Engine v5: Safe synchronization with Firestore.
 */

export async function fetchMemory(userId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous') return null;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    const snap = await getDoc(memoryRef);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export async function updateMemory(userId: string, memoryUpdates: any) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || userId === 'system_anonymous' || !memoryUpdates) return;
  
  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    await setDoc(memoryRef, {
      ...memoryUpdates,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("[MEMORY_V5] Update failed:", e);
  }
}
