import { NextResponse } from 'next/server';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string | null;
};

type SearchMode = 'search' | 'news' | 'shopping';

function getProvider() {
  return (process.env.BROWSER_SEARCH_PROVIDER || 'serper').trim().toLowerCase();
}

async function runSerperSearch(query: string, mode: SearchMode): Promise<SearchResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing SERPER_API_KEY');
  }

  const endpoint =
    mode === 'news'
      ? 'https://google.serper.dev/news'
      : mode === 'shopping'
        ? 'https://google.serper.dev/shopping'
        : 'https://google.serper.dev/search';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      q: query,
      gl: 'fi',
      hl: 'fi',
      num: 8,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SERPER_SEARCH_FAILED: ${response.status} ${text}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (mode === 'shopping') {
    const shopping = Array.isArray(data.shopping) ? data.shopping : [];
    return shopping.slice(0, 8).map((item) => {
      const row = item as Record<string, unknown>;
      return {
        title: typeof row.title === 'string' ? row.title : 'Untitled',
        url: typeof row.link === 'string' ? row.link : '',
        snippet:
          typeof row.price === 'string'
            ? row.price
            : typeof row.snippet === 'string'
              ? row.snippet
              : '',
        source: typeof row.source === 'string' ? row.source : null,
      };
    });
  }

  if (mode === 'news') {
    const news = Array.isArray(data.news) ? data.news : [];
    return news.slice(0, 8).map((item) => {
      const row = item as Record<string, unknown>;
      return {
        title: typeof row.title === 'string' ? row.title : 'Untitled',
        url: typeof row.link === 'string' ? row.link : '',
        snippet: typeof row.snippet === 'string' ? row.snippet : '',
        source: typeof row.source === 'string' ? row.source : null,
      };
    });
  }

  const organic = Array.isArray(data.organic) ? data.organic : [];
  return organic.slice(0, 8).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      title: typeof row.title === 'string' ? row.title : 'Untitled',
      url: typeof row.link === 'string' ? row.link : '',
      snippet: typeof row.snippet === 'string' ? row.snippet : '',
      source: typeof row.source === 'string' ? row.source : null,
    };
  });
}

async function runTavilySearch(query: string): Promise<SearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('Missing TAVILY_API_KEY');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'advanced',
      max_results: 8,
      include_answer: false,
      include_raw_content: false,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`TAVILY_SEARCH_FAILED: ${response.status} ${text}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const results = Array.isArray(data.results) ? data.results : [];

  return results.slice(0, 8).map((item) => {
    const row = item as Record<string, unknown>;
    return {
      title: typeof row.title === 'string' ? row.title : 'Untitled',
      url: typeof row.url === 'string' ? row.url : '',
      snippet: typeof row.content === 'string' ? row.content : '',
      source: typeof row.url === 'string' ? new URL(row.url).hostname : null,
    };
  });
}

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
      mode?: SearchMode;
    };

    const query = typeof body.query === 'string' ? body.query.trim() : '';
    const mode: SearchMode =
      body.mode === 'news' || body.mode === 'shopping' ? body.mode : 'search';

    if (!query) {
      return NextResponse.json({ error: 'QUERY_REQUIRED' }, { status: 400 });
    }

    const provider = getProvider();
    const results =
      provider === 'tavily'
        ? await runTavilySearch(query)
        : await runSerperSearch(query, mode);

    return NextResponse.json(
      {
        ok: true,
        provider,
        query,
        mode,
        results,
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
