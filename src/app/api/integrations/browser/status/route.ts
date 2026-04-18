import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getProviderLabel() {
  const provider = (process.env.BROWSER_SEARCH_PROVIDER || 'serper').trim().toLowerCase();
  if (provider === 'tavily') return 'Tavily';
  return 'Serper';
}

function hasBrowserSearchKey() {
  const provider = (process.env.BROWSER_SEARCH_PROVIDER || 'serper').trim().toLowerCase();

  if (provider === 'tavily') {
    return Boolean(process.env.TAVILY_API_KEY);
  }

  return Boolean(process.env.SERPER_API_KEY);
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const enabled = hasBrowserSearchKey();
    const provider = getProviderLabel();

    return NextResponse.json(
      {
        connected: enabled,
        status: enabled ? 'connected' : 'disconnected',
        accountEmail: null,
        lastSyncAt: null,
        permissions: enabled ? ['Live web search', 'Search result retrieval'] : [],
        tools: ['Live Search', 'Product Compare', 'Research Mode'],
        provider,
        errorMessage: enabled ? null : `Missing API key for ${provider}`,
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
    console.error('BROWSER_STATUS_ERROR', error);
    return NextResponse.json({ error: 'BROWSER_STATUS_FAILED' }, { status: 500 });
  }
}
