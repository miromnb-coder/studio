'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Newspaper,
  Search,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

type SearchMode = 'search' | 'news' | 'shopping';

type BrowserSearchResult = {
  title: string;
  url: string;
  snippet: string;
  source?: string | null;
};

type SearchResponse = {
  ok?: boolean;
  provider?: string;
  query?: string;
  mode?: SearchMode;
  results?: BrowserSearchResult[];
  error?: string;
  message?: string;
};

export function ToolsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTool = searchParams.get('tool');
  const isBrowserSearch = activeTool === 'browser-search';

  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [provider, setProvider] = useState('');
  const [results, setResults] = useState<BrowserSearchResult[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('q');
    const m = searchParams.get('mode');

    if (q) setQuery(q);
    if (m === 'news' || m === 'shopping' || m === 'search') {
      setMode(m);
    }
  }, [searchParams]);

  const title = useMemo(() => {
    if (mode === 'news') return 'News Search';
    if (mode === 'shopping') return 'Shopping Compare';
    return 'Browser Search';
  }, [mode]);

  const submitSearch = useCallback(
    async (nextQuery?: string, nextMode?: SearchMode) => {
      const finalQuery = (nextQuery ?? query).trim();
      const finalMode = nextMode ?? mode;

      if (!finalQuery) {
        setError('Enter something to search.');
        setResults([]);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/browser-search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: finalQuery,
            mode: finalMode,
          }),
        });

        const data = (await response.json()) as SearchResponse;

        if (!response.ok) {
          setProvider(data.provider || '');
          setResults([]);
          setError(data.message || 'Search failed.');
          return;
        }

        setProvider(data.provider || '');
        setResults(Array.isArray(data.results) ? data.results : []);
        setError('');
      } catch {
        setResults([]);
        setError('Search failed. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [mode, query],
  );

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submitSearch();
  };

  if (!isBrowserSearch) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] px-5 py-6 text-[#1f2937]">
        <div className="mx-auto max-w-[720px]">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8dee8] bg-white px-4 py-2 text-sm font-medium text-[#334155]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-6 rounded-[28px] border border-white/70 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b93a0]">
              Tools
            </p>
            <h1 className="mt-3 text-[30px] font-semibold tracking-[-0.04em] text-[#111827]">
              Browser Search
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Open the Browser Search tool from Connectors or use the direct tool route.
            </p>

            <Link
              href="/tools?tool=browser-search"
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#111827] px-4 py-3 text-sm font-semibold text-white"
            >
              Open Browser Search
              <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f8f9_0%,#eef2f6_100%)] px-5 py-6 text-[#1f2937]">
      <div className="mx-auto max-w-[820px]">
        <div className="mb-5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-[#d8dee8] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-[#d8dee8] bg-white px-4 py-2 text-sm font-medium text-[#334155] shadow-[0_6px_18px_rgba(15,23,42,0.06)]"
          >
            Go to chat
          </Link>
        </div>

        <section className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8b93a0]">
                Browser Search
              </p>
              <h1 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-0.05em] text-[#111827]">
                Search the live web inside Kivo
              </h1>
              <p className="mt-3 max-w-[560px] text-sm leading-6 text-[#667085]">
                Search current information, compare products, and scan news without leaving your operator workflow.
              </p>
            </div>

            <div className="rounded-2xl border border-[#e5eaf2] bg-[#fbfcfe] px-4 py-3 text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                Provider
              </p>
              <p className="mt-1 text-sm font-semibold text-[#111827]">
                {provider || 'Ready'}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode('search')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                mode === 'search'
                  ? 'bg-[#111827] text-white'
                  : 'border border-[#d9e1ec] bg-white text-[#475467]'
              }`}
            >
              <Search className="h-4 w-4" />
              Web
            </button>

            <button
              type="button"
              onClick={() => setMode('news')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                mode === 'news'
                  ? 'bg-[#111827] text-white'
                  : 'border border-[#d9e1ec] bg-white text-[#475467]'
              }`}
            >
              <Newspaper className="h-4 w-4" />
              News
            </button>

            <button
              type="button"
              onClick={() => setMode('shopping')}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                mode === 'shopping'
                  ? 'bg-[#111827] text-white'
                  : 'border border-[#d9e1ec] bg-white text-[#475467]'
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Shopping
            </button>
          </div>

          <form onSubmit={onSubmit} className="mt-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={
                  mode === 'shopping'
                    ? 'Compare iPhone 15 price Finland'
                    : mode === 'news'
                      ? 'Latest AI news'
                      : 'Search the web'
                }
                className="min-h-[56px] flex-1 rounded-2xl border border-[#dbe2ec] bg-white px-4 text-[15px] text-[#111827] outline-none transition placeholder:text-[#9aa4b2] focus:border-[#a6b0c2] focus:ring-4 focus:ring-[#e9edf4]"
              />

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#111827] px-5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(17,24,39,0.16)] disabled:opacity-60"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Search
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              'Best AI coding tools 2026',
              'Latest Brilliant Labs Halo update',
              'Cheapest protein products Finland',
              'Compare ChatGPT and Gemini',
            ].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setQuery(sample);
                  void submitSearch(sample, mode);
                }}
                className="rounded-full border border-[#d9e1ec] bg-white px-3 py-2 text-[12px] text-[#475467]"
              >
                {sample}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#111827]">{title} results</h2>
            {results.length ? (
              <p className="text-[12px] text-[#667085]">{results.length} results</p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-[#f0d3d3] bg-[#fff7f7] px-4 py-3 text-sm text-[#8f3f46]">
              {error}
            </div>
          ) : null}

          {!error && !isLoading && results.length === 0 ? (
            <div className="rounded-[24px] border border-[#e6ebf3] bg-white/78 px-5 py-8 text-sm text-[#667085] shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
              Run a search to see results here.
            </div>
          ) : null}

          <div className="mt-3 space-y-3">
            {results.map((result, index) => (
              <article
                key={`${result.url}-${index}`}
                className="rounded-[24px] border border-[#e6ebf3] bg-white/82 p-5 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#98a2b3]">
                      {result.source || 'Source'}
                    </p>
                    <h3 className="mt-2 text-[18px] font-semibold leading-6 tracking-[-0.03em] text-[#111827]">
                      {result.title}
                    </h3>
                  </div>

                  <a
                    href={result.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#dde4ef] bg-white text-[#475467]"
                    aria-label={`Open ${result.title}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#5f6978]">
                  {result.snippet || 'No summary available.'}
                </p>

                <a
                  href={result.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 block truncate text-xs text-[#667085] underline decoration-[#d4dbe6] underline-offset-4"
                >
                  {result.url}
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
