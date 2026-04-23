import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getUsableAccessTokenFromIntegration,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const start = typeof body?.start === 'string' ? body.start.trim() : '';
    const end = typeof body?.end === 'string' ? body.end.trim() : '';
    const description =
      typeof body?.description === 'string' ? body.description.trim() : undefined;
    const location =
      typeof body?.location === 'string' ? body.location.trim() : undefined;
    const calendarId =
      typeof body?.calendarId === 'string' && body.calendarId.trim()
        ? body.calendarId.trim()
        : 'primary';

    if (!title || !start || !end) {
      return NextResponse.json(
        { error: 'TITLE_START_END_REQUIRED' },
        { status: 400 },
      );
    }

    const { data: financeProfile } = await supabase
      .from('finance_profiles')
      .select('last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(financeProfile?.last_analysis);
    const integration = parseCalendarIntegrationState(lastAnalysis.google_calendar_integration);

    if (!integration.access_token_encrypted) {
      return NextResponse.json({ error: 'GOOGLE_CALENDAR_NOT_CONNECTED' }, { status: 400 });
    }

    const tokenState = await getUsableAccessTokenFromIntegration(integration);

    if (tokenState.refreshApplied) {
      await supabase.from('finance_profiles').upsert(
        {
          user_id: userId,
          last_analysis: {
            ...lastAnalysis,
            google_calendar_integration: tokenState.nextIntegration,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenState.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: title,
          description,
          location,
          start: { dateTime: start },
          end: { dateTime: end },
        }),
        cache: 'no-store',
      },
    );

    if (response.status === 403) {
      return NextResponse.json(
        {
          error: 'GOOGLE_CALENDAR_INSUFFICIENT_SCOPE',
          message:
            'Current Google Calendar connection does not allow creating events. Reconnect with calendar write access.',
        },
        { status: 403 },
      );
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        {
          error: 'GOOGLE_CALENDAR_CREATE_FAILED',
          message: text || `Google Calendar create failed (${response.status})`,
        },
        { status: 500 },
      );
    }

    const created = await response.json();

    return NextResponse.json(
      {
        success: true,
        event: created,
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
    console.error('GOOGLE_CALENDAR_CREATE_ERROR', error);
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_CREATE_FAILED' },
      { status: 500 },
    );
  }
}
