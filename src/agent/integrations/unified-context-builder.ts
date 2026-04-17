import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { parseIntegrationState } from '@/lib/integrations/gmail';
import { parseCalendarIntegrationState } from '@/lib/integrations/google-calendar';
import { buildFallbackWarnings } from './fallback';
import { rankSources } from './source-priority';
import type {
  IntegrationAvailability,
  IntegrationIntent,
  UnifiedContext,
} from './types';

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function getIntegrationAvailability(userId: string): Promise<IntegrationAvailability> {
  const admin = createAdminClient();

  const [{ data: profile }, { data: finance }, { data: memories }] = await Promise.all([
    admin.from('profiles').select('gmail_connected,google_calendar_connected').eq('id', userId).maybeSingle(),
    admin.from('finance_profiles').select('last_analysis').eq('user_id', userId).maybeSingle(),
    admin.from('memory').select('id').eq('user_id', userId).limit(1),
  ]);

  const lastAnalysis = asObject(finance?.last_analysis);
  const gmail = parseIntegrationState(lastAnalysis.gmail_integration);
  const calendar = parseCalendarIntegrationState(lastAnalysis.google_calendar_integration);

  return {
    gmailConnected: Boolean(profile?.gmail_connected || gmail.status === 'connected'),
    calendarConnected: Boolean(profile?.google_calendar_connected || calendar.status === 'connected'),
    memoryAvailable: Array.isArray(memories) ? memories.length > 0 : false,
  };
}

export async function buildUnifiedContext(params: {
  userId: string;
  intent: IntegrationIntent;
  sourceData?: Partial<Record<'gmail' | 'calendar' | 'memory', Record<string, unknown>>>;
}): Promise<UnifiedContext> {
  const availability = await getIntegrationAvailability(params.userId);
  const sourcePriority = rankSources(params.intent);

  return {
    intent: params.intent,
    availability,
    sourcePriority,
    sourceData: params.sourceData || {},
    warnings: buildFallbackWarnings(params.intent, availability),
  };
}
