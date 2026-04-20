import {
  fetchNext7DaysEvents,
  fetchTodayEvents,
  getUsableAccessTokenFromIntegration as getUsableCalendarAccessToken,
  listCalendars,
  listEvents,
  parseCalendarIntegrationState,
} from '@/lib/integrations/google-calendar';
import { buildTodayPlanner } from '@/server/calendar-operator/today';
import { buildFreeTimeIntelligence } from '@/server/calendar-operator/free-time';
import { buildOverloadSignals } from '@/server/calendar-operator/overload';
import { buildWeeklyReset } from '@/server/calendar-operator/weekly-reset';
import { asObject, normalizeLower, normalizeText, toErrorMessage, TOOL_CONFIDENCE, createAdminClient } from './helpers';
import type { AgentContext, AgentToolCall, AgentToolResult, PersistedFinanceProfile, ToolInput } from './types';
import { buildFailure, buildMissingConnection, buildSuccess } from './result-builders';
import { getRequestText } from './context';

function normalizeCalendarAction(input: ToolInput): string {
  const action = normalizeLower(input.action);
  switch (action) {
    case 'status':
    case 'availability':
    case 'today_plan':
    case 'find_focus_time':
    case 'check_busy_week':
    case 'weekly_reset':
    case 'list_events':
      return action;
    default:
      return 'today_plan';
  }
}

function extractRequestedQuery(call: AgentToolCall, context: AgentContext): string {
  const input = asObject(call.input);
  return normalizeText(input.query) || normalizeText(input.message) || getRequestText(context);
}

async function persistFinanceLastAnalysisUpdate(params: {
  userId: string;
  financeProfile: PersistedFinanceProfile | null | undefined;
  integrationKey: 'gmail_integration' | 'google_calendar_integration';
  integrationState: Record<string, unknown>;
}) {
  const admin = createAdminClient();
  const lastAnalysis = asObject(params.financeProfile?.last_analysis);
  await admin.from('finance_profiles').upsert({
    user_id: params.userId,
    active_subscriptions: Array.isArray(params.financeProfile?.active_subscriptions)
      ? params.financeProfile?.active_subscriptions
      : [],
    total_monthly_cost: typeof params.financeProfile?.total_monthly_cost === 'number'
      ? params.financeProfile.total_monthly_cost
      : 0,
    estimated_savings: typeof params.financeProfile?.estimated_savings === 'number'
      ? params.financeProfile.estimated_savings
      : 0,
    currency: params.financeProfile?.currency || 'USD',
    memory_summary: params.financeProfile?.memory_summary || '',
    last_analysis: { ...lastAnalysis, [params.integrationKey]: params.integrationState },
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
}

export async function calendarTool(
  call: AgentToolCall,
  context: AgentContext,
): Promise<AgentToolResult> {
  const startedAt = Date.now();
  const input = asObject(call.input);
  const action = normalizeCalendarAction(input);
  const query = extractRequestedQuery(call, context);
  const userId = normalizeText(input.userId) || normalizeText(context.request.userId);

  if (!userId) return buildMissingConnection(call, 'calendar', action, startedAt);

  try {
    const admin = createAdminClient();
    const { data: financeProfile } = await admin
      .from('finance_profiles')
      .select('last_analysis,active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary')
      .eq('user_id', userId)
      .maybeSingle();

    const integration = parseCalendarIntegrationState(
      asObject(asObject(financeProfile?.last_analysis).google_calendar_integration),
    );
    if (!integration.access_token_encrypted) {
      return buildMissingConnection(call, 'calendar', action, startedAt);
    }

    const tokenState = await getUsableCalendarAccessToken(integration);
    if (tokenState.refreshApplied) {
      await persistFinanceLastAnalysisUpdate({
        userId,
        financeProfile: financeProfile ?? null,
        integrationKey: 'google_calendar_integration',
        integrationState: tokenState.nextIntegration as Record<string, unknown>,
      });
    }

    if (action === 'status') {
      const calendars = await listCalendars(tokenState.accessToken);
      return buildSuccess(call, 'calendar', {
        action,
        connected: true,
        calendarCount: calendars.length,
        primaryCalendar: calendars.find((item) => item.primary)?.summary || calendars[0]?.summary || null,
      }, {
        requiresAuth: true,
        summary: 'Calendar connection is healthy and calendars are readable.',
        confidence: TOOL_CONFIDENCE.calendar,
      }, startedAt);
    }

    if (action === 'find_focus_time' || action === 'availability') {
      const events = await fetchNext7DaysEvents(tokenState.accessToken);
      const result = buildFreeTimeIntelligence(events);
      return buildSuccess(call, 'calendar', {
        action: action === 'availability' ? 'availability' : 'find_focus_time',
        connected: true,
        query,
        summary: result.bestDeepWorkWindow
          ? `Best deep-work block starts at ${result.bestDeepWorkWindow.startAt}.`
          : 'No deep-work window found in the next 7 days.',
        result,
      }, {
        requiresAuth: true,
        summary: 'Computed focus and free-time windows from calendar events.',
        confidence: TOOL_CONFIDENCE.calendar,
      }, startedAt);
    }

    if (action === 'check_busy_week') {
      const [todayEvents, weekEvents] = await Promise.all([
        fetchTodayEvents(tokenState.accessToken),
        fetchNext7DaysEvents(tokenState.accessToken),
      ]);
      const result = buildOverloadSignals(todayEvents, weekEvents);
      return buildSuccess(call, 'calendar', {
        action: 'check_busy_week', connected: true, summary: result.summary, result,
      }, {
        requiresAuth: true,
        summary: 'Computed busy-week and overload indicators.',
        confidence: TOOL_CONFIDENCE.calendar,
      }, startedAt);
    }

    if (action === 'weekly_reset') {
      const calendars = await listCalendars(tokenState.accessToken);
      const primary = calendars.find((calendar) => calendar.primary) || calendars[0];
      const events = await listEvents({
        accessToken: tokenState.accessToken,
        calendarId: primary?.id || 'primary',
      });
      const result = buildWeeklyReset(events);

      return buildSuccess(call, 'calendar', {
        action: 'weekly_reset',
        connected: true,
        summary: `Prepared weekly reset with ${result.bestTimeBlocks.length} high-value time blocks.`,
        result,
      }, {
        requiresAuth: true,
        summary: 'Prepared weekly reset from upcoming calendar events.',
        confidence: TOOL_CONFIDENCE.calendar,
      }, startedAt);
    }

    if (action === 'list_events') {
      const events = await fetchNext7DaysEvents(tokenState.accessToken);
      return buildSuccess(call, 'calendar', {
        action: 'list_events', connected: true, query, events,
      }, {
        requiresAuth: true,
        summary: 'Listed upcoming calendar events.',
        confidence: TOOL_CONFIDENCE.calendar,
      }, startedAt);
    }

    const events = await fetchTodayEvents(tokenState.accessToken);
    const result = buildTodayPlanner(events);
    return buildSuccess(call, 'calendar', {
      action: 'today_plan', connected: true, query, summary: result.recommendedAction, result,
    }, {
      requiresAuth: true,
      summary: 'Generated today plan from calendar data.',
      confidence: TOOL_CONFIDENCE.calendar,
    }, startedAt);
  } catch (error) {
    return buildFailure(
      call,
      'calendar',
      `Calendar execution failed: ${toErrorMessage(error)}`,
      { action, query },
      startedAt,
    );
  }
}
