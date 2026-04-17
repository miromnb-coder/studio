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
      .from('profiles')
      .select(
        'google_calendar_connected, google_calendar_connected_at, google_calendar_last_sync_at',
      )
      .eq('id', userId)
      .maybeSingle();

    const { data: financeProfile } = await supabase
      .from('finance_profiles')
      .select('last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(financeProfile?.last_analysis);
    const calendar = asObject(lastAnalysis.google_calendar_integration);

    const connected =
      Boolean(profile?.google_calendar_connected) ||
      String(calendar.status || '').toLowerCase() === 'connected';

    const accountEmail =
      typeof calendar.account_email === 'string' && calendar.account_email.trim()
        ? calendar.account_email
        : auth.user?.email || null;

    const lastSyncAt =
      profile?.google_calendar_last_sync_at
        ? String(profile.google_calendar_last_sync_at)
        : typeof calendar.last_synced_at === 'string'
          ? calendar.last_synced_at
          : typeof calendar.connected_at === 'string'
            ? calendar.connected_at
            : null;

    const calendarsFound =
      typeof calendar.calendars_found === 'number' ? calendar.calendars_found : 0;

    const primaryCalendarId =
      typeof calendar.primary_calendar_id === 'string' ? calendar.primary_calendar_id : null;

    const primaryCalendarSummary =
      typeof calendar.primary_calendar_summary === 'string'
        ? calendar.primary_calendar_summary
        : null;

    const scope = typeof calendar.scope === 'string' ? calendar.scope : '';

    return NextResponse.json(
      {
        connected,
        status: connected ? 'connected' : 'disconnected',
        accountEmail,
        lastSyncAt,
        calendarsFound,
        primaryCalendarId,
        primaryCalendarSummary,
        permissions: scope ? scope.split(' ').filter(Boolean) : [],
        connectedAt: profile?.google_calendar_connected_at
          ? String(profile.google_calendar_connected_at)
          : typeof calendar.connected_at === 'string'
            ? calendar.connected_at
            : null,
        errorMessage:
          typeof calendar.last_error === 'string' && calendar.last_error.trim()
            ? calendar.last_error
            : null,
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
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_STATUS_FAILED' },
      { status: 500 },
    );
  }
}
