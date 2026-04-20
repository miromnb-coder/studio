'use client';

import type { Message } from '@/app/store/app-store-types';
import { buildResponsePresentation } from '@/lib/presentation/build-presentation-model';
import { resolveResponseView } from '@/lib/presentation/resolve-response-view';
import { CasualResponseView } from './views/CasualResponseView';
import { CompareResponseView } from './views/CompareResponseView';
import { EmailResponseView } from './views/EmailResponseView';
import { OperatorResponseView } from './views/OperatorResponseView';
import { PlainResponseView } from './views/PlainResponseView';
import { SearchResponseView } from './views/SearchResponseView';
import { ShoppingResponseView } from './views/ShoppingResponseView';

type ResponseRendererProps = {
  message: Message;
  latestUserContent?: string;
};

type LegacyPresentationModel = {
  mode: string;
  title?: string | null;
  lead?: string | null;
  summary?: string | null;
  plainText: string;
  chips: string[];
  sources: Array<{
    id: string;
    domain: string;
    title: string;
    snippet?: string;
    url?: string | null;
  }>;
  compareItems: Array<{
    id: string;
    option: string;
    source: string;
    signal: string;
    url?: string | null;
  }>;
  products: Array<{
    id: string;
    title: string;
    price: string;
    source: string;
    imageUrl?: string | null;
    snippet?: string | null;
    url?: string | null;
  }>;
  emails: Array<{
    id: string;
    sender?: string | null;
    subject: string;
    summary: string;
    importance?: 'urgent' | 'important' | 'normal';
    href?: string | null;
  }>;
  operator: {
    decision?: string;
    nextStep?: string;
    risk?: string;
    opportunity?: string;
    actions?: string[];
  } | null;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function buildLegacyModel(
  presentation: ReturnType<typeof buildResponsePresentation>,
): LegacyPresentationModel {
  return {
    mode: presentation.view,
    title: presentation.title,
    lead: presentation.lead,
    summary: presentation.summary,
    plainText: presentation.plainText,
    chips: presentation.sourceChips.map((chip) => chip.label),
    sources: presentation.search.results.map((result) => ({
      id: result.id,
      domain: normalizeText(result.source) || 'Source',
      title: result.title,
      snippet: result.snippet ?? undefined,
      url: result.href ?? undefined,
    })),
    compareItems: presentation.compare.rows.map((row, index) => ({
      id: `compare-${index}`,
      option: row.label,
      source: row.values[0] || '—',
      signal: row.values[1] || row.values.join(' • ') || '—',
      url: undefined,
    })),
    products: presentation.shopping.products.map((product) => ({
      id: product.id,
      title: product.title,
      price: normalizeText(product.price) || '—',
      source: normalizeText(product.source) || '—',
      imageUrl: product.image ?? undefined,
      snippet: product.description ?? undefined,
      url: product.href ?? undefined,
    })),
    emails: presentation.email.messages.map((email) => ({
      id: email.id,
      sender: email.sender,
      subject: email.subject,
      summary: normalizeText(email.preview) || 'No preview available.',
      importance: email.importance,
      href: email.href ?? undefined,
    })),
    operator: presentation.operator.nextActions.length ||
      presentation.operator.risks.length ||
      presentation.operator.opportunities.length
      ? {
          decision: presentation.summary ?? undefined,
          nextStep: presentation.operator.nextActions[0],
          risk: presentation.operator.risks[0],
          opportunity: presentation.operator.opportunities[0],
          actions: presentation.operator.nextActions,
        }
      : null,
  };
}

function normalizeResponseType(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return normalized;
}

function resolveExplicitView(message: Message):
  | 'plain'
  | 'email'
  | 'search'
  | 'compare'
  | 'shopping'
  | 'operator'
  | null {
  const structuredData =
    ((message as Message & { structuredData?: Record<string, unknown> }).structuredData ??
      null) as Record<string, unknown> | null;
  const metadata = (message.agentMetadata ?? null) as Record<string, unknown> | null;

  const responseType =
    normalizeResponseType(structuredData?.responseType) ??
    normalizeResponseType(structuredData?.response_type) ??
    normalizeResponseType((metadata?.structuredData as Record<string, unknown> | undefined)?.responseType) ??
    normalizeResponseType((metadata?.structuredData as Record<string, unknown> | undefined)?.response_type);

  if (
    responseType === 'plain' ||
    responseType === 'email' ||
    responseType === 'search' ||
    responseType === 'compare' ||
    responseType === 'shopping' ||
    responseType === 'operator'
  ) {
    return responseType;
  }

  return null;
}

function hasStructuredPayload(
  view:
    | 'plain'
    | 'email'
    | 'search'
    | 'compare'
    | 'shopping'
    | 'operator'
    | 'calendar'
    | 'casual',
  presentation: ReturnType<typeof buildResponsePresentation>,
): boolean {
  if (view === 'search') return presentation.search.results.length > 0;
  if (view === 'shopping') return presentation.shopping.products.length > 0;
  if (view === 'compare') return presentation.compare.rows.length > 0;
  if (view === 'email') return presentation.email.messages.length > 0;

  if (view === 'operator') {
    return Boolean(
      presentation.operator.nextActions.length ||
        presentation.operator.risks.length ||
        presentation.operator.opportunities.length ||
        presentation.summary,
    );
  }

  return false;
}

export function ResponseRenderer({
  message,
  latestUserContent,
}: ResponseRendererProps) {
  const explicitView = resolveExplicitView(message);

  const resolution = resolveResponseView({
    text: message.content,
    structured: (message.structured ?? null) as Record<string, unknown> | null,
    structuredData: ((message as Message & { structuredData?: Record<string, unknown> }).structuredData ??
      null) as Record<string, unknown> | null,
    metadata: (message.agentMetadata ?? null) as Record<string, unknown> | null,
    toolResults: (((message as Message & { toolResults?: Array<Record<string, unknown>> }).toolResults ??
      null) as Array<Record<string, unknown>> | null),
    isStreaming: Boolean(message.isStreaming),
  });

  const selectedView = message.isStreaming
    ? 'plain'
    : (explicitView ?? resolution.view);

  const presentation = buildResponsePresentation({
    view: selectedView,
    text: message.content,
    structured: (message.structured ?? null) as Record<string, unknown> | null,
    structuredData: ((message as Message & { structuredData?: Record<string, unknown> }).structuredData ??
      null) as Record<string, unknown> | null,
    metadata: (message.agentMetadata ?? null) as Record<string, unknown> | null,
    toolResults: (((message as Message & { toolResults?: Array<Record<string, unknown>> }).toolResults ??
      null) as Array<Record<string, unknown>> | null),
  });

  const shouldSuppressRawText =
    !message.isStreaming &&
    explicitView !== null &&
    explicitView !== 'plain' &&
    hasStructuredPayload(selectedView, presentation);

  const displayPresentation = shouldSuppressRawText
    ? {
        ...presentation,
        title: null,
        lead: null,
        summary: null,
        plainText: '',
      }
    : presentation;

  const legacyModel = buildLegacyModel(displayPresentation);

  switch (displayPresentation.view) {
    case 'email':
      return <EmailResponseView presentation={displayPresentation} />;

    case 'plain':
      return (
        <PlainResponseView
          title={displayPresentation.title || undefined}
          lead={displayPresentation.lead || undefined}
          text={displayPresentation.plainText || displayPresentation.summary || ''}
        />
      );

    case 'calendar':
      return (
        <PlainResponseView
          title={displayPresentation.title || undefined}
          lead={displayPresentation.lead || undefined}
          text={
            displayPresentation.summary ||
            displayPresentation.plainText ||
            displayPresentation.calendar.events
              .map((event) =>
                [event.title, event.time, event.subtitle].filter(Boolean).join(' — '),
              )
              .join('\n')
          }
        />
      );

    case 'search':
      return <SearchResponseView model={legacyModel as never} />;

    case 'compare':
      return <CompareResponseView model={legacyModel as never} />;

    case 'shopping':
      return <ShoppingResponseView model={legacyModel as never} />;

    case 'operator':
      return <OperatorResponseView model={legacyModel as never} />;

    case 'casual':
      return (
        <CasualResponseView
          text={displayPresentation.plainText || displayPresentation.summary || ''}
        />
      );

    default:
      return (
        <PlainResponseView
          title={displayPresentation.title || undefined}
          lead={displayPresentation.lead || undefined}
          text={displayPresentation.plainText || displayPresentation.summary || ''}
        />
      );
  }
}
