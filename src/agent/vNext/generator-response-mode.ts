import type { StructuredAnswer } from './types';
import type {
  GenerateFinalAnswerInput,
  GeneratorResponseType,
  ToolSummaryItem,
} from './generator-types';
import { asArray, asObject, getRequestText, normalizeText } from './generator-types';

function hasMeaningfulData(summary: ToolSummaryItem): boolean {
  const dataKeys = Object.keys(summary.data);
  return dataKeys.length > 0 || summary.summary.length > 0;
}

function hasTool(
  toolSummaries: ToolSummaryItem[],
  tool: string,
): boolean {
  return toolSummaries.some(
    (item) => item.ok && item.tool === tool && hasMeaningfulData(item),
  );
}

function countItems(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function hasNestedResults(item: ToolSummaryItem): boolean {
  const data = asObject(item.data);
  return (
    countItems(data.results) > 0 ||
    countItems(data.webResults) > 0 ||
    countItems(data.searchResults) > 0 ||
    countItems(data.sources) > 0 ||
    countItems(asObject(data.browser_search).results) > 0
  );
}

function hasNestedProducts(item: ToolSummaryItem): boolean {
  const data = asObject(item.data);
  return (
    countItems(data.products) > 0 ||
    countItems(data.productCards) > 0 ||
    countItems(data.shoppingResults) > 0
  );
}

function hasShoppingData(toolSummaries: ToolSummaryItem[]): boolean {
  return toolSummaries.some(
    (item) =>
      item.ok &&
      (item.tool === 'web' || item.tool === 'shopping') &&
      hasNestedProducts(item),
  );
}

function hasSearchData(toolSummaries: ToolSummaryItem[]): boolean {
  return toolSummaries.some(
    (item) =>
      item.ok &&
      (item.tool === 'web' ||
        item.tool === 'browser_search' ||
        item.tool === 'search') &&
      hasNestedResults(item),
  );
}

function hasCompareData(toolSummaries: ToolSummaryItem[]): boolean {
  return toolSummaries.some((item) => {
    if (!item.ok || item.tool !== 'compare') return false;
    const data = asObject(item.data);
    return (
      countItems(data.scorecards) > 0 ||
      countItems(data.compareRows) > 0 ||
      countItems(data.rows) > 0
    );
  });
}

function hasEmailData(toolSummaries: ToolSummaryItem[]): boolean {
  return toolSummaries.some((item) => {
    if (!item.ok) return false;
    const data = asObject(item.data);

    if (item.tool === 'gmail') {
      const result = asObject(data.result);
      return (
        countItems(data.messages) > 0 ||
        countItems(data.emails) > 0 ||
        countItems(result.messages) > 0 ||
        countItems(result.urgentMessages) > 0
      );
    }

    if (item.tool === 'calendar') {
      const result = asObject(data.result);
      return (
        countItems(data.events) > 0 ||
        countItems(result.events) > 0
      );
    }

    return false;
  });
}

function hasOperatorSignals(structured?: StructuredAnswer): boolean {
  return Boolean(
    structured?.nextStep ||
      structured?.highlights?.length ||
      structured?.sources?.length,
  );
}

function hasStrongShoppingIntent(query: string): boolean {
  return /\b(best|buy|shopping|shop|recommend|under\s+\d+|cheapest|deal|price)\b/i.test(
    query,
  );
}

function hasStrongComparisonIntent(query: string): boolean {
  return /\b(compare|vs\.?|versus|difference|which is better)\b/i.test(query);
}

function hasStrongSearchIntent(query: string): boolean {
  return /\b(latest|news|search|source|sources|report|article|what happened|recent|current)\b/i.test(
    query,
  );
}

function hasStrongEmailIntent(query: string): boolean {
  return /\b(email|gmail|inbox|calendar|meeting|schedule|events|what do i have today)\b/i.test(
    query,
  );
}

export function decideResponseMode(params: {
  input: GenerateFinalAnswerInput;
  toolSummaries: ToolSummaryItem[];
  structured?: StructuredAnswer;
  confidence?: number;
}): GeneratorResponseType {
  const {
    input,
    toolSummaries,
    structured,
    confidence = input.route.confidence ?? 0.6,
  } = params;

  const query = normalizeText(getRequestText(input.request)).toLowerCase();

  const shoppingIntent =
    input.route.intent === 'shopping' || hasStrongShoppingIntent(query);
  const compareIntent =
    input.route.intent === 'compare' || hasStrongComparisonIntent(query);
  const searchIntent =
    input.route.intent === 'research' || hasStrongSearchIntent(query);
  const emailIntent =
    input.route.intent === 'gmail' ||
    input.route.intent === 'planning' ||
    input.route.intent === 'productivity' ||
    hasStrongEmailIntent(query);

  const shoppingData = hasShoppingData(toolSummaries);
  const compareData = hasCompareData(toolSummaries);
  const searchData = hasSearchData(toolSummaries);
  const emailData = hasEmailData(toolSummaries);

  // Highest-confidence data-first decisions.
  if (compareData) return 'compare';
  if (shoppingData) return 'shopping';
  if (emailData) return 'email';
  if (searchData) return 'search';

  // Intent-only decisions should be more conservative.
  if (compareIntent && hasTool(toolSummaries, 'compare')) return 'compare';
  if (emailIntent && (hasTool(toolSummaries, 'gmail') || hasTool(toolSummaries, 'calendar'))) {
    return 'email';
  }

  // Do not force shopping just from generic words like "best" or "price"
  // unless real product data exists or the route intent is explicitly shopping.
  if (input.route.intent === 'shopping' && hasTool(toolSummaries, 'web')) {
    return 'shopping';
  }

  if (searchIntent && hasTool(toolSummaries, 'web')) {
    return 'search';
  }

  if (hasTool(toolSummaries, 'finance')) return 'operator';

  if (confidence >= 0.66 && hasOperatorSignals(structured)) {
    return 'operator';
  }

  return 'plain';
}
