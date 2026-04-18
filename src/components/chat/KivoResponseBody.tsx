'use client';

import {
  ArrowUpRight,
  Check,
  CircleDollarSign,
  ExternalLink,
  Globe,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  TableProperties,
  Tags,
  Zap,
} from 'lucide-react';
import type { StructuredAnswer, StructuredHighlight } from '@/agent/vNext/types';

type KivoResponseBodyProps = {
  answer: StructuredAnswer;
};

type RuntimeSource = {
  id: string;
  label: string;
  used: boolean;
  url?: string;
  snippet?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: string;
  price?: string;
  rating?: number | string;
  reviewCount?: number | string;
  merchant?: string;
};

type InferredMode = 'search' | 'shopping' | 'compare' | 'general';

type CompareRow = {
  id: string;
  title: string;
  source: string;
  signal: string;
  url: string | null;
  price: string | null;
};

type ProductCard = {
  id: string;
  title: string;
  source: string;
  price: string;
  snippet: string;
  imageUrl: string | null;
  ratingLabel: string | null;
  url: string | null;
  accent: string;
};

function hasRenderableContent(answer: StructuredAnswer) {
  return Boolean(
    answer.title ||
      answer.lead ||
      answer.summary ||
      answer.highlights?.length ||
      answer.nextStep ||
      answer.sources?.some((source) => source.used) ||
      answer.plainText,
  );
}

function normalizeText(value?: string | null): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function getRuntimeSources(answer: StructuredAnswer): RuntimeSource[] {
  return (answer.sources ?? [])
    .filter((source) => source.used)
    .map((source) => source as RuntimeSource);
}

function inferMode(answer: StructuredAnswer, sources: RuntimeSource[]): InferredMode {
  const text = [
    answer.title,
    answer.lead,
    answer.summary,
    answer.plainText,
    ...sources.map((source) => source.label),
    ...sources.map((source) => source.snippet),
  ]
    .map((item) => normalizeText(item))
    .join(' ')
    .toLowerCase();

  const hasPrice =
    sources.some((source) => Boolean(extractPrice(source))) ||
    /\b(hinta|halvin|osta|ostettav|price|buy|shop|shopping|eur|€)\b/i.test(text);

  const compareSignals =
    /\b(vertaa|vertailu|compare|comparison|versus|vs\b|paras vaihtoehto)\b/i.test(
      text,
    ) || sources.length >= 3;

  if (hasPrice) return 'shopping';
  if (compareSignals) return 'compare';
  if (sources.length > 0) return 'search';
  return 'general';
}

function sourceHostname(url?: string | null): string {
  const raw = normalizeText(url);
  if (!raw) return 'Source';

  try {
    return new URL(raw).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function extractPrice(source: RuntimeSource): string | null {
  const direct = normalizeText(source.price);
  if (direct) return direct;

  const text = `${normalizeText(source.label)} ${normalizeText(source.snippet)}`;
  const match = text.match(
    /(?:€|\$|£)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|eur|usd|sek|kr)/i,
  );

  return match?.[0] ?? null;
}

function extractImage(source: RuntimeSource): string | null {
  return (
    normalizeText(source.imageUrl) ||
    normalizeText(source.image) ||
    normalizeText(source.thumbnail) ||
    null
  );
}

function extractRating(source: RuntimeSource): string | null {
  if (typeof source.rating === 'number') return `${source.rating.toFixed(1)}/5`;

  const raw = normalizeText(typeof source.rating === 'string' ? source.rating : '');
  if (raw) return raw.includes('/5') ? raw : `${raw}/5`;

  const text = `${normalizeText(source.label)} ${normalizeText(source.snippet)}`;
  const match = text.match(/\b([1-5](?:[.,]\d)?)\s*\/\s*5\b/);
  if (match?.[1]) return `${match[1].replace(',', '.')}/5`;

  return null;
}

function summarizeSnippet(value?: string | null): string {
  const text = normalizeText(value);
  if (!text) return 'No comparison signal available.';
  if (text.length <= 100) return text;
  return `${text.slice(0, 97).trim()}…`;
}

function initialsFromTitle(title: string) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return initials || 'K';
}

