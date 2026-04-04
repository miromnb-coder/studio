import { initializeFirebase } from '@/firebase';
import { getLongTermMemory, upsertLongTermMemory } from '@/data/firestore';

/**
 * @fileOverview Memory Agent: Safe long-term context management.
 */

export async function fetchMemory(userId: string) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId) return null;

  try {
    return await getLongTermMemory(firestore, userId);
  } catch {
    return null;
  }
}

export async function updateMemory(userId: string, context: any) {
  const { firestore } = initializeFirebase();
  if (!firestore || !userId || !context.memoryUpdates) return;

  try {
    await upsertLongTermMemory(firestore, userId, context.memoryUpdates);
  } catch (e) {
    console.error('[MEMORY] Update failed:', e);
  }
}
