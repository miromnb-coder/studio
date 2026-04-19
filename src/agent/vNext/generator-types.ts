import type {
  AgentContext,
  AgentFinalAnswer,
  AgentPlan,
  AgentRequest,
  AgentRouteResult,
  AgentToolResult,
  StructuredAnswer,
} from './types';

export type GenerateFinalAnswerInput = {
  request: AgentRequest;
  route: AgentRouteResult;
  plan: AgentPlan;
  context: AgentContext;
  toolResults: AgentToolResult[];
  memorySummary: string;
};

export type LlmHighlightTone = 'default' | 'important' | 'success' | 'warning';

export type LlmStructuredAnswerSchema = {
  title: string | null;
  lead: string | null;
  summary: string | null;
  highlights: Array<{
    text: string;
    tone: LlmHighlightTone;
  }>;
  nextStep: string | null;
  sources: Array<{
    id: string;
    label: string;
    used: boolean;
  }>;
  plainText: string | null;
};

export type GeneratorResponseType =
  | 'plain'
  | 'email'
  | 'search'
  | 'compare'
  | 'shopping'
  | 'operator';

export type StructuredPayloadSchema = {
  responseType: GeneratorResponseType;
  title?: string | null;
  lead?: string | null;
  summary?: string | null;
  sourceChips?: Array<{ label: string; href?: string | null }>;
  sources?: Array<{
    id: string;
    title: string;
    domain?: string | null;
    snippet?: string | null;
    url?: string | null;
  }>;
  emailItems?: Array<{
    id: string;
    sender?: string | null;
    subject: string;
    preview?: string | null;
    importance?: 'urgent' | 'important' | 'normal';
    href?: string | null;
  }>;
  urgentLabel?: string | null;
  events?: Array<{
    id: string;
    title: string;
    time?: string | null;
    subtitle?: string | null;
  }>;
  compareHeaders?: string[];
  compareRows?: Array<{
    label: string;
    values: string[];
  }>;
  productCards?: Array<{
    id: string;
    title: string;
    price?: string | null;
    source?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    href?: string | null;
  }>;
  nextActions?: string[];
  risks?: string[];
  opportunities?: string[];
};

