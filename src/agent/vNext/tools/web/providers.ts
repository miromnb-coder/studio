import {
  getBrowserSearchProvider,
  hasBrowserSearchConfigured,
  runBrowserSearch,
  type BrowserSearchMode,
} from '@/lib/browser-search/search';
import type { ProviderRunResult } from '../types';

const DEFAULT_TIMEOUT_MS = 12000;

function configuredProviders(): string[] {
  const primary = getBrowserSearchProvider();
  const fallback = primary === 'tavily' ? 'serper' : 'tavily';
  return [primary, fallback];
}

function hasProviderCredentials(provider: string): boolean {
  return provider === 'tavily' ? Boolean(process.env.TAVILY_API_KEY) : Boolean(process.env.SERPER_API_KEY);
}

async function withProvider<T>(provider: string, runner: () => Promise<T>): Promise<T> {
  const previous = process.env.BROWSER_SEARCH_PROVIDER;
  process.env.BROWSER_SEARCH_PROVIDER = provider;
  try {
    return await runner();
  } finally {
    process.env.BROWSER_SEARCH_PROVIDER = previous;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(`Search provider timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  });
}

export function getProviderStatus() {
  const provider = getBrowserSearchProvider();
  return {
    provider,
    configured: hasBrowserSearchConfigured(),
    availableProviders: configuredProviders().filter(hasProviderCredentials),
  };
}

export async function runSearchWithFallback(params: {
  query: string;
  mode: BrowserSearchMode;
  timeoutMs?: number;
}): Promise<ProviderRunResult> {
  const attempts = configuredProviders();
  const errors: string[] = [];

  for (let index = 0; index < attempts.length; index += 1) {
    const provider = attempts[index];
    if (!hasProviderCredentials(provider)) {
      errors.push(`${provider}: missing credentials`);
      continue;
    }

    try {
      const result = await withTimeout(
        withProvider(provider, () => runBrowserSearch({ query: params.query, mode: params.mode })),
        params.timeoutMs,
      );

      return {
        provider: result.provider,
        mode: result.mode,
        results: result.results,
        fallbackUsed: index > 0,
        attemptedProviders: attempts.slice(0, index + 1),
      };
    } catch (error) {
      errors.push(`${provider}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  throw new Error(`All providers failed. ${errors.join(' | ')}`);
}