function accentForIndex(index: number) {
  const accents = [
    'from-[#ebf4ff] to-[#f8fbff]',
    'from-[#eefbf5] to-[#f8fdfb]',
    'from-[#fff6ec] to-[#fffaf4]',
    'from-[#f5f1ff] to-[#faf8ff]',
  ];

  return accents[index % accents.length];
}

function buildSourceChips(sources: RuntimeSource[]) {
  const seen = new Set<string>();

  return sources
    .map((source) => {
      const hostname = sourceHostname(source.url);
      if (hostname !== 'Source') return hostname;
      return normalizeText(source.label).split(' – ')[0] || 'Source';
    })
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    })
    .slice(0, 5);
}

function buildCompareRows(sources: RuntimeSource[]): CompareRow[] {
  return sources.slice(0, 4).map((source) => ({
    id: source.id,
    title: normalizeText(source.label) || 'Untitled result',
    source:
      sourceHostname(source.url) !== 'Source'
        ? sourceHostname(source.url)
        : normalizeText(source.label).split(' – ')[0] || 'Source',
    signal: summarizeSnippet(source.snippet),
    url: normalizeText(source.url) || null,
    price: extractPrice(source),
  }));
}

function buildProductCards(sources: RuntimeSource[]): ProductCard[] {
  return sources.slice(0, 6).map((source, index) => ({
    id: source.id,
    title: normalizeText(source.label) || 'Untitled product',
    source:
      normalizeText(source.merchant) ||
      (sourceHostname(source.url) !== 'Source'
        ? sourceHostname(source.url)
        : normalizeText(source.label).split(' – ')[0] || 'Store'),
    price: extractPrice(source) || 'See price',
    snippet: normalizeText(source.snippet) || 'Open product for more details.',
    imageUrl: extractImage(source),
    ratingLabel: extractRating(source),
    url: normalizeText(source.url) || null,
    accent: accentForIndex(index),
  }));
}

function highlightToneClasses(tone?: StructuredHighlight['tone']) {
  if (tone === 'important') {
    return {
      icon: 'bg-[#fff3da] text-[#8a651a]',
      text: 'text-[#5b4312]',
    };
  }

  if (tone === 'success') {
    return {
      icon: 'bg-[#ecf8ef] text-[#326644]',
      text: 'text-[#2f5c3f]',
    };
  }

  if (tone === 'warning') {
    return {
      icon: 'bg-[#fff1f1] text-[#8a4a4a]',
      text: 'text-[#7b3c3c]',
    };
  }

  return {
    icon: 'bg-[#edf5ff] text-[#58759a]',
    text: 'text-[#334155]',
  };
}

function renderSourceGrid(sources: RuntimeSource[]) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sources.map((source) => {
        const href = normalizeText(source.url) || '#';

        return (
          <a
            key={source.id}
            href={href}
            target="_blank"
            rel="noreferrer"
            className="group rounded-[22px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] p-4 shadow-[0_8px_20px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[#97a1af]">
                  {sourceHostname(source.url) !== 'Source'
                    ? sourceHostname(source.url)
                    : 'Source'}
                </p>
                <h4 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.018em] text-[#243041]">
                  {source.label}
                </h4>
              </div>

              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] bg-white text-[#6c7a8f] transition group-hover:text-[#253244]">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>

            {source.snippet ? (
              <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-[#5d697a]">
                {source.snippet}
              </p>
            ) : null}
          </a>
        );
      })}
    </div>
  );
}

