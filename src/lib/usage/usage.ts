export type UserPlan = 'FREE' | 'PREMIUM';

export type UsageSnapshot = {
  agentRuns: number;
  premiumActionRuns: number;
  usageDate: string;
};

export type UsageEnvelope = {
  current: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
  unlimitedReason: 'dev' | 'admin' | null;
};

export const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 10 },
  PREMIUM: { dailyAgentRuns: 1000 },
};

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizePlan(value: unknown): UserPlan {
  const upper = String(value || 'FREE').toUpperCase();
  return upper === 'PREMIUM' || upper === 'PRO' ? 'PREMIUM' : 'FREE';
}

export function isDevUnlimitedMode(): boolean {
  return String(process.env.DEV_UNLIMITED || '').toLowerCase() === 'true';
}

export function isAdminBypass(email: string | null | undefined): boolean {
  if (!email) return false;

  const configured = String(process.env.ADMIN_BYPASS_EMAILS || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (!configured.length) return false;
  return configured.includes(email.toLowerCase());
}

export function toUsageEnvelope(args: {
  plan: UserPlan;
  usage: UsageSnapshot;
  unlimitedReason: 'dev' | 'admin' | null;
}): UsageEnvelope {
  const baseLimit =
    PLAN_LIMITS[args.plan]?.dailyAgentRuns ?? PLAN_LIMITS.FREE.dailyAgentRuns;

  if (args.unlimitedReason) {
    return {
      current: args.usage.agentRuns,
      limit: -1,
      remaining: -1,
      unlimited: true,
      unlimitedReason: args.unlimitedReason,
    };
  }

  return {
    current: args.usage.agentRuns,
    limit: baseLimit,
    remaining: Math.max(baseLimit - args.usage.agentRuns, 0),
    unlimited: false,
    unlimitedReason: null,
  };
}

export async function getUserPlanAndUsage(
  supabase: any,
  userId: string,
): Promise<{
  plan: UserPlan;
  usage: UsageSnapshot;
  email: string | null;
}> {
  const usageDate = todayKey();

  const [profileResult, usageResult, authResult] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
    supabase
      .from('usage_daily')
      .select('agent_runs,premium_action_runs,usage_date')
      .eq('user_id', userId)
      .eq('usage_date', usageDate)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);

  if (profileResult.error) {
    console.error('SUPABASE_PROFILE_READ_ERROR:', profileResult.error);
  }

  if (usageResult.error) {
    console.error('SUPABASE_USAGE_READ_ERROR:', usageResult.error);
  }

  return {
    plan: normalizePlan(profileResult.data?.plan),
    email:
      typeof authResult.data?.user?.email === 'string'
        ? authResult.data.user.email
        : null,
    usage: {
      agentRuns:
        typeof usageResult.data?.agent_runs === 'number'
          ? usageResult.data.agent_runs
          : 0,
      premiumActionRuns:
        typeof usageResult.data?.premium_action_runs === 'number'
          ? usageResult.data.premium_action_runs
          : 0,
      usageDate,
    },
  };
}

export async function incrementUsage(
  supabase: any,
  userId: string,
  currentUsage: UsageSnapshot,
  kind: 'agent' | 'premium_action' = 'agent',
): Promise<UsageSnapshot> {
  const nextUsage: UsageSnapshot = {
    usageDate: currentUsage.usageDate || todayKey(),
    agentRuns: currentUsage.agentRuns,
    premiumActionRuns: currentUsage.premiumActionRuns,
  };

  if (kind === 'premium_action') {
    nextUsage.premiumActionRuns += 1;
  } else {
    nextUsage.agentRuns += 1;
  }

  const payload = {
    user_id: userId,
    usage_date: nextUsage.usageDate,
    agent_runs: nextUsage.agentRuns,
    premium_action_runs: nextUsage.premiumActionRuns,
    updated_at: new Date().toISOString(),
  };

  console.log('Saving to Supabase:', {
    table: 'usage_daily',
    operation: 'upsert',
    data: payload,
  });

  const { error } = await supabase.from('usage_daily').upsert(payload, {
    onConflict: 'user_id,usage_date',
  });

  if (error) {
    console.error('SUPABASE_USAGE_UPSERT_ERROR:', error);
    return currentUsage;
  }

  const usageResult = await supabase
    .from('usage_daily')
    .select('agent_runs,premium_action_runs,usage_date')
    .eq('user_id', userId)
    .eq('usage_date', nextUsage.usageDate)
    .maybeSingle();

  if (usageResult.error) {
    console.error('SUPABASE_USAGE_CONFIRM_READ_ERROR:', usageResult.error);
    return nextUsage;
  }

  return {
    usageDate: nextUsage.usageDate,
    agentRuns:
      typeof usageResult.data?.agent_runs === 'number'
        ? usageResult.data.agent_runs
        : nextUsage.agentRuns,
    premiumActionRuns:
      typeof usageResult.data?.premium_action_runs === 'number'
        ? usageResult.data.premium_action_runs
        : nextUsage.premiumActionRuns,
  };
}

export async function getUserBonusAgentRuns(
  supabase: any,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from('user_bonus_usage')
    .select('bonus_agent_runs')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('BONUS_AGENT_RUNS_FETCH_ERROR:', error);
    return 0;
  }

  return typeof data?.bonus_agent_runs === 'number'
    ? data.bonus_agent_runs
    : 0;
}

export async function consumeOneBonusAgentRun(
  supabase: any,
  userId: string,
): Promise<void> {
  const current = await getUserBonusAgentRuns(supabase, userId);

  if (current <= 0) return;

  const { error } = await supabase.from('user_bonus_usage').upsert(
    {
      user_id: userId,
      bonus_agent_runs: Math.max(0, current - 1),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  if (error) {
    console.error('BONUS_AGENT_RUN_CONSUME_ERROR:', error);
  }
}
