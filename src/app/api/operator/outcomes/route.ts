import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function asNum(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.id) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

    const result = await supabase
      .from('recommendation_outcomes')
      .select('id,recommendation_id,recommended_action,status,estimated_monthly_impact,realized_impact,completed_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(40);

    if (result.error) {
      console.error('OPERATOR_OUTCOME_ERROR', { action: 'get', userId: user.id, error: result.error.message });
      return NextResponse.json({ error: 'OUTCOME_FETCH_FAILED' }, { status: 500 });
    }
    return NextResponse.json({ outcomes: result.data || [] });
  } catch (error) {
    console.error('OPERATOR_OUTCOME_ERROR', { action: 'get_unhandled', error });
    return NextResponse.json({ error: 'OUTCOME_FETCH_FAILED' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.id) return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const recommendationId = typeof body?.recommendationId === 'string' ? body.recommendationId.trim() : '';
    const recommendedAction = typeof body?.recommendedAction === 'string' ? body.recommendedAction.trim() : '';
    const status = body?.status;

    if (!recommendationId || !recommendedAction) {
      return NextResponse.json({ error: 'INVALID_OUTCOME_PAYLOAD' }, { status: 400 });
    }
    if (status !== 'accepted' && status !== 'ignored' && status !== 'postponed' && status !== 'completed') {
      return NextResponse.json({ error: 'INVALID_OUTCOME_STATUS' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const payload = {
      user_id: user.id,
      recommendation_id: recommendationId,
      recommended_action: recommendedAction,
      status,
      estimated_monthly_impact: asNum(body?.estimatedMonthlyImpact),
      realized_impact: asNum(body?.realizedImpact),
      completed_at: status === 'completed' ? now : null,
      updated_at: now,
    };

    const result = await supabase
      .from('recommendation_outcomes')
      .upsert(payload, { onConflict: 'user_id,recommendation_id' })
      .select('id,recommendation_id,status,updated_at')
      .maybeSingle();

    if (result.error || !result.data) {
      console.error('OPERATOR_OUTCOME_ERROR', { action: 'upsert', userId: user.id, recommendationId, error: result.error?.message });
      return NextResponse.json({ error: 'OUTCOME_SAVE_FAILED' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, outcome: result.data });
  } catch (error) {
    console.error('OPERATOR_OUTCOME_ERROR', { action: 'post_unhandled', error });
    return NextResponse.json({ error: 'OUTCOME_SAVE_FAILED' }, { status: 500 });
  }
}
