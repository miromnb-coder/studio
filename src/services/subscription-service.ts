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

export type UserPlan = 'FREE' | 'PRO';

export const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 25 },
  PRO: { dailyAgentRuns: 500 },
};

type UsageSnapshot = {
  agentRuns: number;
};

export class SubscriptionService {
  static async getUserStatus(_firestore: unknown, _userId: string): Promise<{ plan: UserPlan; usage: UsageSnapshot }> {
    return { plan: 'FREE', usage: { agentRuns: 0 } };
  }

  static async incrementUsage(_firestore: unknown, _userId: string): Promise<void> {
    return;
  }

  static async updatePlan(_firestore: unknown, _userId: string, _plan: UserPlan): Promise<boolean> {
    return true;
  }
}
