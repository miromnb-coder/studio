/**
 * @fileOverview Service for managing user long-term memory and behavioral intelligence.
 */

import { Firestore } from 'firebase/firestore';
import { getLongTermMemory, upsertLongTermMemory } from '@/data/firestore';

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
      return (await getLongTermMemory(db, userId)) as UserMemory | null;
    } catch (error) {
      console.error('Failed to fetch user memory:', error);
      return null;
    }
  }

  /**
   * Initializes or updates memory with new intelligence findings.
   */
  static async updateMemory(db: Firestore, userId: string, updates: any) {
    try {
      const currentMemory = await this.getMemory(db, userId);

      const dataToSave = {
        goals: Array.from(new Set([...(currentMemory?.goals || []), ...(updates.newGoals || [])])),
        preferences: Array.from(new Set([...(currentMemory?.preferences || []), ...(updates.newPreferences || [])])),
        subscriptions: Array.from(new Set([...(currentMemory?.subscriptions || []), ...(updates.newSubscriptions || [])])),
        behaviorSummary: updates.behaviorSummaryUpdate || currentMemory?.behaviorSummary || 'Passive intelligence gathering in progress.',
      };

      await upsertLongTermMemory(db, userId, dataToSave);
    } catch (error) {
      console.error('Failed to update user memory:', error);
    }
  }
}
