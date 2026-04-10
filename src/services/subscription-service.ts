import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePlan, todayKey, type UserPlan } from '@/lib/usage/usage';

export type { UserPlan };

export const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 10 },
  PREMIUM: { dailyAgentRuns: 1000 },
};

type UsageSnapshot = {
  agentRuns: number;
  lastResetDate: string;
};

const defaultUsage = (): UsageSnapshot => ({
  agentRuns: 0,
  lastResetDate: todayKey(),
});

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
  static async getUserStatus(supabase: SupabaseClient, userId: string): Promise<{ plan: UserPlan; usage: UsageSnapshot }> {
    const usageDate = todayKey();

    const [profileResult, usageResult] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
      supabase
        .from('usage_daily')
        .select('agent_runs,usage_date')
        .eq('user_id', userId)
        .eq('usage_date', usageDate)
        .maybeSingle(),
    ]);

    if (profileResult.error) {
      console.error('SUPABASE_PROFILE_READ_ERROR:', profileResult.error);
    }

    if (usageResult.error) {
      console.error('SUPABASE_USAGE_READ_ERROR:', usageResult.error);
    }

    return {
      plan: normalizePlan(profileResult.data?.plan),
      usage: {
        agentRuns: typeof usageResult.data?.agent_runs === 'number' ? usageResult.data.agent_runs : 0,
        lastResetDate: usageDate,
      },
    };
  }

  static async incrementUsage(supabase: SupabaseClient, userId: string): Promise<UsageSnapshot> {
    const status = await SubscriptionService.getUserStatus(supabase, userId);
    const nextUsage: UsageSnapshot = {
      agentRuns: status.usage.agentRuns + 1,
      lastResetDate: todayKey(),
    };

    const { error } = await supabase.from('usage_daily').upsert(
      {
        user_id: userId,
        usage_date: nextUsage.lastResetDate,
        agent_runs: nextUsage.agentRuns,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,usage_date' },
    );

    if (error) {
      console.error('SUPABASE_USAGE_UPSERT_ERROR:', error);
      return status.usage;
    }

    return nextUsage;
  }

  static async updatePlan(supabase: SupabaseClient, userId: string, plan: UserPlan): Promise<boolean> {
    const normalized = normalizePlan(plan);

    const { error } = await supabase.from('profiles').upsert(
      {
        id: userId,
        plan: normalized,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

    if (error) {
      console.error('SUPABASE_PLAN_UPSERT_ERROR:', error);
      return false;
    }

    return true;
  }
}
