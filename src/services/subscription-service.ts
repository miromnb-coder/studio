export type UserPlan = 'FREE' | 'PRO';

export const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 12 },
  PRO: { dailyAgentRuns: 500 },
};

type UsageSnapshot = {
  agentRuns: number;
  dateKey: string;
};

const usageByUser = new Map<string, UsageSnapshot>();
const planByUser = new Map<string, UserPlan>();

const utcDateKey = () => new Date().toISOString().slice(0, 10);

const getUsage = (userId: string): UsageSnapshot => {
  const existing = usageByUser.get(userId);
  const today = utcDateKey();
  if (!existing || existing.dateKey !== today) {
    const next = { agentRuns: 0, dateKey: today };
    usageByUser.set(userId, next);
    return next;
  }
  return existing;
};

export class SubscriptionService {
  static async getUserStatus(_firestore: unknown, userId: string): Promise<{ plan: UserPlan; usage: { agentRuns: number } }> {
    const usage = getUsage(userId);
    const plan = planByUser.get(userId) ?? 'FREE';
    return { plan, usage: { agentRuns: usage.agentRuns } };
  }

  static async incrementUsage(_firestore: unknown, userId: string): Promise<void> {
    const usage = getUsage(userId);
    usage.agentRuns += 1;
    usageByUser.set(userId, usage);
  }

  static async updatePlan(_firestore: unknown, userId: string, plan: UserPlan): Promise<boolean> {
    planByUser.set(userId, plan);
    return true;
  }
}

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
