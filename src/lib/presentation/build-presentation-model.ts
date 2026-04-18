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

function normalize(value?: string | null): string {
  return (value ?? '').trim();
}

function domainFromUrl(url: string): string {
  if (!url) return 'Source';
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Source';
  }
}

function extractBrowserResults(metadata?: AgentResponseMetadata): BrowserSearchResult[] {
  const raw = metadata?.structuredData?.browser_search as
    | { results?: BrowserSearchResult[] }
    | undefined;
  return Array.isArray(raw?.results) ? raw.results : [];
}

function extractPrice(value: BrowserSearchResult): string {
  const direct = normalize(value.price);
  if (direct) return direct;
  const fromSnippet = normalize(value.snippet).match(
    /(?:€|\$|£)\s?\d[\d.,]*|\d[\d.,]*\s?(?:€|eur|usd|sek|kr)/i,
  )?.[0];
  return fromSnippet ?? '';
}

function firstAvailable(...values: Array<string | undefined>): string {
  return values.map((value) => normalize(value)).find(Boolean) ?? '';
}


function isNonNullable<T>(value: T | null | undefined): value is T {
  return value != null;
}

function buildPlainText(message: Message): string {
  if (normalize(message.content)) return normalize(message.content);

  const structured = message.structured;
  return firstAvailable(structured?.summary, structured?.lead, structured?.plainText);
}

export function buildPresentationModel(args: Args): PresentationModel {
  const metadata = args.metadata ?? args.message.agentMetadata;
  const structured = args.message.structured;
  const browserResults = extractBrowserResults(metadata);
  const sourcesFromStructured = (structured?.sources ?? [])
    .filter((source) => source.used)
    .map((source, index) => ({
      id: source.id || `structured-${index}`,
      title: normalize(source.label) || 'Source',
      url: '',
      snippet: '',
      domain: 'Source',
    }));

  const sourcesFromBrowser = browserResults
    .map((result, index) => {
      const url = normalize(result.url);
      const title = normalize(result.title);
      if (!url && !title) return null;

      return {
        id: `web-${index}`,
        title: title || domainFromUrl(url),
        url,
        snippet: normalize(result.snippet),
        domain: normalize(result.source) || domainFromUrl(url),
      };
    })
    .filter(isNonNullable);

  const sources = [...sourcesFromBrowser, ...sourcesFromStructured].slice(0, 8);
  const chips = Array.from(new Set(sources.map((source) => source.domain))).filter(Boolean);

  const compareItems = sources
    .map((source) => ({
      id: source.id,
      option: source.title,
      source: source.domain,
      signal: source.snippet || 'No extra signal.',
      url: source.url || undefined,
    }))
    .slice(0, 4);

  const products = browserResults
    .map((result, index) => {
      const title = normalize(result.title);
      if (!title) return null;

      return {
        id: `product-${index}`,
        title,
        price: extractPrice(result) || 'See price',
        source: normalize(result.source) || domainFromUrl(normalize(result.url)),
        imageUrl: firstAvailable(result.imageUrl, result.image, result.thumbnail) || undefined,
        url: normalize(result.url) || undefined,
        snippet: normalize(result.snippet) || undefined,
      };
    })
    .filter(isNonNullable)
    .slice(0, 6);

  const emailRecords = (metadata?.structuredData?.emails as
    | Array<{ id?: string; sender?: string; subject?: string; summary?: string }>
    | undefined) ?? [];

  const emails = emailRecords
    .map((email, index) => {
      const summary = firstAvailable(email.summary, email.subject);
      if (!summary) return null;
      return {
        id: normalize(email.id) || `email-${index}`,
        sender: normalize(email.sender) || 'Unknown sender',
        subject: normalize(email.subject) || 'No subject',
        summary,
      };
    })
    .filter(isNonNullable)
    .slice(0, 6);

  const operator = metadata?.operatorResponse
    ? {
        decision: normalize(metadata.operatorResponse.decisionBrief) || undefined,
        nextStep: normalize(metadata.operatorResponse.nextStep) || undefined,
        risk: normalize(metadata.operatorResponse.risk) || undefined,
        opportunity:
          normalize(metadata.operatorResponse.opportunity) ||
          normalize(metadata.operatorResponse.savingsOpportunity) ||
          normalize(metadata.operatorResponse.timeOpportunity) ||
          undefined,
        actions: (metadata.operatorResponse.actions ?? [])
          .map((action) => normalize(action.label))
          .filter(Boolean)
          .slice(0, 4),
      }
    : undefined;

  const textSummary = firstAvailable(
    structured?.summary,
    structured?.lead,
    structured?.plainText,
    normalize(args.message.content),
  );

  const model: PresentationModel = {
    mode: args.mode,
    title: normalize(structured?.title) || undefined,
    lead: normalize(structured?.lead) || undefined,
    summary: textSummary,
    plainText: buildPlainText(args.message),
    chips,
    sources,
    compareItems,
    products,
    emails,
    operator,
    isStreaming: Boolean(args.message.isStreaming),
  };

  if (model.mode === 'shopping' && model.products.length < 2) {
    model.mode = 'plain';
  }

  if (model.mode === 'compare' && model.compareItems.length < 2) {
    model.mode = 'plain';
  }

  return model;
}
