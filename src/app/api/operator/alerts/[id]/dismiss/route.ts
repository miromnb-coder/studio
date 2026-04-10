import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const { id } = await params;
    const result = await supabase
      .from('operator_alerts')
      .update({ status: 'dismissed', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id,status')
      .maybeSingle();

    if (result.error || !result.data) {
      console.error('OPERATOR_ALERT_ERROR', { action: 'dismiss', userId: user.id, alertId: id, error: result.error?.message });
      return NextResponse.json({ error: 'OPERATOR_ALERT_DISMISS_FAILED' }, { status: 500 });
    }

    console.log('OPERATOR_ALERT_DISMISSED', { userId: user.id, alertId: id });
    return NextResponse.json({ ok: true, alert: result.data });
  } catch (error) {
    console.error('OPERATOR_ALERT_ERROR', { action: 'dismiss_unhandled', error });
    return NextResponse.json({ error: 'OPERATOR_ALERT_DISMISS_FAILED' }, { status: 500 });
  }
}
