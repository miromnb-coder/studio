import type { ResponseViewKind } from './resolve-response-view';

export type ResponseSourceChip = {
  label: string;
  href?: string | null;
};

export type EmailMessageCard = {
  id: string;
  sender?: string | null;
  subject: string;
  preview?: string | null;
  importance?: 'urgent' | 'important' | 'normal';
  href?: string | null;
};

export type CalendarEventCard = {
  id: string;
  title: string;
  time?: string | null;
  subtitle?: string | null;
};

export type SearchResultCard = {
  id: string;
  title: string;
  source?: string | null;
  snippet?: string | null;
  href?: string | null;
};

export type CompareRow = {
  label: string;
  values: string[];
};

export type ShoppingCard = {
  id: string;
  title: string;
  price?: string | null;
  source?: string | null;
  image?: string | null;
  href?: string | null;
  description?: string | null;
};

export type ResponsePresentation = {
  view: ResponseViewKind;
  title?: string | null;
  lead?: string | null;
  summary?: string | null;
  plainText: string;
  sourceChips: ResponseSourceChip[];
  email: {
    urgentLabel?: string | null;
    messages: EmailMessageCard[];
  };
  calendar: {
    events: CalendarEventCard[];
  };
  search: {
    results: SearchResultCard[];
  };
  compare: {
    headers: string[];
    rows: CompareRow[];
  };
  shopping: {
    products: ShoppingCard[];
  };
  operator: {
    nextActions: string[];
    risks: string[];
    opportunities: string[];
  };
};

