import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { logMemoryAuditRejections, sanitizeMemoryPayload } from '@/services/memory-sanitizer';

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
  if (!firestore || !userId || !context?.memoryUpdates) return;

  const sanitizedResult = sanitizeMemoryPayload(context.memoryUpdates);
  logMemoryAuditRejections('agent.v4', sanitizedResult.rejectedKeys);

  if (!sanitizedResult.isValid) {
    console.warn('[MEMORY] Rejected invalid memoryUpdates payload shape:', sanitizedResult.invalidReasons);
    return;
  }

  if (!Object.keys(sanitizedResult.sanitized).length) return;

  try {
    const memoryRef = doc(firestore, 'users', userId, 'memory', 'main');
    await setDoc(memoryRef, {
      ...sanitizedResult.sanitized,
      lastUpdated: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("[MEMORY] Update failed:", e);
  }
}
