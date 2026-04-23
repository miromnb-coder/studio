import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  fetchTodayEvents,
  getUsableAccessTokenFromIntegration,
  listEvents,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
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

    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId')?.trim() || 'primary';
    const mode = searchParams.get('mode')?.trim() || 'range';
    const timeMin = searchParams.get('timeMin')?.trim() || undefined;
    const timeMax = searchParams.get('timeMax')?.trim() || undefined;
    const maxResults = Math.max(
      1,
      Math.min(Number(searchParams.get('maxResults') || 50), 250),
    );

    const events =
      mode === 'today'
        ? await fetchTodayEvents(tokenState.accessToken, calendarId)
        : await listEvents({
            accessToken: tokenState.accessToken,
            calendarId,
            timeMin,
            timeMax,
            maxResults,
          });

    return NextResponse.json(
      {
        events,
        count: events.length,
        calendarId,
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
    console.error('GOOGLE_CALENDAR_EVENTS_ERROR', error);
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_EVENTS_FAILED' },
      { status: 500 },
    );
  }
}