export type BuildResponsePresentationInput = {
  view: ResponseViewKind;
  text?: string | null;
  structured?: Record<string, unknown> | null;
  structuredData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  toolResults?: Array<Record<string, unknown>> | null;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function toStringArray(value: unknown): string[] {
  return asArray(value).map((item) => normalizeText(item)).filter(Boolean);
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return '';
}

function getCombinedData(input: BuildResponsePresentationInput): Record<string, unknown> {
  return {
    ...asObject(input.structured),
    ...asObject(input.structuredData),
    ...asObject(input.metadata),
  };
}

function buildSourceChips(data: Record<string, unknown>): ResponseSourceChip[] {
  const raw =
    asArray(data.sourceChips).length > 0
      ? asArray(data.sourceChips)
      : asArray(data.sources);

  return raw
    .map((item) => {
      const record = asObject(item);
      const label = firstNonEmpty(
        record.label,
        record.source,
        record.domain,
        record.publisher,
        record.name,
        item,
      );

      if (!label) return null;

      return {
        label,
        href: firstNonEmpty(record.href, record.url) || null,
      } satisfies ResponseSourceChip;
    })
    .filter((item): item is ResponseSourceChip => Boolean(item))
    .slice(0, 8);
}

function buildEmailMessages(data: Record<string, unknown>): EmailMessageCard[] {
  const raw =
    asArray(data.emailItems).length > 0
      ? asArray(data.emailItems)
      : asArray(data.messages).length > 0
        ? asArray(data.messages)
        : asArray(data.importantEmails);

  return raw
    .map((item, index) => {
      const record = asObject(item);
      const subject = firstNonEmpty(record.subject, record.title, record.label);
      if (!subject) return null;

      const importanceRaw = firstNonEmpty(
        record.importance,
        record.priority,
        record.tone,
      ).toLowerCase();

      const importance: EmailMessageCard['importance'] =
        importanceRaw === 'urgent' || importanceRaw === 'important'
          ? importanceRaw
          : 'normal';

      return {
        id: firstNonEmpty(record.id) || `email-${index}`,
        sender: firstNonEmpty(record.sender, record.from) || null,
        subject,
        preview: firstNonEmpty(record.preview, record.snippet, record.summary) || null,
        importance,
        href: firstNonEmpty(record.href, record.url) || null,
      } satisfies EmailMessageCard;
    })
    .filter((item): item is EmailMessageCard => Boolean(item))
    .slice(0, 8);
}

function buildCalendarEvents(data: Record<string, unknown>): CalendarEventCard[] {
  const raw = asArray(data.events);

  return raw
    .map((item, index) => {
      const record = asObject(item);
      const title = firstNonEmpty(record.title, record.summary, record.label);
      if (!title) return null;

      return {
        id: firstNonEmpty(record.id) || `event-${index}`,
        title,
        time: firstNonEmpty(record.time, record.startAt, record.start) || null,
        subtitle:
          firstNonEmpty(record.subtitle, record.location, record.description) || null,
      } satisfies CalendarEventCard;
    })
    .filter((item): item is CalendarEventCard => Boolean(item))
    .slice(0, 10);
}

function buildSearchResults(data: Record<string, unknown>): SearchResultCard[] {
  const raw =
    asArray(data.searchResults).length > 0
      ? asArray(data.searchResults)
      : asArray(data.webResults).length > 0
        ? asArray(data.webResults)
        : asArray(data.results).length > 0
          ? asArray(data.results)
          : asArray(data.sources);

  return raw
    .map((item, index) => {
      const record = asObject(item);

      const title = firstNonEmpty(
        record.title,
        record.label,
        record.name,
        record.headline,
        record.domain,
        record.source,
        record.publisher,
      );

      if (!title) return null;

      return {
        id: firstNonEmpty(record.id) || `search-${index}`,
        title,
        source:
          firstNonEmpty(record.source, record.domain, record.publisher, record.label) ||
          null,
        snippet:
          firstNonEmpty(
            record.snippet,
            record.summary,
            record.preview,
            record.description,
          ) || null,
        href: firstNonEmpty(record.href, record.url) || null,
      } satisfies SearchResultCard;
    })
    .filter((item): item is SearchResultCard => Boolean(item))
    .slice(0, 8);
}

function buildCompareSection(data: Record<string, unknown>): {
  headers: string[];
  rows: CompareRow[];
} {
  const headers = toStringArray(data.compareHeaders);
  const rawRows =
    asArray(data.compareRows).length > 0
      ? asArray(data.compareRows)
      : asArray(data.rows);

  const rows = rawRows
    .map((item) => {
      const record = asObject(item);
      const label = firstNonEmpty(record.label, record.name, record.title);
      const values = asArray(record.values)
        .map((value) => normalizeText(value))
        .filter(Boolean);

      if (!label || !values.length) return null;

      return { label, values } satisfies CompareRow;
    })
    .filter((item): item is CompareRow => Boolean(item))
    .slice(0, 12);

  return {
    headers,
    rows,
  };
}

function buildShoppingProducts(data: Record<string, unknown>): ShoppingCard[] {
  const raw =
    asArray(data.productCards).length > 0
      ? asArray(data.productCards)
      : asArray(data.products).length > 0
        ? asArray(data.products)
        : asArray(data.shoppingResults);

  return raw
    .map((item, index) => {
      const record = asObject(item);
      const title = firstNonEmpty(record.title, record.name, record.label);
      if (!title) return null;

      return {
        id: firstNonEmpty(record.id) || `product-${index}`,
        title,
        price: firstNonEmpty(record.price, record.formattedPrice) || null,
        source: firstNonEmpty(record.source, record.store, record.vendor) || null,
        image: firstNonEmpty(record.image, record.imageUrl, record.thumbnail) || null,
        href: firstNonEmpty(record.href, record.url) || null,
        description:
          firstNonEmpty(record.description, record.summary, record.preview) || null,
      } satisfies ShoppingCard;
    })
    .filter((item): item is ShoppingCard => Boolean(item))
    .slice(0, 12);
}

function buildOperatorSection(data: Record<string, unknown>): {
  nextActions: string[];
  risks: string[];
  opportunities: string[];
} {
  return {
    nextActions: toStringArray(data.nextActions).slice(0, 6),
    risks: toStringArray(data.risks).slice(0, 6),
    opportunities: toStringArray(data.opportunities).slice(0, 6),
  };
}

function sanitizeForView(
  view: ResponseViewKind,
  presentation: ResponsePresentation,
): ResponsePresentation {
  if (view === 'email') {
    return {
      ...presentation,
      sourceChips: [],
      search: { results: [] },
      compare: { headers: [], rows: [] },
      shopping: { products: [] },
      calendar: { events: [] },
    };
  }

  if (view === 'calendar') {
    return {
      ...presentation,
      sourceChips: [],
      search: { results: [] },
      compare: { headers: [], rows: [] },
      shopping: { products: [] },
      email: { urgentLabel: null, messages: [] },
    };
  }

  if (view === 'plain') {
    return {
      ...presentation,
      sourceChips: [],
      email: { urgentLabel: null, messages: [] },
      calendar: { events: [] },
      search: { results: [] },
      compare: { headers: [], rows: [] },
      shopping: { products: [] },
      operator: { nextActions: [], risks: [], opportunities: [] },
    };
  }

  return presentation;
}

export function buildResponsePresentation(
  input: BuildResponsePresentationInput,
): ResponsePresentation {
  const data = getCombinedData(input);
  const plainText = normalizeText(input.text);
  const title = firstNonEmpty(data.title, data.heading) || null;
  const lead = firstNonEmpty(data.lead, data.subtitle) || null;
  const summary =
    firstNonEmpty(
      data.summary,
      data.conciseSummary,
      data.headline,
      data.recommendedAction,
    ) || null;

  const presentation: ResponsePresentation = {
    view: input.view,
    title,
    lead,
    summary,
    plainText,
    sourceChips: buildSourceChips(data),
    email: {
      urgentLabel:
        firstNonEmpty(data.urgentLabel, data.urgentSummary, data.urgentHeadline) ||
        null,
      messages: buildEmailMessages(data),
    },
    calendar: {
      events: buildCalendarEvents(data),
    },
    search: {
      results: buildSearchResults(data),
    },
    compare: buildCompareSection(data),
    shopping: {
      products: buildShoppingProducts(data),
    },
    operator: buildOperatorSection(data),
  };

  return sanitizeForView(input.view, presentation);
}
