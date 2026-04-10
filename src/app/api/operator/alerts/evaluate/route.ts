import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { evaluateOperatorAlertsForUser } from '@/lib/operator/alerts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const alerts = await evaluateOperatorAlertsForUser(supabase, user.id);
    return NextResponse.json({ alerts });
  } catch (error) {
    console.error('OPERATOR_ALERT_ERROR', { action: 'evaluate', error });
    return NextResponse.json({ error: 'OPERATOR_ALERT_EVALUATION_FAILED' }, { status: 500 });
  }
}
