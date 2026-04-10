import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getUserPlanAndUsage,
  isAdminBypass,
  isDevUnlimitedMode,
  toUsageEnvelope,
} from '@/lib/usage/usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const supabase = await createSupabaseServerClient();
    const { plan, usage, email } = await getUserPlanAndUsage(supabase, userId);

    const unlimitedReason = isDevUnlimitedMode() ? 'dev' : isAdminBypass(email) ? 'admin' : null;
    const usageEnvelope = toUsageEnvelope({
      plan,
      usage,
      unlimitedReason,
    });

    return NextResponse.json({
      plan,
      usage: {
        agentRuns: usageEnvelope.current,
        limit: usageEnvelope.limit,
        remaining: usageEnvelope.remaining,
        lastResetDate: usage.usageDate,
        unlimited: usageEnvelope.unlimited,
        unlimitedReason: usageEnvelope.unlimitedReason,
      },
    });
  } catch (error) {
    console.error('USAGE_ROUTE_ERROR', error);
    return NextResponse.json({ error: 'USAGE_FETCH_FAILED' }, { status: 500 });
  }
}
