import { inferBrowserSearchMode, type BrowserSearchMode } from '@/lib/browser-search/search';
import type { ToolInput, WebAction } from '../types';
import { hasAnyPattern, normalizeLower } from '../helpers';

export function normalizeWebAction(input: ToolInput, query: string): WebAction {
  const explicit = normalizeLower(input.action);
  if (['status', 'search', 'research', 'shopping', 'products', 'fetch'].includes(explicit)) {
    return explicit as WebAction;
  }

  const modeHint = normalizeLower(input.mode);
  if (modeHint === 'shopping') return 'shopping';
  if (modeHint === 'news') return 'research';

  const lowered = normalizeLower(query);
  if (hasAnyPattern(lowered, [/\bshopping\b/i, /\bproduct\b/i, /\bbuy\b/i, /\bprice\b/i, /\bshop\b/i])) return 'shopping';
  if (hasAnyPattern(lowered, [/\bresearch\b/i, /\bnews\b/i, /\blatest\b/i, /\bcurrent\b/i, /\btoday\b/i])) return 'research';
  if (hasAnyPattern(lowered, [/\bfetch\b/i, /\bopen\b/i, /\blook up\b/i, /\bfind\b/i])) return 'search';

  return 'search';
}

export function resolveWebMode(input: ToolInput, query: string, action: WebAction): BrowserSearchMode {
  const modeHint = normalizeLower(input.mode);
  if (action === 'shopping' || action === 'products') return 'shopping';
  if (action === 'research') return 'news';
  if (modeHint === 'shopping') return 'shopping';
  if (modeHint === 'news') return 'news';
  return inferBrowserSearchMode(query);
}

export function summarizeWebResults(mode: BrowserSearchMode, query: string, count: number): string {
  if (mode === 'shopping') return count > 0 ? `Found ${count} product results for "${query}".` : `No product results found for "${query}".`;
  if (mode === 'news') return count > 0 ? `Found ${count} recent news results for "${query}".` : `No recent news results found for "${query}".`;
  return count > 0 ? `Found ${count} search results for "${query}".` : `No search results found for "${query}".`;
}
