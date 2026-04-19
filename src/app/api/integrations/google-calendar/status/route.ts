import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  getGoogleAccountProfile,
  getUsableAccessTokenFromIntegration,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

type CalendarStatusResponse = {
  connected: boolean;
  status: 'connected' | 'not_connected' | 'error';
  accountEmail: string | null;
  lastSyncAt: string | null;
  permissions: string[];
  errorMessage: string | null;
};

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
      .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(financeProfile?.last_analysis);
    const calendar = parseCalendarIntegrationState(lastAnalysis.google_calendar_integration);
    const hasToken = Boolean(calendar.access_token_encrypted);
    const profileConnected = Boolean(profile?.google_calendar_connected);
    const storedStatus = String(calendar.status || '').toLowerCase();
    const scope = typeof calendar.scope === 'string' ? calendar.scope : '';
    const permissions = scope ? scope.split(/\s+/).filter(Boolean) : [];
    const lastError =
      typeof calendar.last_error === 'string' && calendar.last_error.trim()
        ? calendar.last_error
        : null;

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

    const disconnectedPayload: CalendarStatusResponse = {
      connected: false,
      status: 'not_connected',
      accountEmail: null,
      lastSyncAt: null,
      permissions: [],
      errorMessage: null,
    };

    if (!profileConnected && !hasToken && storedStatus !== 'error') {
      return NextResponse.json(disconnectedPayload, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      });
    }

    if (!hasToken) {
      return NextResponse.json(
        {
          connected: false,
          status: 'error',
          accountEmail,
          lastSyncAt,
          permissions,
          errorMessage: lastError || 'Stored Google Calendar credentials are missing.',
        } satisfies CalendarStatusResponse,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    }

    try {
      const tokenState = await getUsableAccessTokenFromIntegration(calendar);
      const verifiedProfile = await getGoogleAccountProfile(tokenState.accessToken);
      const syncedAt = new Date().toISOString();

      if (tokenState.refreshApplied || storedStatus !== 'connected' || !profileConnected) {
        await supabase.from('finance_profiles').upsert({
          user_id: userId,
          active_subscriptions: Array.isArray(financeProfile?.active_subscriptions) ? financeProfile.active_subscriptions : [],
          total_monthly_cost: typeof financeProfile?.total_monthly_cost === 'number' ? financeProfile.total_monthly_cost : 0,
          estimated_savings: typeof financeProfile?.estimated_savings === 'number' ? financeProfile.estimated_savings : 0,
          currency: financeProfile?.currency || 'USD',
          memory_summary: financeProfile?.memory_summary || '',
          last_analysis: {
            ...lastAnalysis,
            google_calendar_integration: {
              ...tokenState.nextIntegration,
              status: 'connected',
              account_email: verifiedProfile.email,
              verified_email: verifiedProfile.verifiedEmail ? verifiedProfile.email : null,
              last_error: null,
            },
          },
          updated_at: syncedAt,
        }, { onConflict: 'user_id' });

        await supabase.from('profiles').upsert({
          id: userId,
          google_calendar_connected: true,
          updated_at: syncedAt,
        }, { onConflict: 'id' });
      }

      return NextResponse.json(
        {
          connected: true,
          status: 'connected',
          accountEmail: verifiedProfile.email || accountEmail,
          lastSyncAt,
          permissions:
            tokenState.nextIntegration.scope
              ? tokenState.nextIntegration.scope.split(/\s+/).filter(Boolean)
              : permissions,
          errorMessage: null,
        } satisfies CalendarStatusResponse,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    } catch (tokenError) {
      const message = tokenError instanceof Error ? tokenError.message : 'Unable to validate Google Calendar credentials.';
      const erroredAt = new Date().toISOString();

      await supabase.from('finance_profiles').upsert({
        user_id: userId,
        active_subscriptions: Array.isArray(financeProfile?.active_subscriptions) ? financeProfile.active_subscriptions : [],
        total_monthly_cost: typeof financeProfile?.total_monthly_cost === 'number' ? financeProfile.total_monthly_cost : 0,
        estimated_savings: typeof financeProfile?.estimated_savings === 'number' ? financeProfile.estimated_savings : 0,
        currency: financeProfile?.currency || 'USD',
        memory_summary: financeProfile?.memory_summary || '',
        last_analysis: {
          ...lastAnalysis,
          google_calendar_integration: {
            ...calendar,
            status: 'error',
            last_error: message,
          },
        },
        updated_at: erroredAt,
      }, { onConflict: 'user_id' });

      await supabase.from('profiles').upsert({
        id: userId,
        google_calendar_connected: false,
        updated_at: erroredAt,
      }, { onConflict: 'id' });

      return NextResponse.json(
        {
          connected: false,
          status: 'error',
          accountEmail,
          lastSyncAt,
          permissions,
          errorMessage: message,
        } satisfies CalendarStatusResponse,
        {
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        },
      );
    }
  } catch (error) {
    console.error('GOOGLE_CALENDAR_STATUS_ERROR', error);
    return NextResponse.json(
      { error: 'GOOGLE_CALENDAR_STATUS_FAILED' },
      { status: 500 },
    );
  }
}
