import type { StructuredAnswer } from './types';
import type { StructuredPayloadSchema, ToolSummaryItem } from './generator-types';
import { asArray, asObject, normalizeText, unique } from './generator-types';

type SearchSourceChip = {
  label: string;
  href?: string | null;
};

type SearchResultItem = NonNullable<StructuredPayloadSchema['sources']>[number];

const INTERNAL_PATTERNS = [
  /\bhere is the most useful answer for your request\b/i,
  /\bconsidering earlier context\b/i,
  /\blive browser search results\b/i,
  /\bprovider:\b/i,
  /\bmode:\b/i,
  /\bquery:\b/i,
  /\burl:\b/i,
  /\bsnippet:\b/i,
  /\bsource:\b/i,
];

function uniqueJson<T>(items: T[]): T[] {
  return unique(items.map((item) => JSON.stringify(item))).map(
    (value) => JSON.parse(value) as T,
  );
}

function hasInternalJunk(text: string): boolean {
  return INTERNAL_PATTERNS.some((pattern) => pattern.test(text));
}

function cleanVisibleText(text: string): string {
  return normalizeText(
    text
      .replace(/live browser search results/gi, '')
      .replace(/here is the most useful answer for your request:?/gi, '')
      .replace(/considering earlier context:?/gi, '')
      .replace(/\bquery:\s*[^.]+/gi, '')
      .replace(/\bmode:\s*[^.]+/gi, '')
      .replace(/\bprovider:\s*[^.]+/gi, '')
      .replace(/\burl:\s*https?:\/\/\S+/gi, '')
      .replace(/\bsnippet:\s*/gi, '')
      .replace(/\s+/g, ' '),
  );
}

function shorten(text: string, maxLength: number): string {
  const normalized = normalizeText(text);
  if (normalized.length <= maxLength) return normalized;

  const sliced = normalized.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  return `${(lastSpace > 60 ? sliced.slice(0, lastSpace) : sliced).trim()}…`;
}

function normalizeDomain(url?: string | null, fallback?: string | null): string | null {
  const explicit = normalizeText(fallback);
  if (explicit) return explicit;

  const normalizedUrl = normalizeText(url);
  if (!normalizedUrl) return null;

  try {
    return new URL(normalizedUrl).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function toSearchResult(raw: unknown, index: number): SearchResultItem | null {
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
    normalizeDomain(
      url,
      normalizeText(
        record.domain || record.source || record.publisher || record.site || record.label,
      ) || null,
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
      href: normalizeText(record.href || record.url || record.link) || null,
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

  return uniqueJson(chips)
    .filter((chip) => chip.label.length > 0)
    .slice(0, 8);
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

  return uniqueJson(results)
    .filter((result) => result.title.length > 0)
    .slice(0, 8);
}

function splitIntoSentences(text: string): string[] {
  return normalizeText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter(Boolean);
}

function extractReadableSentencesFromResults(results: SearchResultItem[]): string[] {
  const candidates: string[] = [];

  for (const result of results.slice(0, 4)) {
    const fromSnippet = splitIntoSentences(result.snippet || '');
    const fromTitle = splitIntoSentences(result.title);

    for (const sentence of [...fromSnippet, ...fromTitle]) {
      const cleaned = cleanVisibleText(sentence);

      if (!cleaned) continue;
      if (cleaned.length < 28) continue;
      if (hasInternalJunk(cleaned)) continue;
      if (/^https?:\/\//i.test(cleaned)) continue;

      candidates.push(cleaned);
    }
  }

  return unique(candidates).slice(0, 4);
}

function inferLocalizedLead(language: string, query: string, hasResults: boolean): string {
  const wantsNews =
    /\b(news|latest|recent|today|headlines|uutiset|uusimmat|ajankohtaiset)\b/i.test(
      query,
    );

  if (language.startsWith('fi')) {
    if (!hasResults) return 'En löytänyt varmoja ajankohtaisia tuloksia.';
    return wantsNews
      ? 'Tässä tärkeimmät ajankohtaiset löydöt.'
      : 'Tässä tärkeimmät löydöt hausta.';
  }

  if (language.startsWith('sv')) {
    if (!hasResults) return 'Jag hittade inga tydliga aktuella resultat.';
    return wantsNews
      ? 'Här är de viktigaste aktuella resultaten.'
      : 'Här är de viktigaste resultaten.';
  }

  if (language.startsWith('es')) {
    if (!hasResults) return 'No encontré resultados actuales claros.';
    return wantsNews
      ? 'Aquí están los hallazgos más importantes y recientes.'
      : 'Aquí están los hallazgos más importantes.';
  }

  if (!hasResults) return 'I could not find clear current results.';
  return wantsNews
    ? 'Here are the most relevant recent updates.'
    : 'Here are the most relevant findings.';
}

export function buildSearchUserFacingText(params: {
  language: string;
  query: string;
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
  currentText?: string | null;
}): string {
  const { language, query, structured, toolSummaries, currentText } = params;

  const results = buildResultsFromToolData(toolSummaries);
  const readableSentences = extractReadableSentencesFromResults(results);

  const cleanedCurrent = cleanVisibleText(currentText || '');
  const currentLooksGood =
    cleanedCurrent.length > 0 &&
    cleanedCurrent.length <= 320 &&
    !hasInternalJunk(currentText || '') &&
    !/https?:\/\//i.test(cleanedCurrent);

  if (currentLooksGood) {
    return cleanedCurrent;
  }

  const lead = inferLocalizedLead(language, query, results.length > 0);

  const structuredSummary = cleanVisibleText(structured.summary || structured.lead || '');
  const usableStructuredSummary =
    structuredSummary &&
    structuredSummary.length <= 220 &&
    !hasInternalJunk(structuredSummary)
      ? structuredSummary
      : '';

  const lines: string[] = [lead];

  if (usableStructuredSummary) {
    lines.push(shorten(usableStructuredSummary, 220));
  } else if (readableSentences.length > 0) {
    lines.push(shorten(readableSentences[0], 220));
    if (readableSentences[1]) {
      lines.push(shorten(readableSentences[1], 220));
    }
  } else if (results[0]) {
    const domain = results[0].domain ? ` (${results[0].domain})` : '';
    lines.push(shorten(`${results[0].title}${domain}`, 220));
  }

  return normalizeText(lines.join(' '));
}

export function buildSearchResponse(params: {
  structured: StructuredAnswer;
  toolSummaries: ToolSummaryItem[];
}): Partial<StructuredPayloadSchema> {
  const { structured, toolSummaries } = params;

  const sourceChips = buildSourceChipsFromToolData(toolSummaries);
  const sources = buildResultsFromToolData(toolSummaries);

  const summary =
    normalizeText(structured.summary || structured.lead) ||
    (sources.length ? `Found ${sources.length} relevant sources.` : undefined);

  return {
    lead: structured.lead || null,
    summary: summary || null,
    sourceChips,
    sources,
  };
}
