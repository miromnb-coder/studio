import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText, unique } from './generator-types';

type SearchSourceChip = {
  label: string;
  href?: string | null;
};

type SearchResultItem = NonNullable<StructuredPayloadSchema['sources']>[number];

function uniqueJson<T>(items: T[]): T[] {
  return unique(items.map((item) => JSON.stringify(item))).map(
    (value) => JSON.parse(value) as T,
  );
}

function toSearchResult(
  raw: unknown,
  index: number,
): SearchResultItem | null {
  const record = asObject(raw);

  const title = normalizeText(
    record.title ||
      record.label ||
      record.name ||
      record.headline ||
      record.source ||
      record.domain ||
      record.publisher,
  );

  if (!title) return null;

  const url = normalizeText(record.url || record.href || record.link) || null;
  const domain =
    normalizeText(
      record.domain ||
        record.source ||
        record.publisher ||
        record.label ||
        record.site,
    ) || null;

  const snippet =
    normalizeText(
      record.snippet ||
        record.summary ||
        record.preview ||
        record.description ||
        record.content,
    ) || null;

  return {
    id: normalizeText(record.id) || `result-${index}`,
    title,
    domain,
    snippet,
    url,
  };
}

function extractSourceChipsFromArray(items: unknown[]): SearchSourceChip[] {
  const chips: SearchSourceChip[] = [];

  for (const item of items) {
    const record = asObject(item);
    const label = normalizeText(
      record.label ||
        record.source ||
        record.domain ||
        record.publisher ||
        record.name ||
        record.title,
    );

    if (!label) continue;

    chips.push({
      label,
      href:
        normalizeText(record.href || record.url || record.link) || null,
    });
  }

  return chips;
}

function buildSourceChipsFromToolData(
  toolSummaries: ToolSummaryItem[],
): SearchSourceChip[] {
  const chips: SearchSourceChip[] = [];

  for (const item of toolSummaries) {
    if (!item.ok) continue;

    const data = asObject(item.data);

    const arraysToInspect = [
      asArray(data.sourceChips),
      asArray(data.sources),
      asArray(data.results),
      asArray(data.webResults),
      asArray(data.searchResults),
      asArray(asObject(data.browser_search).results),
    ];

    for (const arr of arraysToInspect) {
      chips.push(...extractSourceChipsFromArray(arr));
    }
  }

  return uniqueJson(chips).slice(0, 8);
}

function buildResultsFromToolData(
  toolSummaries: ToolSummaryItem[],
): SearchResultItem[] {
  const results: SearchResultItem[] = [];

  for (const item of toolSummaries) {
    if (!item.ok) continue;

    const data = asObject(item.data);

    const rawCollections = [
      asArray(data.results),
      asArray(data.webResults),
      asArray(data.searchResults),
      asArray(data.sources),
      asArray(asObject(data.browser_search).results),
    ];

    for (const collection of rawCollections) {
      for (const raw of collection) {
        const next = toSearchResult(raw, results.length);
        if (next) results.push(next);
      }
    }
  }

  return uniqueJson(results).slice(0, 8);
}

export function buildSearchResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;

  const sourceChips = buildSourceChipsFromToolData(toolSummaries);
  const sources = buildResultsFromToolData(toolSummaries);

  const lead =
    structured.lead ||
    structured.summary ||
    (sources.length
      ? 'Here are the most relevant live results I found.'
      : undefined);

  const summary =
    structured.summary ||
    (sources.length
      ? `Found ${sources.length} relevant sources.`
      : undefined);

  return {
    lead,
    summary,
    sourceChips,
    sources,
  };
}
