import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const referralCode =
      typeof body?.referralCode === 'string' ? body.referralCode.trim() : '';

    if (!referralCode) {
      return NextResponse.json(
        { error: 'INVALID_REFERRAL_CODE' },
        { status: 400 },
      );
    }

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

    const referredUserId = user.id;

    const { data: refProfile, error: refProfileError } = await supabase
      .from('referral_profiles')
      .select('user_id, referral_code')
      .eq('referral_code', referralCode)
      .maybeSingle();

    if (refProfileError || !refProfile) {
      return NextResponse.json(
        { error: 'REFERRAL_NOT_FOUND' },
        { status: 404 },
      );
    }

    if (refProfile.user_id === referredUserId) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'SELF_REFERRAL_BLOCKED',
      });
    }

    const { data: existingEvent } = await supabase
      .from('referral_events')
      .select('id')
      .eq('referred_user_id', referredUserId)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: 'ALREADY_CLAIMED',
      });
    }

    const rewardCredits = 100;

    const { error: insertError } = await supabase
      .from('referral_events')
      .insert({
        referrer_user_id: refProfile.user_id,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: 'completed',
        reward_credits: rewardCredits,
      });

    if (insertError) {
      console.error('REFERRAL_EVENT_INSERT_ERROR', insertError);
      return NextResponse.json(
        { error: 'REFERRAL_CLAIM_FAILED' },
        { status: 500 },
      );
    }

    const { data: billingProfile } = await supabase
      .from('user_billing_profiles')
      .select('credits')
      .eq('user_id', refProfile.user_id)
      .maybeSingle();

    const nextCredits = Number(billingProfile?.credits ?? 0) + rewardCredits;

    const { error: billingError } = await supabase
      .from('user_billing_profiles')
      .upsert(
        {
          user_id: refProfile.user_id,
          credits: nextCredits,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (billingError) {
      console.error('REFERRAL_BILLING_UPDATE_ERROR', billingError);
      return NextResponse.json(
        { error: 'REFERRAL_REWARD_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      rewardCredits,
    });
  } catch (error) {
    console.error('REFERRAL_CLAIM_ROUTE_ERROR', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