export type ToolSummaryItem = {
  tool: string;
  ok: boolean;
  summary: string;
  error: string;
  data: Record<string, unknown>;
};

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function trimOuterWhitespace(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function toStringArray(value: unknown): string[] {
  return asArray(value).map((item) => normalizeText(item)).filter(Boolean);
}

export function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function getRequestText(request: AgentRequest): string {
  const candidates = [
    (request as AgentRequest & { message?: string }).message,
    (request as AgentRequest & { input?: string }).input,
    (request as AgentRequest & { prompt?: string }).prompt,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }

  return '';
}

export function getConversationMessages(
  request: AgentRequest,
): Array<{ role: string; content: string }> {
  const raw =
    (request as AgentRequest & {
      conversation?: Array<{ role?: string; content?: string }>;
    }).conversation ?? [];

  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item) => Boolean(item) && typeof item === 'object')
    .map((item) => ({
      role: normalizeText(item.role) || 'user',
      content: normalizeText(item.content),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8);
}

export function getLanguage(input: GenerateFinalAnswerInput): string {
  return (
    normalizeText(input.route.responseLanguage) ||
    normalizeText(input.route.inputLanguage) ||
    normalizeText(input.request.responseLanguage) ||
    normalizeText(input.request.inputLanguage) ||
    'en'
  ).toLowerCase();
}

export function summarizeToolResults(toolResults: AgentToolResult[]): {
  successful: string[];
  failed: string[];
  compactJson: string;
  structured: ToolSummaryItem[];
} {
  const successful: string[] = [];
  const failed: string[] = [];

  const compact: ToolSummaryItem[] = toolResults.map((result) => {
    const data = asObject(result.data);
    const meta = asObject(data.meta);

    const summary =
      typeof data.summary === 'string'
        ? normalizeText(data.summary)
        : typeof data.message === 'string'
          ? normalizeText(data.message)
          : typeof meta.summary === 'string'
            ? normalizeText(meta.summary)
            : '';

    const item: ToolSummaryItem = {
      tool: result.tool,
      ok: result.ok,
      summary,
      error: normalizeText(result.error),
      data,
    };

    if (result.ok) {
      successful.push(summary ? `${result.tool}: ${summary}` : `${result.tool}`);
    } else {
      failed.push(`${result.tool}${item.error ? `: ${item.error}` : ': failed'}`);
    }

    return item;
  });

  return {
    successful,
    failed,
    compactJson: JSON.stringify(compact, null, 2),
    structured: compact,
  };
}

export function buildSourceList(toolResults: AgentToolResult[]) {
  const byTool = new Map<string, boolean>();

  for (const result of toolResults) {
    byTool.set(result.tool, Boolean(result.ok) || byTool.get(result.tool) === true);
  }

  return [...byTool.entries()]
    .slice(0, 5)
    .map(([tool, used]) => ({
      id: tool,
      label: toTitleCase(tool),
      used,
    }));
}

export function estimateConfidence(
  route: AgentRouteResult,
  toolResults: AgentToolResult[],
  answerText: string,
  structuredData?: StructuredPayloadSchema,
): number {
  let confidence = typeof route.confidence === 'number' ? route.confidence : 0.6;

  const okCount = toolResults.filter((item) => item.ok).length;
  const failCount = toolResults.filter((item) => !item.ok).length;

  if (okCount > 0) confidence += 0.07;
  if (okCount > 1) confidence += 0.04;
  if (failCount > 0) confidence -= 0.1;
  if (failCount > okCount) confidence -= 0.08;
  if (answerText.length < 80) confidence -= 0.08;
  if (answerText.length > 180) confidence += 0.03;

  if (structuredData?.responseType && structuredData.responseType !== 'plain') {
    confidence += 0.03;
  }

  return Math.max(0.22, Math.min(0.97, Number(confidence.toFixed(2))));
}

function isBadTitle(title: string): boolean {
  const normalized = normalizeText(title).toLowerCase();

  return [
    'structured answer',
    'response',
    'result',
    'analysis',
    'answer',
    'ai output',
    'assistant response',
  ].includes(normalized);
}

function normalizeTone(value: unknown): LlmHighlightTone {
  if (
    value === 'important' ||
    value === 'success' ||
    value === 'warning' ||
    value === 'default'
  ) {
    return value;
  }

  return 'default';
}

export function extractJsonBlock(text: string): string | null {
  const trimmed = trimOuterWhitespace(text);
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

export function normalizeStructuredPayload(
  parsed: Partial<LlmStructuredAnswerSchema>,
): LlmStructuredAnswerSchema | null {
  const title = normalizeText(parsed.title);
  const lead = normalizeText(parsed.lead);
  const summary = normalizeText(parsed.summary);
  const nextStep = normalizeText(parsed.nextStep);
  const plainText = normalizeText(parsed.plainText);

  const highlights = Array.isArray(parsed.highlights)
    ? parsed.highlights
        .map((item) => ({
          text: normalizeText(item?.text),
          tone: normalizeTone(item?.tone),
        }))
        .filter((item) => item.text.length > 0)
        .slice(0, 5)
    : [];

  const sources = Array.isArray(parsed.sources)
    ? parsed.sources
        .map((item) => ({
          id: normalizeText(item?.id),
          label: normalizeText(item?.label),
          used: Boolean(item?.used),
        }))
        .filter((item) => item.id.length > 0 && item.label.length > 0)
        .slice(0, 6)
    : [];

  const cleanedTitle = title && !isBadTitle(title) ? title : '';

  const hasContent = Boolean(cleanedTitle || lead || summary || highlights.length || nextStep || plainText);
  if (!hasContent) return null;

  return {
    title: cleanedTitle || null,
    lead: lead || null,
    summary: summary || null,
    highlights,
    nextStep: nextStep || null,
    sources,
    plainText: plainText || null,
  };
}

export function mapLlmStructuredToAppStructured(
  input: GenerateFinalAnswerInput,
  payload: LlmStructuredAnswerSchema,
): StructuredAnswer {
  const fallbackSources = buildSourceList(input.toolResults);

  const fallbackPlainText =
    payload.plainText ?? ([payload.lead, payload.summary].filter(Boolean).join(' ').trim() || undefined);

  return {
    title: payload.title ?? undefined,
    lead: payload.lead ?? undefined,
    summary: payload.summary ?? undefined,
    highlights: payload.highlights.length ? payload.highlights : undefined,
    nextStep: payload.nextStep ?? undefined,
    sources:
      payload.sources.length > 0
        ? payload.sources
        : fallbackSources.length > 0
          ? fallbackSources
          : undefined,
    plainText: fallbackPlainText,
  };
}

export function buildLocalizedFallback(
  language: string,
  params: {
    requestText: string;
    memorySummary: string;
    successful: string[];
    failed: string[];
  },
): { text: string } {
  const { requestText, memorySummary, successful, failed } = params;

  if (language.startsWith('fi')) {
    return {
      text: [
        requestText
          ? `Tässä paras tiivis vastaus pyyntöösi: ${requestText}.`
          : 'Tässä paras tiivis vastaus pyyntöösi.',
        memorySummary ? `Aiempi konteksti huomioiden: ${memorySummary}` : '',
        successful.length ? `Keskeiset havainnot: ${successful.join(', ')}.` : '',
        failed.length ? `Osa tiedoista voi olla epävarma: ${failed.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  if (language.startsWith('sv')) {
    return {
      text: [
        requestText
          ? `Här är det mest användbara svaret på din begäran: ${requestText}.`
          : 'Här är det mest användbara svaret på din begäran.',
        memorySummary ? `Med tidigare kontext i åtanke: ${memorySummary}` : '',
        successful.length ? `Viktigaste resultat: ${successful.join(', ')}.` : '',
        failed.length ? `Vissa detaljer kan vara osäkra: ${failed.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  if (language.startsWith('es')) {
    return {
      text: [
        requestText
          ? `Aquí tienes la respuesta más útil para tu solicitud: ${requestText}.`
          : 'Aquí tienes la respuesta más útil para tu solicitud.',
        memorySummary ? `Teniendo en cuenta el contexto previo: ${memorySummary}` : '',
        successful.length ? `Hallazgos clave: ${successful.join(', ')}.` : '',
        failed.length ? `Algunos detalles pueden ser inciertos: ${failed.join(', ')}.` : '',
      ]
        .filter(Boolean)
        .join(' '),
    };
  }

  return {
    text: [
      requestText
        ? `Here is the most useful answer for your request: ${requestText}.`
        : 'Here is the most useful answer for your request.',
      memorySummary ? `Considering earlier context: ${memorySummary}` : '',
      successful.length ? `Key findings: ${successful.join(', ')}.` : '',
      failed.length ? `A few details may be uncertain: ${failed.join(', ')}.` : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function buildFallbackStructuredAnswer(
  input: GenerateFinalAnswerInput,
  text: string,
): StructuredAnswer | undefined {
  const requestText = getRequestText(input.request);
  const lowered = requestText.toLowerCase();
  const sources = buildSourceList(input.toolResults);

  const asksForTodayPlan =
    /\b(what should i do today|today plan|plan my day|what now today)\b/i.test(lowered) ||
    /\b(today|todays|this morning|this afternoon)\b/i.test(lowered);

  if (asksForTodayPlan || input.route.intent === 'planning') {
    return {
      title: 'Today plan',
      summary: text,
      highlights: input.plan.steps.slice(0, 3).map((step, index) => ({
        text: step.title,
        tone: index === 0 ? 'important' : index === 2 ? 'success' : 'default',
      })),
      nextStep: 'Open Calendar',
      sources: sources.length ? sources : undefined,
      plainText: text,
    };
  }

  return {
    summary: text,
    sources: sources.length ? sources : undefined,
    plainText: text,
  };
}

export function buildAnswerMetadata(
  input: GenerateFinalAnswerInput,
  language: string,
  mode: 'model' | 'fallback',
  responseType: GeneratorResponseType,
): AgentFinalAnswer['metadata'] {
  return {
    intent: input.route.intent,
    inputLanguage: input.route.inputLanguage,
    responseLanguage: language,
    successfulTools: input.toolResults.filter((item) => item.ok).map((item) => item.tool),
    failedTools: input.toolResults.filter((item) => !item.ok).map((item) => item.tool),
    planId: input.plan.id,
    stepCount: input.plan.steps.length,
    mode,
    responseType,
  };
}
