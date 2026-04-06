
/**
 * @fileOverview Service for managing user long-term memory and behavioral intelligence.
 */

import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export interface UserMemory {
  userId: string;
  goals: string[];
  subscriptions: string[];
  preferences: string[];
  behaviorSummary: string;
  lastUpdated: any;
}

export class MemoryService {
  /**
   * Retrieves the main memory profile for a user.
   */
  static async getMemory(db: Firestore, userId: string): Promise<UserMemory | null> {
    try {
      const memoryRef = doc(db, 'users', userId, 'memory', 'main');
      const snap = await getDoc(memoryRef);
      if (snap.exists()) {
        return snap.data() as UserMemory;
      }
      return null;
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/memory/main`,
        operation: 'get',
      }));
      return null;
    }
  }

  /**
   * Initializes or updates memory with new intelligence findings.
   */
  static async updateMemory(db: Firestore, userId: string, updates: Partial<UserMemory>) {
    try {
      const memoryRef = doc(db, 'users', userId, 'memory', 'main');
      const currentMemory = await this.getMemory(db, userId);

      const dataToSave = {
        userId,
        goals: Array.from(new Set([...(currentMemory?.goals || []), ...(updates.goals || [])])),
        preferences: Array.from(new Set([...(currentMemory?.preferences || []), ...(updates.preferences || [])])),
        subscriptions: Array.from(new Set([...(currentMemory?.subscriptions || []), ...(updates.subscriptions || [])])),
        behaviorSummary: updates.behaviorSummary || currentMemory?.behaviorSummary || 'Passive intelligence gathering in progress.',
        lastUpdated: serverTimestamp(),
      };

      await setDoc(memoryRef, dataToSave, { merge: true });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/memory/main`,
        operation: 'write',
        requestResourceData: updates,
      }));
    }
  }

  /**
   * Resets user memory to default state.
   */
  static async resetMemory(db: Firestore, userId: string) {
    try {
      const memoryRef = doc(db, 'users', userId, 'memory', 'main');
      await setDoc(memoryRef, {
        userId,
        goals: [],
        preferences: [],
        subscriptions: [],
        behaviorSummary: "Passive intelligence gathering reset.",
        lastUpdated: serverTimestamp()
      });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}/memory/main`,
        operation: 'write',
      }));
    }
  }
}
