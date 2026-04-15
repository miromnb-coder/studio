import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED' },
        { status: 401 },
      );
    }

    const userId = user.id;

    const { data: events, error: eventsError } = await supabase
      .from('referral_events')
      .select('status, reward_credits')
      .eq('referrer_user_id', userId);

    if (eventsError) {
      console.error('REFERRAL_STATS_EVENTS_ERROR', eventsError);
      return NextResponse.json(
        { error: 'REFERRAL_STATS_FAILED' },
        { status: 500 },
      );
    }

    const { data: billingProfile, error: billingError } = await supabase
      .from('user_billing_profiles')
      .select('credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (billingError) {
      console.error('REFERRAL_STATS_BILLING_ERROR', billingError);
      return NextResponse.json(
        { error: 'REFERRAL_STATS_FAILED' },
        { status: 500 },
      );
    }

    const successfulReferrals = (events || []).filter(
      (item) => item.status === 'completed',
    ).length;

    const pendingInvites = (events || []).filter(
      (item) => item.status === 'pending',
    ).length;

    const creditsEarned = Number(billingProfile?.credits ?? 0);

    return NextResponse.json({
      ok: true,
      creditsEarned,
      successfulReferrals,
      pendingInvites,
    });
  } catch (error) {
    console.error('REFERRAL_STATS_ROUTE_ERROR', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
