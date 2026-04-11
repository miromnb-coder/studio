import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { buildContinuousOptimizationDigest } from '@/lib/operator/continuous';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const [alertsRes, outcomesRes, financeProfileRes] = await Promise.all([
      supabase.from('operator_alerts').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(60),
      supabase
        .from('recommendation_outcomes')
        .select('status,estimated_monthly_impact,realized_impact,completed_at,updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(120),
      supabase.from('finance_profiles').select('total_monthly_cost,estimated_savings').eq('user_id', user.id).maybeSingle(),
    ]);

    if (alertsRes.error) throw alertsRes.error;
    if (outcomesRes.error) throw outcomesRes.error;
    if (financeProfileRes.error) throw financeProfileRes.error;

    const digest = buildContinuousOptimizationDigest({
      alerts: alertsRes.data || [],
      outcomes: outcomesRes.data || [],
      financeProfile: (financeProfileRes.data || null) as Record<string, unknown> | null,
    });

    return NextResponse.json({ digest });
  } catch (error) {
    console.error('OPERATOR_INTELLIGENCE_ERROR', error);
    return NextResponse.json({ error: 'INTELLIGENCE_FETCH_FAILED' }, { status: 500 });
  }
}
