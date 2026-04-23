import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  fetchInboxMessages,
  getUsableAccessTokenFromIntegration,
  parseIntegrationState,
} from '@/lib/integrations/gmail';

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
    const integration = parseIntegrationState(lastAnalysis.gmail_integration);

    if (!integration.access_token_encrypted) {
      return NextResponse.json({ error: 'GMAIL_NOT_CONNECTED' }, { status: 400 });
    }

    const tokenState = await getUsableAccessTokenFromIntegration(integration);

    if (tokenState.refreshApplied) {
      await supabase.from('finance_profiles').upsert(
        {
          user_id: userId,
          last_analysis: {
            ...lastAnalysis,
            gmail_integration: tokenState.nextIntegration,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim() || '';
    const maxResults = Math.max(
      1,
      Math.min(Number(searchParams.get('maxResults') || 20), 100),
    );

    if (!q) {
      return NextResponse.json({ error: 'QUERY_REQUIRED' }, { status: 400 });
    }

    const messages = await fetchInboxMessages({
      accessToken: tokenState.accessToken,
      maxResults,
      query: q,
    });

    return NextResponse.json(
      {
        query: q,
        messages,
        count: messages.length,
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
    console.error('GMAIL_SEARCH_ERROR', error);
    return NextResponse.json(
      { error: 'GMAIL_SEARCH_FAILED' },
      { status: 500 },
    );
  }
}
