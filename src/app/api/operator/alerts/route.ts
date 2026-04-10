import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const include = new URL(req.url).searchParams.get('include') || 'active';
    const query = supabase
      .from('operator_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (include === 'all') {
      // no-op
    } else if (include === 'dismissed') {
      query.eq('status', 'dismissed');
    } else if (include === 'completed') {
      query.eq('status', 'completed');
    } else {
      query.eq('status', 'active');
    }

    const result = await query;

    if (result.error) {
      console.error('OPERATOR_ALERT_ERROR', { action: 'fetch', userId: user.id, error: result.error.message });
      return NextResponse.json({ error: 'OPERATOR_ALERT_FETCH_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ alerts: result.data || [] });
  } catch (error) {
    console.error('OPERATOR_ALERT_ERROR', { action: 'fetch_unhandled', error });
    return NextResponse.json({ error: 'OPERATOR_ALERT_FETCH_FAILED' }, { status: 500 });
  }
}