export function KivoResponseBody({ answer }: KivoResponseBodyProps) {
  if (!hasRenderableContent(answer)) return null;

  const visibleSources = getRuntimeSources(answer);
  const mode = inferMode(answer, visibleSources);
  const sourceChips = buildSourceChips(visibleSources);
  const compareRows = buildCompareRows(visibleSources);
  const productCards = buildProductCards(visibleSources);
  const title = normalizeText(answer.title);
  const lead = normalizeText(answer.lead);
  const summary = normalizeText(answer.summary);
  const plainText = normalizeText(answer.plainText);

  return (
    <div className="rounded-[30px] border border-[rgba(222,229,238,0.78)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(247,250,254,0.98))] p-5 shadow-[0_20px_48px_rgba(15,23,42,0.07)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde6f0] bg-[#f9fbfe] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#718096]">
          <Sparkles className="h-3.5 w-3.5" />
          Kivo
        </span>

        {visibleSources.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d7eadc] bg-[#f4fbf6] px-3 py-1.5 text-[11px] font-semibold text-[#3c6c4a]">
            <ShieldCheck className="h-3.5 w-3.5" />
            Grounded answer
          </span>
        ) : null}

        {mode === 'shopping' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe8f3] bg-[#f5faff] px-3 py-1.5 text-[11px] font-semibold text-[#49627d]">
            <ShoppingBag className="h-3.5 w-3.5" />
            Shopping
          </span>
        ) : mode === 'compare' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe8f3] bg-[#f5faff] px-3 py-1.5 text-[11px] font-semibold text-[#49627d]">
            <TableProperties className="h-3.5 w-3.5" />
            Compare
          </span>
        ) : visibleSources.length ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dbe8f3] bg-[#f5faff] px-3 py-1.5 text-[11px] font-semibold text-[#49627d]">
            <Search className="h-3.5 w-3.5" />
            Search
          </span>
        ) : null}
      </div>

      {title ? (
        <h3 className="text-[26px] font-semibold leading-[1.08] tracking-[-0.045em] text-[#1f2937] sm:text-[30px]">
          {title}
        </h3>
      ) : null}

      {lead ? (
        <p className="mt-4 max-w-[780px] text-[20px] leading-[1.58] tracking-[-0.026em] text-[#2b3441]">
          {lead}
        </p>
      ) : null}

      {summary ? (
        <p className="mt-4 max-w-[780px] text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]">
          {summary}
        </p>
      ) : null}

      {visibleSources.length ? (
        <div className="mt-5 rounded-[24px] border border-[#e7edf5] bg-[linear-gradient(180deg,#fcfdff,#f8fbff)] p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e3e9f2] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8390a3]">
              <Globe className="h-3.5 w-3.5" />
              Live web
            </span>

            {sourceChips.map((chip, index) => (
              <span
                key={`${chip}-${index}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-[#fbfdff] px-3 py-1.5 text-[12px] text-[#637489]"
              >
                <Tags className="h-3.5 w-3.5" />
                {chip}
              </span>
            ))}

            {mode === 'shopping' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[12px] text-[#5f7086]">
                <CircleDollarSign className="h-3.5 w-3.5" />
                Price-aware
              </span>
            ) : null}

            {mode === 'compare' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ecf4] bg-white px-3 py-1.5 text-[12px] text-[#5f7086]">
                <TableProperties className="h-3.5 w-3.5" />
                Side-by-side
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {answer.highlights?.length ? (
        <div className="mt-5 space-y-3 rounded-[22px] border border-[#e8edf4] bg-[linear-gradient(180deg,#fbfcfe,#f7fafe)] p-4">
          {answer.highlights.map((highlight, index) => {
            const tone = highlightToneClasses(highlight.tone);

            return (
              <div key={`${highlight.text}-${index}`} className="flex gap-3">
                <span
                  className={`mt-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${tone.icon}`}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <p className={`text-[15px] leading-[1.68] ${tone.text}`}>
                  {highlight.text}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}

      {mode === 'shopping' && productCards.length ? (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                Products
              </p>
              <p className="mt-1 text-[13px] text-[#6c7788]">
                Premium shopping cards
              </p>
            </div>

            <span className="rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
              {productCards.length} items
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {productCards.map((product) => {
              const content = (
                <>
                  <div className={`relative h-44 bg-gradient-to-br ${product.accent}`}>
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/80 bg-white/90 text-[22px] font-semibold text-[#5f7086] shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                          {initialsFromTitle(product.title)}
                        </div>
                      </div>
                    )}

                    <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#576b83] backdrop-blur">
                      <ShoppingBag className="h-3.5 w-3.5" />
                      {product.source}
                    </div>

                    {product.ratingLabel ? (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-[#576b83] backdrop-blur">
                        <Star className="h-3.5 w-3.5" />
                        {product.ratingLabel}
                      </div>
                    ) : null}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="line-clamp-2 text-[16px] font-semibold leading-[1.35] tracking-[-0.02em] text-[#243041]">
                        {product.title}
                      </h4>
                      <ExternalLink className="h-4 w-4 shrink-0 text-[#95a0b0]" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ebf3] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#52677f]">
                        <CircleDollarSign className="h-3.5 w-3.5" />
                        {product.price}
                      </span>

                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e6ebf3] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#6c7c90]">
                        {product.source}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-3 text-[13px] leading-[1.65] text-[#5d697a]">
                      {product.snippet}
                    </p>
                  </div>
                </>
              );

              if (product.url) {
                return (
                  <a
                    key={product.id}
                    href={product.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group overflow-hidden rounded-[24px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_30px_rgba(15,23,42,0.08)]"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-[24px] border border-[#e7edf5] bg-[linear-gradient(180deg,#ffffff,#fbfdff)] shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {mode === 'compare' && compareRows.length >= 2 ? (
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                Compare table
              </p>
              <p className="mt-1 text-[13px] text-[#6c7788]">
                Fast side-by-side scan
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
              <TableProperties className="h-3.5 w-3.5" />
              {compareRows.length} rows
            </span>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-[#e7edf5] bg-white">
            <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-3 border-b border-[#edf2f7] bg-[#f8fbff] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8b98a9]">
              <div>Option</div>
              <div>Source</div>
              <div>Signal</div>
              <div>Link</div>
            </div>

            <div className="divide-y divide-[#eef2f7]">
              {compareRows.map((row) => (
                <div
                  key={row.id}
                  className="grid grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] gap-3 px-4 py-4 text-[13px] text-[#425164]"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-2 font-semibold leading-[1.45] text-[#243041]">
                      {row.title}
                    </p>
                    {row.price ? (
                      <p className="mt-1 text-[12px] font-medium text-[#4a6a53]">
                        {row.price}
                      </p>
                    ) : null}
                  </div>

                  <div className="min-w-0">
                    <span className="inline-flex max-w-full items-center rounded-full border border-[#e7edf4] bg-[#fbfdff] px-2.5 py-1 text-[12px] font-medium text-[#64758b]">
                      <span className="truncate">{row.source}</span>
                    </span>
                  </div>

                  <div className="min-w-0 text-[12.5px] leading-[1.6] text-[#627184]">
                    {row.signal}
                  </div>

                  <div className="flex items-start justify-end">
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#dfe7f1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#415164] transition hover:border-[#cfd9e6] hover:bg-[#f8fbff]"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#eef2f7] bg-[#fafcff] px-3 py-1.5 text-[12px] font-medium text-[#91a0b2]">
                        No link
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {answer.nextStep ? (
        <div className="mt-5 rounded-[22px] border border-[#e8edf4] bg-white/80 p-4">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#96a0af]">
            <Zap className="h-3.5 w-3.5" />
            Next step
          </div>
          <p className="mt-2 max-w-[760px] text-[15px] leading-[1.68] tracking-[-0.012em] text-[#334155]">
            {answer.nextStep}
          </p>
        </div>
      ) : null}

      {visibleSources.length && mode === 'search' ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#95a0b0]">
                Live web
              </p>
              <p className="mt-1 text-[13px] text-[#6c7788]">
                Grounded sources
              </p>
            </div>

            <span className="rounded-full border border-[#e5ebf3] bg-white px-3 py-1.5 text-[11px] font-medium text-[#748091]">
              {visibleSources.length} sources
            </span>
          </div>

          {renderSourceGrid(visibleSources)}
        </div>
      ) : null}

      {!title &&
      !lead &&
      !summary &&
      !answer.highlights?.length &&
      !answer.nextStep &&
      !visibleSources.length &&
      plainText ? (
        <p className="mt-4 max-w-[780px] whitespace-pre-wrap text-[16.8px] leading-[1.74] tracking-[-0.012em] text-[#435062]">
          {plainText}
        </p>
      ) : null}
    </div>
  );
}
