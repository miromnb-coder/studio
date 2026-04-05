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
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const plan: UserPlan = (userData?.plan || 'FREE').toUpperCase() as UserPlan;

      // Plan limits from config
      const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;

      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'users', userId, 'usage', today);
      const usageSnap = await getDoc(usageRef);
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
    } catch (e) {
      console.error("[SUBSCRIPTION] Status fetch failed", e);
      return { 
        plan: 'FREE' as UserPlan, 
        usage: { agentRuns: 0, limit: 5 },
        isPremium: false,
        label: 'Error'
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
    } catch (e) {
      console.error("[SUBSCRIPTION] Usage increment failed", e);
    }
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
    } catch (e) {
      console.error("[SUBSCRIPTION] Plan update failed", e);
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
