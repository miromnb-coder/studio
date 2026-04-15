import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function generateReferralCode(seed?: string) {
  const base = (seed || 'kivo')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8);
  const random = Math.random().toString(36).slice(2, 8);
  return `${base}${random}`;
}

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { error: 'AUTH_REQUIRED', message: 'Please sign in.' },
        { status: 401 },
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('referral_profiles')
      .select('referral_code')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingError) {
      console.error('REFERRAL_FETCH_ERROR', existingError);
      return NextResponse.json(
        { error: 'REFERRAL_FETCH_FAILED', message: 'Could not load referral link.' },
        { status: 500 },
      );
    }

    let referralCode = existing?.referral_code;

    if (!referralCode) {
      const emailPrefix =
        user.email?.split('@')[0]?.slice(0, 8) || 'kivo';

      let created = false;
      let attempts = 0;

      while (!created && attempts < 5) {
        attempts += 1;
        const candidate = generateReferralCode(emailPrefix);

        const { error: insertError } = await supabase
          .from('referral_profiles')
          .insert({
            user_id: user.id,
            referral_code: candidate,
          });

        if (!insertError) {
          referralCode = candidate;
          created = true;
          break;
        }

        if (!String(insertError.message || '').toLowerCase().includes('duplicate')) {
          console.error('REFERRAL_CREATE_ERROR', insertError);
          return NextResponse.json(
            { error: 'REFERRAL_CREATE_FAILED', message: 'Could not create referral link.' },
            { status: 500 },
          );
        }
      }

      if (!referralCode) {
        return NextResponse.json(
          { error: 'REFERRAL_CREATE_FAILED', message: 'Could not create referral link.' },
          { status: 500 },
        );
      }
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(request.url).origin;

    const inviteLink = `${appUrl.replace(/\/$/, '')}/invite/${referralCode}`;

    return NextResponse.json({
      ok: true,
      referralCode,
      inviteLink,
    });
  } catch (error) {
    console.error('REFERRAL_LINK_ROUTE_ERROR', error);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to load referral link.' },
      { status: 500 },
    );
  }
}
