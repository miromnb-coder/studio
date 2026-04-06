
/**
 * @fileOverview Service for managing user plans, usage limits, and subscriptions.
 * Centered source of truth for all monetization logic.
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp, 
  Firestore 
} from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export type UserPlan = 'FREE' | 'STARTER' | 'PREMIUM';

export interface UsageStats {
  agentRuns: number;
  toolsUsed: number;
  lastReset: string;
}

export const PLAN_LIMITS = {
  FREE: {
    dailyAgentRuns: 5,
    hasAdvancedTools: false,
    memoryRetentionDays: 7,
    price: 0,
    label: 'Free'
  },
  STARTER: {
    dailyAgentRuns: 20,
    hasAdvancedTools: true,
    memoryRetentionDays: 30,
    price: 9,
    label: 'Starter'
  },
  PREMIUM: {
    dailyAgentRuns: 9999, // Practically unlimited
    hasAdvancedTools: true,
    memoryRetentionDays: 365,
    price: 19,
    label: 'Ultra'
  }
};

export class SubscriptionService {
  /**
   * Fetches the user's current plan and daily usage stats.
   */
  static async getUserStatus(db: Firestore, userId: string) {
    if (!userId || userId === 'system_anonymous') {
      return { 
        plan: 'FREE' as UserPlan, 
        usage: { agentRuns: 0, limit: 5 },
        isPremium: false,
        label: 'Guest'
      };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}`,
          operation: 'get',
        }));
        throw err;
      });
      
      const userData = userSnap.data();
      const plan: UserPlan = (userData?.plan || 'FREE').toUpperCase() as UserPlan;

      // Plan limits from config
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'users', userId, 'usage', today);
      const usageSnap = await getDoc(usageRef).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}/usage/${today}`,
          operation: 'get',
        }));
        throw err;
      });
      
      const usageData = usageSnap.data();

      return {
        plan,
        usage: {
          agentRuns: usageData?.agentRuns || 0,
          limit: limits.dailyAgentRuns
        },
        isPremium: plan === 'PREMIUM' || plan === 'STARTER',
        label: limits.label,
        limits
      };
    } catch (e: any) {
      // General fallback if not handled by inner catches
      return { 
        plan: 'FREE' as UserPlan, 
        usage: { agentRuns: 0, limit: 5 },
        isPremium: false,
        label: 'Syncing...'
      };
    }
  }

  /**
   * Increments the daily usage counter for a user.
   */
  static async incrementUsage(db: Firestore, userId: string) {
    if (!userId || userId === 'system_anonymous') return;

    const today = new Date().toISOString().split('T')[0];
    const usageRef = doc(db, 'users', userId, 'usage', today);

    setDoc(usageRef, {
      agentRuns: increment(1),
      lastUpdated: serverTimestamp()
    }, { merge: true }).catch(async (err) => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: usageRef.path,
        operation: 'write',
        requestResourceData: { agentRuns: 'increment' }
      }));
    });
  }

  /**
   * Updates user plan in database. (Internal/Webhook/Simulated use)
   */
  static async updatePlan(db: Firestore, userId: string, plan: UserPlan) {
    if (!userId) return false;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan: plan,
        upgradedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalSavedOverall: increment(0), // Ensure field exists
      });
      return true;
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `users/${userId}`,
        operation: 'update',
        requestResourceData: { plan }
      }));
      return false;
    }
  }

  /**
   * Quick upgrade method for testing or legacy calls.
   */
  static async upgradeToPremium(db: Firestore, userId: string) {
    return this.updatePlan(db, userId, 'PREMIUM');
  }
}
