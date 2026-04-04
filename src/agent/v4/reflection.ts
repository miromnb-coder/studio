import { AgentContext } from './types';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Reflection Agent: Stores safe lessons for future improvement.
 */

export async function reflectOnInteraction(context: AgentContext) {
  const { firestore } = initializeFirebase();
  const userId = context.userId;

  if (!firestore || !userId) {
    return;
  }

  const failureSignals = [
    ...(context.criticFeedback?.issues ?? []),
    ...context.toolResults.filter((result) => !!result.error).map((result) => `${result.action}: ${result.error}`)
  ];

  await addDoc(collection(firestore, 'users', String(userId), 'reflections'), {
    intent: context.intent,
    score: context.criticFeedback?.score ?? null,
    needsRevision: context.criticFeedback?.needs_revision ?? false,
    failureSignals,
    toolCount: context.toolResults.length,
    hasToolFailure: context.toolResults.some((result) => !!result.error),
    inputPreview: context.input.slice(0, 200),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}
