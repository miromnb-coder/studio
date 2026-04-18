export type BrowserSearchMode = 'search' | 'news' | 'shopping';

export type BrowserSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string | null;
};

export function getBrowserSearchProvider() {
  return (process.env.BROWSER_SEARCH_PROVIDER || 'serper').trim().toLowerCase();
}

export function hasBrowserSearchConfigured() {
  const provider = getBrowserSearchProvider();

  if (provider === 'tavily') {
    return Boolean(process.env.TAVILY_API_KEY);
  }

  return Boolean(process.env.SERPER_API_KEY);
}

export function inferBrowserSearchMode(input: string): BrowserSearchMode {
  const text = input.toLowerCase();

  if (
    /\b(news|latest|today|headlines|uuti|uusin|tuorein|tänään|tanaan)\b/i.test(text)
  ) {
    return 'news';
  }

  if (
    /\b(compare|comparison|best price|cheapest|price|shop|shopping|buy|halvin|hinta|vertaa|osta)\b/i.test(
      text,
    )
  ) {
    return 'shopping';
  }

  return 'search';
}

export function shouldUseBrowserSearch(input: string) {
  const text = input.toLowerCase();

  return (
    /\b(search|find|look up|browse|research|latest|current|today|news|compare|price|cheapest)\b/i.test(
      text,
    ) ||
    /\b(etsi|hae|katso|selvitä|selvita|tarkista|uusin|ajankohtainen|vertaa|halvin|hinta|uutiset|uutisia)\b/i.test(
      text,
    )
  );
}

async function runSerperSearch(
  query: string,
  mode: BrowserSearchMode,
): Promise<BrowserSearchResult[]> {
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

async function runTavilySearch(query: string): Promise<BrowserSearchResult[]> {
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
    let source: string | null = null;

    if (typeof row.url === 'string') {
      try {
        source = new URL(row.url).hostname;
      } catch {
        source = null;
      }
    }

    return {
      title: typeof row.title === 'string' ? row.title : 'Untitled',
      url: typeof row.url === 'string' ? row.url : '',
      snippet: typeof row.content === 'string' ? row.content : '',
      source,
    };
  });
}

export async function runBrowserSearch(params: {
  query: string;
  mode?: BrowserSearchMode;
}) {
  const provider = getBrowserSearchProvider();
  const mode = params.mode || 'search';

  const results =
    provider === 'tavily'
      ? await runTavilySearch(params.query)
      : await runSerperSearch(params.query, mode);

  return {
    provider,
    mode,
    results,
  };
}

export function formatBrowserSearchContext(params: {
  query: string;
  mode: BrowserSearchMode;
  provider: string;
  results: BrowserSearchResult[];
}) {
  const lines = params.results.slice(0, 6).map((result, index) => {
    return [
      `${index + 1}. ${result.title}`,
      result.source ? `Source: ${result.source}` : null,
      result.url ? `URL: ${result.url}` : null,
      result.snippet ? `Snippet: ${result.snippet}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return [
    `Live browser search results`,
    `Query: ${params.query}`,
    `Mode: ${params.mode}`,
    `Provider: ${params.provider}`,
    '',
    ...lines,
  ].join('\n');
}
