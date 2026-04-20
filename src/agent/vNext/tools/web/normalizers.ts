import type { BrowserSearchMode, BrowserSearchResult } from '@/lib/browser-search/search';
import { normalizeText, unique } from '../helpers';
import type { WebProductItem, WebSearchItem } from '../types';

export function normalizeBrowserResult(result: BrowserSearchResult, index: number): WebSearchItem {
  return {
    id: `web-result-${index + 1}`,
    title: normalizeText(result.title) || 'Untitled',
    url: normalizeText(result.url),
    snippet: normalizeText(result.snippet),
    source: normalizeText(result.source) || null,
  };
}

function extractPriceFromSnippet(snippet: string): string | null {
  const text = normalizeText(snippet);
  if (!text) return null;

  const patterns = [/€\s?\d[\d.,]*/i, /\d[\d.,]*\s?€/i, /\$\s?\d[\d.,]*/i, /\d[\d.,]*\s?\$/i, /\b\d[\d.,]*\s?(eur|usd|gbp)\b/i];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0].trim();
  }
  return null;
}

export function normalizeShoppingProducts(results: WebSearchItem[]): WebProductItem[] {
  return results.map((result, index) => ({
    id: `web-product-${index + 1}`,
    title: result.title,
    price: extractPriceFromSnippet(result.snippet),
    source: result.source,
    imageUrl: null,
    url: result.url,
    description: result.snippet || null,
  }));
}

export function buildSearchSources(results: WebSearchItem[]) {
  return results.map((result) => ({
    id: result.id,
    title: result.title,
    domain: result.source,
    snippet: result.snippet || null,
    url: result.url || null,
  }));
}

export function buildSourceChips(results: WebSearchItem[]) {
  return unique(results.map((result) => result.source).filter((source): source is string => Boolean(source)))
    .slice(0, 8)
    .map((source) => ({ label: source, href: null }));
}

export function buildResponseType(mode: BrowserSearchMode): 'search' | 'shopping' {
  return mode === 'shopping' ? 'shopping' : 'search';
}
