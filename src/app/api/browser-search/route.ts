import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import {
  runBrowserSearch,
  type BrowserSearchMode,
} from '@/lib/browser-search/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = (await req.json()) as {
      query?: string;
      mode?: BrowserSearchMode;
    };

    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const mode: BrowserSearchMode =
      body.mode === 'news' || body.mode === 'shopping' ? body.mode : 'search';

    if (!query) {
      return NextResponse.json({ error: 'QUERY_REQUIRED' }, { status: 400 });
    }

    const search = await runBrowserSearch({ query, mode });

    return NextResponse.json(
      {
        ok: true,
        provider: search.provider,
        query,
        mode: search.mode,
        results: search.results,
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
    console.error('BROWSER_SEARCH_ERROR', error);
    return NextResponse.json(
      {
        error: 'BROWSER_SEARCH_FAILED',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
