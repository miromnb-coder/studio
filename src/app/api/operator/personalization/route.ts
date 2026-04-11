import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { buildPersonalizationSnapshot, getUserProfileIntelligence } from '@/lib/operator/personalization';

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

    const [profileIntelligence, outcomesRes, financeProfileRes] = await Promise.all([
      getUserProfileIntelligence(supabase, user.id),
      supabase
        .from('recommendation_outcomes')
        .select('status,updated_at,recommended_action')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase.from('finance_profiles').select('active_subscriptions,total_monthly_cost,estimated_savings').eq('user_id', user.id).maybeSingle(),
    ]);

    if (outcomesRes.error) throw outcomesRes.error;
    if (financeProfileRes.error) throw financeProfileRes.error;

    const snapshot = buildPersonalizationSnapshot({
      profile: profileIntelligence,
      outcomes: (outcomesRes.data || []) as Array<Record<string, unknown>>,
      financeProfile: (financeProfileRes.data || null) as Record<string, unknown> | null,
    });

    return NextResponse.json({ profileIntelligence, personalization: snapshot });
  } catch (error) {
    console.error('OPERATOR_PERSONALIZATION_ERROR', error);
    return NextResponse.json({ error: 'PERSONALIZATION_FETCH_FAILED' }, { status: 500 });
  }
}
