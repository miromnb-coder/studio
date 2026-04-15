import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const REFERRAL_REWARD = {
  type: 'bonus_runs',
  amount: 25,
  label: '+25 bonus runs added',
} as const;

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

    const { error: insertError } = await supabase
      .from('referral_events')
      .insert({
        referrer_user_id: refProfile.user_id,
        referred_user_id: referredUserId,
        referral_code: referralCode,
        status: 'completed',
        reward_type: REFERRAL_REWARD.type,
        reward_amount: REFERRAL_REWARD.amount,
      });

    if (insertError) {
      console.error('REFERRAL_EVENT_INSERT_ERROR', insertError);
      return NextResponse.json(
        { error: 'REFERRAL_CLAIM_FAILED' },
        { status: 500 },
      );
    }

    const { data: bonusRow, error: bonusFetchError } = await supabase
      .from('user_bonus_usage')
      .select('bonus_agent_runs')
      .eq('user_id', refProfile.user_id)
      .maybeSingle();

    if (bonusFetchError) {
      console.error('REFERRAL_BONUS_FETCH_ERROR', bonusFetchError);
      return NextResponse.json(
        { error: 'REFERRAL_REWARD_FAILED' },
        { status: 500 },
      );
    }

    const nextBonusRuns =
      Number(bonusRow?.bonus_agent_runs ?? 0) + REFERRAL_REWARD.amount;

    const { error: bonusUpsertError } = await supabase
      .from('user_bonus_usage')
      .upsert(
        {
          user_id: refProfile.user_id,
          bonus_agent_runs: nextBonusRuns,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );

    if (bonusUpsertError) {
      console.error('REFERRAL_BONUS_UPSERT_ERROR', bonusUpsertError);
      return NextResponse.json(
        { error: 'REFERRAL_REWARD_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      reward: REFERRAL_REWARD,
    });
  } catch (error) {
    console.error('REFERRAL_CLAIM_ROUTE_ERROR', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR' },
      { status: 500 },
    );
  }
}
