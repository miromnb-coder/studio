import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('finance_profiles')
      .select('last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(profile?.last_analysis);
    const calendar = asObject(lastAnalysis.google_calendar_integration);

    const connected = String(calendar.status || '').toLowerCase() === 'connected' && Boolean(calendar.access_token_encrypted);

    return NextResponse.json(
      {
        connected,
        accountEmail: typeof calendar.verified_email === 'string' ? calendar.verified_email : undefined,
        lastSyncAt: typeof calendar.last_sync_at === 'string' ? calendar.last_sync_at : null,
        calendarsFound: typeof calendar.calendars_found === 'number' ? calendar.calendars_found : 0,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    console.error('GOOGLE_CALENDAR_STATUS_ERROR', error);
    return NextResponse.json({ error: 'GOOGLE_CALENDAR_STATUS_FAILED' }, { status: 500 });
  }
}
