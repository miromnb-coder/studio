/**
 * @fileOverview Service for managing user plans, usage limits, and subscriptions.
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

export type UserPlan = 'FREE' | 'PREMIUM';

export interface UsageStats {
  agentRuns: number;
  toolsUsed: number;
  lastReset: string;
}

export const PLAN_LIMITS = {
  FREE: {
    dailyAgentRuns: 5,
    hasAdvancedTools: false,
    memoryRetentionDays: 7
  },
  PREMIUM: {
    dailyAgentRuns: 9999,
    hasAdvancedTools: true,
    memoryRetentionDays: 365
  }
};

export class SubscriptionService {
  /**
   * Fetches the user's current plan and daily usage stats.
   */
  static async getUserStatus(db: Firestore, userId: string) {
    if (!userId || userId === 'system_anonymous') {
      return { plan: 'FREE' as UserPlan, usage: { agentRuns: 0 } };
    }

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      const plan: UserPlan = userData?.plan || 'FREE';

      const today = new Date().toISOString().split('T')[0];
      const usageRef = doc(db, 'users', userId, 'usage', today);
      const usageSnap = await getDoc(usageRef);
      const usageData = usageSnap.data();

      return {
        plan,
        usage: {
          agentRuns: usageData?.agentRuns || 0,
          limit: PLAN_LIMITS[plan].dailyAgentRuns
        },
        isPremium: plan === 'PREMIUM'
      };
    } catch (e) {
      console.error("[SUBSCRIPTION] Status fetch failed", e);
      return { plan: 'FREE' as UserPlan, usage: { agentRuns: 0, limit: 5 } };
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
   * Simulates a Stripe checkout session.
   */
  static async upgradeToPremium(db: Firestore, userId: string) {
    if (!userId) return false;
    
    // In a real app, this would redirect to Stripe
    // For the prototype, we update the plan directly
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        plan: 'PREMIUM',
        upgradedAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
