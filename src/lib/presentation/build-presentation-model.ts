import type { Message } from '@/app/store/app-store-types';
import type { AgentResponseMetadata } from '@/types/agent-response';
import type { UiMode } from './resolve-ui-mode';

export type PresentationSource = {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  domain: string;
};

export type CompareItem = {
  id: string;
  option: string;
  source: string;
  signal: string;
  url?: string;
};

export type ProductItem = {
  id: string;
  title: string;
  price: string;
  source: string;
  imageUrl?: string;
  url?: string;
  snippet?: string;
};

export type EmailItem = {
  id: string;
  sender: string;
  subject: string;
  summary: string;
};

export type OperatorItem = {
  decision?: string;
  nextStep?: string;
  risk?: string;
  opportunity?: string;
  actions: string[];
};

export type PresentationModel = {
  mode: UiMode;
  title?: string;
  lead?: string;
  summary: string;
  plainText: string;
  chips: string[];
  sources: PresentationSource[];
  compareItems: CompareItem[];
  products: ProductItem[];
  emails: EmailItem[];
  operator?: OperatorItem;
  isStreaming: boolean;
};

type Args = {
  mode: UiMode;
  message: Message;
  metadata?: AgentResponseMetadata;
  latestUserContent?: string;
};

type BrowserSearchResult = {
  title?: string;
  url?: string;
  snippet?: string;
  source?: string;
  price?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: string;
};

type RuntimeStructuredSource = {
  id?: string;
  label?: string;
  used?: boolean;
  url?: string;
  snippet?: string;
  domain?: string;
  price?: string;
  imageUrl?: string;
  image?: string;
  thumbnail?: string;
};

type EmailRecord = {
  id?: string;
  sender?: string;
  from?: string;
  subject?: string;
  summary?: string;
  snippet?: string;
};

function normalize(value?: string | null): string {
  return (value ?? '').trim();
}

function firstAvailable(...values: Array<string | undefined | null>): string {
  return values.map((value) => normalize(value)).find(Boolean) ?? '';
}

function domainFromUrl(url: string): string {
  if (!url) return 'Source';

  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

function buildPlainText(message: Message): string {
  if (normalize(message.content)) return normalize(message.content);

  const structured = message.structured;

  return firstAvailable(
    structured?.summary,
    structured?.lead,
    structured?.plainText,
    structured?.title,
  );
}

function buildSummary(message: Message): string {
  const structured = message.structured;

  return firstAvailable(
    structured?.summary,
    structured?.lead,
    structured?.plainText,
    normalize(message.content),
    structured?.title,
  );
}

function buildLead(message: Message): string {
  return firstAvailable(message.structured?.lead);
}

function extractBrowserResults(metadata?: AgentResponseMetadata): BrowserSearchResult[] {
  const raw = metadata?.structuredData?.browser_search as
    | { results?: BrowserSearchResult[] }
    | undefined;

  return Array.isArray(raw?.results) ? raw.results : [];
}

function extractStructuredSources(message: Message): RuntimeStructuredSource[] {
  const raw = message.structured?.sources as RuntimeStructuredSource[] | undefined;
  return Array.isArray(raw) ? raw.filter((source) => source?.used !== false) : [];
}

function extractPrice(value: {
  price?: string;
  snippet?: string;
  title?: string;
}): string {
  const direct = normalize(value.price);
  if (direct) return direct;

  const text = `${normalize(value.title)} ${normalize(value.snippet)}`;
  const fromText = text.match(
    /(?:€|\$|£)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|eur|usd|sek|kr)/i,
  )?.[0];

  return fromText ?? '';
}

function uniqueByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const output: T[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }

  return output;
}

function sourceKey(source: PresentationSource): string {
  return `${source.url}::${source.title}::${source.domain}`;
}

