import { createSupabaseServerAdmin } from './supabase-server';
import { EMPTY_USAGE_BUCKET, getUsageMonthId, type UsageBucket } from './usage';
import type { PlanId } from './plans';

export type UserBillingProfile = {
  user_id: string;
  plan: PlanId;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
};

export async function getUserBillingProfile(userId: string): Promise<UserBillingProfile> {
  const supabase = createSupabaseServerAdmin();

  const { data, error } = await supabase
    .from('user_billing_profiles')
    .select('user_id, plan, stripe_customer_id, stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return {
      user_id: userId,
      plan: 'free',
      stripe_customer_id: null,
      stripe_subscription_id: null,
    };
  }

  return {
    user_id: data.user_id,
    plan: (data.plan as PlanId) ?? 'free',
    stripe_customer_id: data.stripe_customer_id,
    stripe_subscription_id: data.stripe_subscription_id,
  };
}

export async function getCurrentUsage(userId: string): Promise<UsageBucket> {
  const supabase = createSupabaseServerAdmin();
  const month_id = getUsageMonthId();

  const { data, error } = await supabase
    .from('user_usage_monthly')
    .select(
      'messages_month, agent_runs_month, file_analyses_month, automations_current',
    )
    .eq('user_id', userId)
    .eq('month_id', month_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return EMPTY_USAGE_BUCKET;
  }

  return {
    messages_month: Number(data.messages_month ?? 0),
    agent_runs_month: Number(data.agent_runs_month ?? 0),
    file_analyses_month: Number(data.file_analyses_month ?? 0),
    automations_current: Number(data.automations_current ?? 0),
  };
}

export async function incrementUsage(
  userId: string,
  updates: Partial<Record<keyof UsageBucket, number>>,
): Promise<void> {
  const supabase = createSupabaseServerAdmin();
  const month_id = getUsageMonthId();

  const current = await getCurrentUsage(userId);

  const payload = {
    user_id: userId,
    month_id,
    messages_month: current.messages_month + (updates.messages_month ?? 0),
    agent_runs_month: current.agent_runs_month + (updates.agent_runs_month ?? 0),
    file_analyses_month:
      current.file_analyses_month + (updates.file_analyses_month ?? 0),
    automations_current:
      current.automations_current + (updates.automations_current ?? 0),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('user_usage_monthly')
    .upsert(payload, { onConflict: 'user_id,month_id' });

  if (error) {
    throw error;
  }
}

export async function setUserPlan(userId: string, plan: PlanId): Promise<void> {
  const supabase = createSupabaseServerAdmin();

  const { error } = await supabase
    .from('user_billing_profiles')
    .upsert(
      {
        user_id: userId,
        plan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    throw error;
  }
}
