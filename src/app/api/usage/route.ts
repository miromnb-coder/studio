import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type UserPlan = 'FREE' | 'PREMIUM';
const PLAN_LIMITS: Record<UserPlan, { dailyAgentRuns: number }> = {
  FREE: { dailyAgentRuns: 10 },
  PREMIUM: { dailyAgentRuns: 1000 },
};

function normalizePlan(value: unknown): UserPlan {
  const upper = String(value || 'FREE').toUpperCase();
  return upper === 'PREMIUM' || upper === 'PRO' ? 'PREMIUM' : 'FREE';
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const usageDate = new Date().toISOString().slice(0, 10);

    const [profileResult, usageResult] = await Promise.all([
      supabase.from('profiles').select('plan').eq('id', userId).maybeSingle(),
      supabase
        .from('usage_daily')
        .select('agent_runs,premium_action_runs,usage_date')
        .eq('user_id', userId)
        .eq('usage_date', usageDate)
        .maybeSingle(),
    ]);

    const plan = normalizePlan(profileResult.data?.plan);
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
    const agentRuns = typeof usageResult.data?.agent_runs === 'number' ? usageResult.data.agent_runs : 0;

    return NextResponse.json({
      plan,
      usage: {
        agentRuns,
        premiumActionRuns:
          typeof usageResult.data?.premium_action_runs === 'number'
            ? usageResult.data.premium_action_runs
            : 0,
        limit: limits.dailyAgentRuns,
        remaining: Math.max(limits.dailyAgentRuns - agentRuns, 0),
        lastResetDate: usageDate,
      },
    });
  } catch (error) {
    console.error('USAGE_ROUTE_ERROR', error);
    return NextResponse.json({ error: 'USAGE_FETCH_FAILED' }, { status: 500 });
  }
}
