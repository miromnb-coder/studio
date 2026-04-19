import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText, unique } from './generator-types';

function buildSourceChipsFromToolData(toolSummaries: ToolSummaryItem[]) {
  const chips: Array<{ label: string; href?: string | null }> = [];

  for (const item of toolSummaries) {
    if (!item.ok) continue;

    const data = asObject(item.data);
    const sourceish = asArray(data.sources);

    for (const source of sourceish) {
      const record = asObject(source);
      const label = normalizeText(record.label || record.source || record.domain || record.name);
      if (!label) continue;
      chips.push({ label, href: normalizeText(record.href || record.url) || null });
    }
  }

  return unique(chips.map((chip) => JSON.stringify(chip)))
    .map((value) => JSON.parse(value) as { label: string; href?: string | null })
    .slice(0, 8);
}

export function buildSearchResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;
  const results: StructuredPayloadSchema['sources'] = [];

  for (const item of toolSummaries) {
    if (item.tool !== 'web' || !item.ok) continue;

    const data = asObject(item.data);
    const rawResults =
      asArray(data.results).length > 0
        ? asArray(data.results)
        : asArray(data.webResults).length > 0
          ? asArray(data.webResults)
          : asArray(data.searchResults);

    for (const raw of rawResults) {
      const record = asObject(raw);
      const title = normalizeText(record.title || record.label || record.name);
      if (!title) continue;
      results.push({
        id: normalizeText(record.id) || `result-${results.length}`,
        title,
        domain: normalizeText(record.domain || record.source || record.publisher) || null,
        snippet: normalizeText(record.snippet || record.summary || record.preview) || null,
        url: normalizeText(record.url || record.href) || null,
      });
    }
  }

  return {
    lead: structured.lead || structured.summary,
    summary: structured.summary,
    sourceChips: buildSourceChipsFromToolData(toolSummaries),
    sources: results.slice(0, 8),
  };
}
