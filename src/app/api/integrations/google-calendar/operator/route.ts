import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  fetchNext7DaysEvents,
  fetchTodayEvents,
  getUsableAccessTokenFromIntegration,
  listCalendars,
  listEvents,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';
import { buildFreeTimeIntelligence } from '@/server/calendar-operator/free-time';
import { buildOverloadSignals } from '@/server/calendar-operator/overload';
import { buildTodayPlanner } from '@/server/calendar-operator/today';
import type { CalendarOperatorAction } from '@/server/calendar-operator/types';
import { buildWeeklyReset } from '@/server/calendar-operator/weekly-reset';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

async function resolveCalendarAccess() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;

  if (!userId) {
    return { error: NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 }) };
  }

  const { data: financeProfile } = await supabase
    .from('finance_profiles')
    .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
    .eq('user_id', userId)
    .maybeSingle();

  const lastAnalysis = asObject(financeProfile?.last_analysis);
  const integration = parseCalendarIntegrationState(lastAnalysis.google_calendar_integration);

  if (!integration.access_token_encrypted) {
    return { error: NextResponse.json({ error: 'GOOGLE_CALENDAR_NOT_CONNECTED' }, { status: 400 }) };
  }

  const tokenState = await getUsableAccessTokenFromIntegration(integration);

  if (tokenState.refreshApplied) {
    const payload = {
      user_id: userId,
      active_subscriptions: Array.isArray(financeProfile?.active_subscriptions) ? financeProfile.active_subscriptions : [],
      total_monthly_cost: typeof financeProfile?.total_monthly_cost === 'number' ? financeProfile.total_monthly_cost : 0,
      estimated_savings: typeof financeProfile?.estimated_savings === 'number' ? financeProfile.estimated_savings : 0,
      currency: financeProfile?.currency || 'USD',
      memory_summary: financeProfile?.memory_summary || '',
      last_analysis: {
        ...lastAnalysis,
        google_calendar_integration: tokenState.nextIntegration,
      },
      updated_at: new Date().toISOString(),
    };

    await supabase.from('finance_profiles').upsert(payload, { onConflict: 'user_id' });
  }

  return {
    supabase,
    userId,
    accessToken: tokenState.accessToken,
    lastAnalysis,
    profile: financeProfile,
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as { action?: CalendarOperatorAction };
    const action = body.action || 'today_plan';

    const auth = await resolveCalendarAccess();
    if ('error' in auth) return auth.error;

    if (action === 'today_plan') {
      const events = await fetchTodayEvents(auth.accessToken);
      const result = buildTodayPlanner(events);
      return NextResponse.json({ ok: true, action, result });
    }

    if (action === 'find_focus_time') {
      const events = await fetchNext7DaysEvents(auth.accessToken);
      const result = buildFreeTimeIntelligence(events);
      return NextResponse.json({ ok: true, action, result });
    }

    if (action === 'check_busy_week') {
      const [todayEvents, weekEvents] = await Promise.all([
        fetchTodayEvents(auth.accessToken),
        fetchNext7DaysEvents(auth.accessToken),
      ]);
      const result = buildOverloadSignals(todayEvents, weekEvents);
      return NextResponse.json({ ok: true, action, result });
    }

    if (action === 'weekly_reset') {
      const calendars = await listCalendars(auth.accessToken);
      const primary = calendars.find((calendar) => calendar.primary) || calendars[0];
      const events = await listEvents({ accessToken: auth.accessToken, calendarId: primary?.id || 'primary' });
      const result = buildWeeklyReset(events);
      return NextResponse.json({ ok: true, action, result });
    }

    return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
  } catch (error) {
    console.error('GOOGLE_CALENDAR_OPERATOR_ERROR', error);
    return NextResponse.json({ error: 'GOOGLE_CALENDAR_OPERATOR_FAILED' }, { status: 500 });
  }
}
