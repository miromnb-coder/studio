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

type ResponseRendererProps = { message: Message; latestUserContent?: string };
type StructuredRenderableView = 'plain' | 'email' | 'search' | 'compare' | 'shopping' | 'operator' | 'calendar' | 'casual';

type LegacyPresentationModel = {
  mode: string; title?: string | null; lead?: string | null; summary?: string | null; plainText: string; chips: string[];
  sources: Array<{ id: string; domain: string; title: string; snippet?: string; url?: string | null }>;
  compareItems: Array<{ id: string; option: string; source: string; signal: string; url?: string | null }>;
  products: Array<{ id: string; title: string; price: string; source: string; imageUrl?: string | null; snippet?: string | null; url?: string | null }>;
  emails: Array<{ id: string; sender?: string | null; subject: string; summary: string; importance?: 'urgent' | 'important' | 'normal'; href?: string | null }>;
  operator: { decision?: string; nextStep?: string; risk?: string; opportunity?: string; actions?: string[] } | null;
};

function normalizeText(value: unknown): string { return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''; }
function asRecord(value: unknown): Record<string, unknown> | null { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null; }
function normalizeResponseType(value: unknown): StructuredRenderableView | null { if (typeof value !== 'string') return null; const v = value.trim().toLowerCase(); return ['plain','email','search','compare','shopping','operator','calendar','casual'].includes(v) ? v as StructuredRenderableView : null; }
function getStructuredData(message: Message): Record<string, unknown> | null { return asRecord((message as Message & { structuredData?: Record<string, unknown> }).structuredData ?? null); }
function getToolResults(message: Message): Array<Record<string, unknown>> | null { const value = (message as Message & { toolResults?: Array<Record<string, unknown>> }).toolResults; return Array.isArray(value) ? value : null; }
function getMetadata(message: Message): Record<string, unknown> | null { return asRecord(message.agentMetadata ?? null); }
function resolveExplicitView(message: Message): StructuredRenderableView | null { const structuredData = getStructuredData(message); const metadata = getMetadata(message); const metadataStructured = asRecord(metadata?.structuredData); return normalizeResponseType(structuredData?.responseType) ?? normalizeResponseType(structuredData?.response_type) ?? normalizeResponseType(metadataStructured?.responseType) ?? normalizeResponseType(metadataStructured?.response_type); }

function buildLegacyModel(presentation: ReturnType<typeof buildResponsePresentation>): LegacyPresentationModel {
  return {
    mode: presentation.view, title: presentation.title, lead: presentation.lead, summary: presentation.summary, plainText: presentation.plainText, chips: presentation.sourceChips.map((chip) => chip.label),
    sources: presentation.search.results.map((result) => ({ id: result.id, domain: normalizeText(result.source) || 'Source', title: result.title, snippet: result.snippet ?? undefined, url: result.href ?? undefined })),
    compareItems: presentation.compare.rows.map((row, index) => ({ id: `compare-${index}`, option: row.label, source: row.values[0] || '—', signal: row.values[1] || row.values.join(' • ') || '—', url: undefined })),
    products: presentation.shopping.products.map((product) => ({ id: product.id, title: product.title, price: normalizeText(product.price) || '—', source: normalizeText(product.source) || '—', imageUrl: product.image ?? undefined, snippet: product.description ?? undefined, url: product.href ?? undefined })),
    emails: presentation.email.messages.map((email) => ({ id: email.id, sender: email.sender, subject: email.subject, summary: normalizeText(email.preview) || 'No preview available.', importance: email.importance, href: email.href ?? undefined })),
    operator: presentation.operator.nextActions.length || presentation.operator.risks.length || presentation.operator.opportunities.length ? { decision: presentation.summary ?? undefined, nextStep: presentation.operator.nextActions[0], risk: presentation.operator.risks[0], opportunity: presentation.operator.opportunities[0], actions: presentation.operator.nextActions } : null,
  };
}

function hasStructuredPayload(view: StructuredRenderableView, presentation: ReturnType<typeof buildResponsePresentation>): boolean {
  switch (view) { case 'search': return presentation.search.results.length > 0; case 'shopping': return presentation.shopping.products.length > 0; case 'compare': return presentation.compare.rows.length > 0; case 'email': return presentation.email.messages.length > 0; case 'calendar': return presentation.calendar.events.length > 0; case 'operator': return Boolean(presentation.operator.nextActions.length || presentation.operator.risks.length || presentation.operator.opportunities.length || presentation.summary || presentation.lead); default: return false; }
}
function shouldSuppressRawText(message: Message, selectedView: StructuredRenderableView, presentation: ReturnType<typeof buildResponsePresentation>): boolean { if (message.isStreaming) return false; if (selectedView === 'plain' || selectedView === 'casual') return false; return hasStructuredPayload(selectedView, presentation); }
function stripRawIntro(presentation: ReturnType<typeof buildResponsePresentation>): ReturnType<typeof buildResponsePresentation> { return { ...presentation, title: null, lead: null, summary: null, plainText: '' }; }
function buildCalendarText(presentation: ReturnType<typeof buildResponsePresentation>): string { if (presentation.summary?.trim()) return presentation.summary; if (presentation.plainText?.trim()) return presentation.plainText; return presentation.calendar.events.map((event) => [event.title, event.time, event.subtitle].filter(Boolean).join(' — ')).join('\n'); }

export function ResponseRenderer({ message }: ResponseRendererProps) {
  const explicitView = resolveExplicitView(message);
  const resolution = resolveResponseView({ text: message.content, structured: (message.structured ?? null) as Record<string, unknown> | null, structuredData: getStructuredData(message), metadata: getMetadata(message), toolResults: getToolResults(message), isStreaming: Boolean(message.isStreaming) });
  const selectedView: StructuredRenderableView = message.isStreaming ? 'plain' : ((explicitView ?? resolution.view) as StructuredRenderableView);
  const basePresentation = buildResponsePresentation({ view: selectedView, text: message.content, structured: (message.structured ?? null) as Record<string, unknown> | null, structuredData: getStructuredData(message), metadata: getMetadata(message), toolResults: getToolResults(message) });
  const finalPresentation = shouldSuppressRawText(message, selectedView, basePresentation) ? stripRawIntro(basePresentation) : basePresentation;
  const legacyModel = buildLegacyModel(finalPresentation);

  switch (selectedView) {
    case 'email': return <div className="max-w-[760px]"><EmailResponseView presentation={finalPresentation} /></div>;
    case 'search': return <div className="max-w-[760px]"><SearchResponseView model={legacyModel as never} /></div>;
    case 'compare': return <div className="max-w-[760px]"><CompareResponseView model={legacyModel as never} /></div>;
    case 'shopping': return <div className="max-w-[760px]"><ShoppingResponseView model={legacyModel as never} /></div>;
    case 'operator': return <div className="max-w-[760px]"><OperatorResponseView model={legacyModel as never} /></div>;
    case 'calendar': return <div className="max-w-[760px]"><PlainResponseView title={finalPresentation.title || undefined} lead={finalPresentation.lead || undefined} text={buildCalendarText(finalPresentation)} isStreaming={Boolean(message.isStreaming)} /></div>;
    case 'casual': return <div className="max-w-[760px]"><CasualResponseView text={finalPresentation.plainText || finalPresentation.summary || ''} /></div>;
    case 'plain': default: return <div className="max-w-[760px]"><PlainResponseView title={finalPresentation.title || undefined} lead={finalPresentation.lead || undefined} text={finalPresentation.plainText || finalPresentation.summary || ''} isStreaming={Boolean(message.isStreaming)} /></div>;
  }
}
