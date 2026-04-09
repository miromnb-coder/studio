import type { Firestore } from 'firebase/firestore';
import { doc, getDoc, runTransaction, setDoc } from 'firebase/firestore';

export type UserPlan = 'FREE' | 'PREMIUM';

export const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 10 },
  PREMIUM: { dailyAgentRuns: 1000 },
};

type UsageSnapshot = {
  agentRuns: number;
  lastResetDate: string;
};

const todayKey = () => new Date().toISOString().slice(0, 10);

const normalizePlan = (plan: string | null | undefined): UserPlan => {
  const value = (plan || 'FREE').toUpperCase();
  if (value === 'PREMIUM' || value === 'PRO') return 'PREMIUM';
  return 'FREE';
};

const defaultUsage = (): UsageSnapshot => ({
  agentRuns: 0,
  lastResetDate: todayKey(),
});

const usageDocRef = (firestore: Firestore, userId: string) => doc(firestore, 'users', userId, 'usage', 'daily');
const userDocRef = (firestore: Firestore, userId: string) => doc(firestore, 'users', userId);

export async function getUserSubscription() {
  return {
    plan: 'free',
    active: false,
    status: 'inactive',
  };
}

export async function hasProAccess() {
  return false;
}

export async function createCheckoutSession() {
  return {
    ok: false,
    skipped: true,
    reason: 'subscription-service not configured',
    url: null,
  };
}

export async function handleStripeWebhook() {
  return {
    ok: false,
    skipped: true,
    reason: 'subscription-service not configured',
  };
}

export class SubscriptionService {
  static async getUserStatus(firestore: Firestore, userId: string): Promise<{ plan: UserPlan; usage: UsageSnapshot }> {
    const [userSnap, usageSnap] = await Promise.all([getDoc(userDocRef(firestore, userId)), getDoc(usageDocRef(firestore, userId))]);

    const plan = normalizePlan(userSnap.exists() ? (userSnap.data()?.plan as string | undefined) : 'FREE');

    const usageData = usageSnap.exists() ? usageSnap.data() : null;
    const nextUsage: UsageSnapshot = {
      agentRuns: typeof usageData?.agentRuns === 'number' ? usageData.agentRuns : 0,
      lastResetDate: typeof usageData?.lastResetDate === 'string' ? usageData.lastResetDate : todayKey(),
    };

    if (nextUsage.lastResetDate !== todayKey()) {
      const resetUsage = defaultUsage();
      await setDoc(usageDocRef(firestore, userId), resetUsage, { merge: true });
      return { plan, usage: resetUsage };
    }

    return { plan, usage: nextUsage };
  }

  static async incrementUsage(firestore: Firestore, userId: string): Promise<UsageSnapshot> {
    const usageRef = usageDocRef(firestore, userId);
    const snapshot = await runTransaction(firestore, async (transaction) => {
      const existing = await transaction.get(usageRef);
      const current = existing.exists() ? existing.data() : null;
      const lastResetDate = typeof current?.lastResetDate === 'string' ? current.lastResetDate : todayKey();
      const shouldReset = lastResetDate !== todayKey();
      const currentRuns = shouldReset ? 0 : typeof current?.agentRuns === 'number' ? current.agentRuns : 0;
      const next: UsageSnapshot = {
        agentRuns: currentRuns + 1,
        lastResetDate: todayKey(),
      };

      transaction.set(usageRef, next, { merge: true });
      return next;
    });

    return snapshot;
  }

  static async updatePlan(firestore: Firestore, userId: string, plan: UserPlan): Promise<boolean> {
    const normalized = normalizePlan(plan);
    await setDoc(
      userDocRef(firestore, userId),
      {
        plan: normalized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return true;
  }
}
