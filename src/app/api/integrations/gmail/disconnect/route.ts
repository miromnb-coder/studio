import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('finance_profiles')
      .select('active_subscriptions,total_monthly_cost,estimated_savings,currency,memory_summary,last_analysis')
      .eq('user_id', userId)
      .maybeSingle();

    const lastAnalysis = asObject(profile?.last_analysis);

    const disconnectedAt = new Date().toISOString();

    await supabase.from('finance_profiles').upsert(
      {
        user_id: userId,
        active_subscriptions: Array.isArray(profile?.active_subscriptions) ? profile.active_subscriptions : [],
        total_monthly_cost: typeof profile?.total_monthly_cost === 'number' ? profile.total_monthly_cost : 0,
        estimated_savings: typeof profile?.estimated_savings === 'number' ? profile.estimated_savings : 0,
        currency: profile?.currency || 'USD',
        memory_summary: profile?.memory_summary || '',
        last_analysis: {
          ...lastAnalysis,
          gmail_integration: {
            status: 'disconnected',
            disconnected_at: disconnectedAt,
            access_token_encrypted: null,
            refresh_token_encrypted: null,
            expires_at: null,
            last_error: null,
          },
        },
        updated_at: disconnectedAt,
      },
      { onConflict: 'user_id' },
    );

    await supabase.from('profiles').upsert(
      {
        id: userId,
        gmail_connected: false,
        updated_at: disconnectedAt,
      },
      { onConflict: 'id' },
    );

    return NextResponse.json({ status: 'disconnected' });
  } catch (error) {
    console.error('GMAIL_DISCONNECT_ERROR', error);
    return NextResponse.json({ error: 'GMAIL_DISCONNECT_FAILED' }, { status: 500 });
  }
}
