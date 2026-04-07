
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
   * 🔥 AUTO-CREATES PROFILE if missing using proactive setDoc.
   */
  static async getUserStatus(db: Firestore, userId: string) {
    if (!userId || userId === 'system_anonymous') {
      return { 
        plan: 'FREE' as UserPlan, 
        usage: { agentRuns: 0, limit: 5 },
        isPremium: false,
        label: 'Guest',
        limits: PLAN_LIMITS.FREE
      };
    }

    const userRef = doc(db, 'users', userId);
    console.log('[SYNC] Starting sync for profile:', userId);

    try {
      // Proactively ensure the document exists to avoid "permission-denied" on read for new users
      await setDoc(userRef, {
        id: userId,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      // Fallback values if it was JUST created
      const plan: UserPlan = (userData?.plan || 'FREE').toUpperCase() as UserPlan;
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'users', userId, 'usage', today);
      const usageSnap = await getDoc(usageRef);
      const usageData = usageSnap.exists() ? usageSnap.data() : null;

      console.log('[SYNC] Sync complete for:', userId);

      return {
        plan,
        usage: {
          agentRuns: usageData?.agentRuns || 0,
          limit: limits.dailyAgentRuns
        },
        isPremium: plan === 'PREMIUM' || plan === 'STARTER',
        label: userData?.plan === 'PREMIUM' ? 'Ultra' : userData?.plan === 'STARTER' ? 'Starter' : 'Free',
        limits
      };
    } catch (e: any) {
      console.error("[SYNC_ERROR] Error fetching status:", e.message);
      
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}`,
          operation: 'write',
        }));
      }

      // Return a safe fallback to prevent UI lock
      return { 
        plan: 'FREE' as UserPlan, 
        usage: { agentRuns: 0, limit: 5 },
        isPremium: false,
        label: 'Error - Safe Mode',
        limits: PLAN_LIMITS.FREE
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

    try {
      await setDoc(usageRef, {
        agentRuns: increment(1),
        lastUpdated: serverTimestamp()
      }, { merge: true });
    } catch (err: any) {
      if (err.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: usageRef.path,
          operation: 'write',
          requestResourceData: { agentRuns: 'increment' }
        }));
      }
    }
  }

  /**
   * Updates user plan in database.
   */
  static async updatePlan(db: Firestore, userId: string, plan: UserPlan) {
    if (!userId) return false;
    
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan: plan,
        upgradedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        totalSavedOverall: increment(0),
      });
      return true;
    } catch (e: any) {
      if (e.code === 'permission-denied') {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `users/${userId}`,
          operation: 'update',
          requestResourceData: { plan }
        }));
      }
      return false;
    }
  }

  static async upgradeToPremium(db: Firestore, userId: string) {
    return this.updatePlan(db, userId, 'PREMIUM');
  }
}