function buildSources(
  message: Message,
  metadata?: AgentResponseMetadata,
): PresentationSource[] {
  const browserResults = extractBrowserResults(metadata);
  const structuredSources = extractStructuredSources(message);

  const sourcesFromBrowser = browserResults
    .map((result, index) => {
      const url = normalize(result.url);
      const title = normalize(result.title);

      if (!url && !title) return null;

      const domain = normalize(result.source) || domainFromUrl(url);

      return {
        id: `web-${index}`,
        title: title || domain || 'Source',
        url,
        snippet: normalize(result.snippet) || undefined,
        domain: domain || 'Source',
      } satisfies PresentationSource;
    })
    .filter(isNonNullable);

  const sourcesFromStructured = structuredSources
    .map((source, index) => {
      const title = firstAvailable(source.label, source.domain, 'Source');
      const url = normalize(source.url);
      const snippet = normalize(source.snippet) || undefined;
      const domain =
        firstAvailable(source.domain, domainFromUrl(url), source.label) || 'Source';

      if (!title && !url && !snippet) return null;

      return {
        id: normalize(source.id) || `structured-${index}`,
        title,
        url,
        snippet,
        domain,
      } satisfies PresentationSource;
    })
    .filter(isNonNullable);

  return uniqueByKey(
    [...sourcesFromBrowser, ...sourcesFromStructured].slice(0, 12),
    sourceKey,
  ).slice(0, 8);
}

function buildChips(sources: PresentationSource[]): string[] {
  return Array.from(
    new Set(
      sources
        .map((source) => normalize(source.domain))
        .filter(Boolean),
    ),
  ).slice(0, 6);
}

function buildCompareItems(
  mode: UiMode,
  message: Message,
  metadata?: AgentResponseMetadata,
): CompareItem[] {
  if (mode !== 'compare') return [];

  const browserResults = extractBrowserResults(metadata);
  const structuredSources = extractStructuredSources(message);

  const browserCompare = browserResults
    .map((result, index) => {
      const option = normalize(result.title);
      if (!option) return null;

      const signal = firstAvailable(result.snippet, 'No comparison signal.');
      const url = normalize(result.url) || undefined;
      const source = firstAvailable(result.source, domainFromUrl(normalize(result.url)), 'Source');

      return {
        id: `compare-web-${index}`,
        option,
        source,
        signal,
        url,
      } satisfies CompareItem;
    })
    .filter(isNonNullable);

  const structuredCompare = structuredSources
    .map((source, index) => {
      const option = normalize(source.label);
      if (!option) return null;

      return {
        id: normalize(source.id) || `compare-structured-${index}`,
        option,
        source: firstAvailable(source.domain, domainFromUrl(normalize(source.url)), 'Source'),
        signal: firstAvailable(source.snippet, 'No comparison signal.'),
        url: normalize(source.url) || undefined,
      } satisfies CompareItem;
    })
    .filter(isNonNullable);

  return uniqueByKey(
    [...browserCompare, ...structuredCompare],
    (item) => `${item.option}::${item.source}::${item.url ?? ''}`,
  ).slice(0, 4);
}

function buildProducts(
  mode: UiMode,
  message: Message,
  metadata?: AgentResponseMetadata,
): ProductItem[] {
  if (mode !== 'shopping') return [];

  const browserResults = extractBrowserResults(metadata);
  const structuredSources = extractStructuredSources(message);

  const browserProducts = browserResults
    .map((result, index) => {
      const title = normalize(result.title);
      if (!title) return null;

      const url = normalize(result.url) || undefined;
      const source = firstAvailable(result.source, domainFromUrl(normalize(result.url)), 'Store');

      return {
        id: `product-web-${index}`,
        title,
        price: extractPrice(result) || 'See price',
        source,
        imageUrl:
          firstAvailable(result.imageUrl, result.image, result.thumbnail) || undefined,
        url,
        snippet: normalize(result.snippet) || undefined,
      } satisfies ProductItem;
    })
    .filter(isNonNullable);

  const structuredProducts = structuredSources
    .map((source, index) => {
      const title = normalize(source.label);
      if (!title) return null;

      const url = normalize(source.url) || undefined;
      const domain = firstAvailable(source.domain, domainFromUrl(normalize(source.url)), 'Store');

      return {
        id: normalize(source.id) || `product-structured-${index}`,
        title,
        price: extractPrice({
          price: source.price,
          snippet: source.snippet,
          title: source.label,
        }) || 'See price',
        source: domain,
        imageUrl:
          firstAvailable(source.imageUrl, source.image, source.thumbnail) || undefined,
        url,
        snippet: normalize(source.snippet) || undefined,
      } satisfies ProductItem;
    })
    .filter(isNonNullable);

  return uniqueByKey(
    [...browserProducts, ...structuredProducts],
    (item) => `${item.title}::${item.source}::${item.url ?? ''}`,
  ).slice(0, 6);
}

function extractEmailRecords(metadata?: AgentResponseMetadata): EmailRecord[] {
  const raw =
    metadata?.structuredData &&
    typeof metadata.structuredData === 'object'
      ? (metadata.structuredData as Record<string, unknown>).emails
      : undefined;

  return Array.isArray(raw) ? (raw as EmailRecord[]) : [];
}

function buildEmails(mode: UiMode, metadata?: AgentResponseMetadata): EmailItem[] {
  if (mode !== 'email') return [];

  return extractEmailRecords(metadata)
    .map((email, index) => {
      const sender = firstAvailable(email.sender, email.from, 'Unknown sender');
      const subject = firstAvailable(email.subject, 'No subject');
      const summary = firstAvailable(email.summary, email.snippet, subject);

      if (!summary) return null;

      return {
        id: normalize(email.id) || `email-${index}`,
        sender,
        subject,
        summary,
      } satisfies EmailItem;
    })
    .filter(isNonNullable)
    .slice(0, 6);
}

function buildOperator(metadata?: AgentResponseMetadata): OperatorItem | undefined {
  const operator = metadata?.operatorResponse;
  if (!operator) return undefined;

  const actions = (operator.actions ?? [])
    .map((action) => normalize(action.label))
    .filter(Boolean)
    .slice(0, 4);

  const decision = normalize(operator.decisionBrief) || undefined;
  const nextStep = normalize(operator.nextStep) || undefined;
  const risk = normalize(operator.risk) || undefined;
  const opportunity =
    firstAvailable(
      operator.opportunity,
      operator.savingsOpportunity,
      operator.timeOpportunity,
    ) || undefined;

  const signalCount = [decision, nextStep, risk, opportunity, actions.length ? '1' : '']
    .filter(Boolean).length;

  if (signalCount < 2) return undefined;

  return {
    decision,
    nextStep,
    risk,
    opportunity,
    actions,
  };
}

export function buildPresentationModel(args: Args): PresentationModel {
  const metadata = args.metadata ?? args.message.agentMetadata;

  const sources = buildSources(args.message, metadata);
  const chips = buildChips(sources);
  const compareItems = buildCompareItems(args.mode, args.message, metadata);
  const products = buildProducts(args.mode, args.message, metadata);
  const emails = buildEmails(args.mode, metadata);
  const operator = buildOperator(metadata);

  let mode = args.mode;

  if (mode === 'compare' && compareItems.length < 2) {
    mode = 'plain';
  }

  if (mode === 'shopping' && products.length < 2) {
    mode = 'plain';
  }

  if (mode === 'email' && emails.length === 0) {
    mode = 'plain';
  }

  if (mode === 'operator' && !operator) {
    mode = 'plain';
  }

  if (mode === 'search' && sources.length === 0) {
    mode = 'plain';
  }

  return {
    mode,
    title: normalize(args.message.structured?.title) || undefined,
    lead: buildLead(args.message) || undefined,
    summary: buildSummary(args.message),
    plainText: buildPlainText(args.message),
    chips,
    sources,
    compareItems,
    products,
    emails,
    operator,
    isStreaming: Boolean(args.message.isStreaming),
  };
}
