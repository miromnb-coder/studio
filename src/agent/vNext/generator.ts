import { groq } from '@/ai/groq';
import type { ResponseMode } from '@/agent/types/response-mode';

import type {
  AgentContext,
  AgentFinalAnswer,
  AgentPlan,
  AgentRequest,
  AgentRouteResult,
  AgentStreamEvent,
  StructuredAnswer,
  AgentToolResult,
} from './types';

export type GenerateFinalAnswerInput = {
  request: AgentRequest;
  route: AgentRouteResult;
  plan: AgentPlan;
  context: AgentContext;
  toolResults: AgentToolResult[];
  memorySummary: string;
};

type LlmHighlightTone = 'default' | 'important' | 'success' | 'warning';

type LlmStructuredAnswerSchema = {
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

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function trimOuterWhitespace(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function getRequestText(request: AgentRequest): string {
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

function getConversationMessages(
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

function getLanguage(input: GenerateFinalAnswerInput): string {
  return (
    normalizeText(input.route.responseLanguage) ||
    normalizeText(input.route.inputLanguage) ||
    normalizeText(input.request.responseLanguage) ||
    normalizeText(input.request.inputLanguage) ||
    'en'
  ).toLowerCase();
}

function getResponseMode(input: GenerateFinalAnswerInput): ResponseMode {
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;
  const mode = metadata.responseModeHint;

  if (
    mode === 'casual' ||
    mode === 'fast' ||
    mode === 'operator' ||
    mode === 'tool' ||
    mode === 'fallback'
  ) {
    return mode;
  }

  return 'operator';
}

function buildModeInstruction(mode: ResponseMode): string {
  switch (mode) {
    case 'casual':
      return [
        'Mode: casual.',
        'Reply directly and naturally as in normal conversation.',
        'Keep the structure minimal unless it clearly improves readability.',
        'No robotic phrasing, no process narration, no workflow theater.',
      ].join(' ');
    case 'fast':
      return [
        'Mode: fast.',
        'Be concise and immediately useful.',
        'Keep the answer compact and decisive.',
      ].join(' ');
    case 'tool':
      return [
        'Mode: tool.',
        'Ground the answer in available tool context.',
        'Do not pretend missing tools were used.',
      ].join(' ');
    case 'fallback':
      return [
        'Mode: fallback.',
        'Be honest about uncertainty in calm user language.',
        'Still provide the most helpful answer possible.',
      ].join(' ');
    case 'operator':
    default:
      return [
        'Mode: operator.',
        'Use a premium, structured, action-oriented style when helpful.',
        'Prioritize clarity, usefulness, and readable hierarchy.',
      ].join(' ');
  }
}

function buildLanguageInstruction(language: string): string {
  const normalizedLanguage = language || 'en';

  return [
    `Respond ONLY in ${normalizedLanguage}.`,
    'Use that language consistently across all fields.',
    'Do not mix languages.',
    "If uncertain, prefer the user's detected language.",
  ].join(' ');
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function summarizeToolResults(toolResults: AgentToolResult[]): {
  successful: string[];
  failed: string[];
  compactJson: string;
} {
  const successful: string[] = [];
  const failed: string[] = [];

  const compact = toolResults.map((result) => {
    const summary =
      typeof result.data?.summary === 'string'
        ? normalizeText(result.data.summary)
        : typeof result.data?.message === 'string'
          ? normalizeText(result.data.message)
          : typeof result.data?.meta === 'object' &&
              result.data?.meta &&
              'summary' in result.data.meta &&
              typeof (result.data.meta as { summary?: unknown }).summary ===
                'string'
            ? normalizeText((result.data.meta as { summary: string }).summary)
            : '';

    const item = {
      tool: result.tool,
      ok: result.ok,
      summary,
      error: normalizeText(result.error),
      data:
        typeof result.data === 'object' && result.data
          ? result.data
          : {},
    };

    if (result.ok) {
      successful.push(summary ? `${result.tool}: ${summary}` : `${result.tool}`);
    } else {
      failed.push(
        `${result.tool}${item.error ? `: ${item.error}` : ': failed'}`,
      );
    }

    return item;
  });

  return {
    successful,
    failed,
    compactJson: JSON.stringify(compact, null, 2),
  };
}

function estimateConfidence(
  route: AgentRouteResult,
  toolResults: AgentToolResult[],
  answerText: string,
): number {
  let confidence =
    typeof route.confidence === 'number' ? route.confidence : 0.6;

  const okCount = toolResults.filter((item) => item.ok).length;
  const failCount = toolResults.filter((item) => !item.ok).length;

  if (okCount > 0) confidence += 0.07;
  if (okCount > 1) confidence += 0.04;
  if (failCount > 0) confidence -= 0.1;
  if (failCount > okCount) confidence -= 0.08;
  if (answerText.length < 80) confidence -= 0.08;
  if (answerText.length > 180) confidence += 0.03;

  return Math.max(0.22, Math.min(0.97, Number(confidence.toFixed(2))));
}

function buildSourceList(toolResults: AgentToolResult[]) {
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

function extractJsonBlock(text: string): string | null {
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

function normalizeStructuredPayload(
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

  const cleanedTitle =
    title && !isBadTitle(title) ? title : '';

  const hasContent = Boolean(
    cleanedTitle ||
      lead ||
      summary ||
      highlights.length ||
      nextStep ||
      plainText,
  );

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

function mapLlmStructuredToAppStructured(
  input: GenerateFinalAnswerInput,
  payload: LlmStructuredAnswerSchema,
): StructuredAnswer {
  const fallbackSources = buildSourceList(input.toolResults);

  return {
    title: payload.title ?? undefined,
    summary: payload.lead
      ? payload.summary
        ? `${payload.lead}\n\n${payload.summary}`
        : payload.lead
      : payload.summary ?? undefined,
    sections: payload.highlights.length
      ? payload.highlights.map((item, index) => ({
          label: index === 0 && item.tone === 'important' ? 'Priority' : undefined,
          content: item.text,
          tone: item.tone,
        }))
      : undefined,
    actions: payload.nextStep
      ? [
          {
            id: 'next_step',
            label: payload.nextStep,
            kind: 'primary',
          },
        ]
      : undefined,
    sources:
      payload.sources.length > 0
        ? payload.sources
        : fallbackSources.length > 0
          ? fallbackSources
          : undefined,
    outcome: undefined,
    plainText:
      payload.plainText ??
      [payload.lead, payload.summary]
        .filter(Boolean)
        .join(' ')
        .trim() ||
      undefined,
  };
}

function buildLocalizedFallback(
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
        failed.length
          ? `Osa tiedoista voi olla epävarma: ${failed.join(', ')}.`
          : '',
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
        failed.length
          ? `Vissa detaljer kan vara osäkra: ${failed.join(', ')}.`
          : '',
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
        failed.length
          ? `Algunos detalles pueden ser inciertos: ${failed.join(', ')}.`
          : '',
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
      failed.length
        ? `A few details may be uncertain: ${failed.join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

function buildFallbackStructuredAnswer(
  input: GenerateFinalAnswerInput,
  text: string,
): StructuredAnswer | undefined {
  const requestText = getRequestText(input.request);
  const lowered = requestText.toLowerCase();
  const sources = buildSourceList(input.toolResults);

  const asksForTodayPlan =
    /\b(what should i do today|today plan|plan my day|what now today)\b/i.test(
      lowered,
    ) || /\b(today|todays|this morning|this afternoon)\b/i.test(lowered);

  if (asksForTodayPlan || input.route.intent === 'planning') {
    return {
      title: 'Today plan',
      summary: text,
      sections: input.plan.steps.slice(0, 3).map((step, index) => ({
        label: index === 0 ? 'Priority' : undefined,
        content: step.title,
        tone: index === 0 ? 'important' : index === 2 ? 'success' : 'default',
      })),
      actions: [
        { id: 'open_calendar', label: 'Open Calendar', kind: 'primary' },
      ],
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

function buildFallbackAnswer(
  input: GenerateFinalAnswerInput,
  language: string,
): AgentFinalAnswer {
  const requestText = getRequestText(input.request);
  const { successful, failed } = summarizeToolResults(input.toolResults);
  const localized = buildLocalizedFallback(language, {
    requestText,
    memorySummary: input.memorySummary,
    successful,
    failed,
  });

  return {
    text: localized.text,
    structured: buildFallbackStructuredAnswer(input, localized.text),
    confidence: estimateConfidence(
      input.route,
      input.toolResults,
      localized.text,
    ),
    followUps: [],
    metadata: {
      intent: input.route.intent,
      inputLanguage: input.route.inputLanguage,
      responseLanguage: language,
      successfulTools: input.toolResults
        .filter((item) => item.ok)
        .map((item) => item.tool),
      failedTools: input.toolResults
        .filter((item) => !item.ok)
        .map((item) => item.tool),
      planId: input.plan.id,
      stepCount: input.plan.steps.length,
      mode: 'fallback',
    },
  };
}

async function generateWithModel(
  input: GenerateFinalAnswerInput,
): Promise<LlmStructuredAnswerSchema | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const requestText = getRequestText(input.request);
  const language = getLanguage(input);
  const conversation = getConversationMessages(input.request);
  const { compactJson } = summarizeToolResults(input.toolResults);
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;
  const responseMode = getResponseMode(input);
  const generatorModel =
    normalizeText(metadata.generatorModel) || 'openai/gpt-oss-120b';

  const systemPrompt = [
    'You are the final answer generator for Kivo, a premium AI assistant.',
    'Your job is to create a beautiful user-facing answer.',
    'Never expose internal reasoning, planning stages, tool logs, or system pipeline labels.',
    'Never use headings like Structured Answer, Analysis, Interpret Request, Retrieve Memory Context, or Synthesize Findings.',
    'Only show what helps the user.',
    buildModeInstruction(responseMode),
    buildLanguageInstruction(language),
    'Return ONLY valid JSON with this exact schema:',
    JSON.stringify(
      {
        title: 'string | null',
        lead: 'string | null',
        summary: 'string | null',
        highlights: [
          {
            text: 'string',
            tone: 'default | important | success | warning',
          },
        ],
        nextStep: 'string | null',
        sources: [
          {
            id: 'string',
            label: 'string',
            used: true,
          },
        ],
        plainText: 'string | null',
      },
      null,
      2,
    ),
    'Rules:',
    '- title only if genuinely useful',
    '- lead should directly answer the user',
    '- summary should add helpful context',
    '- highlights should be user-helpful, not technical',
    '- nextStep should be one clear action if helpful',
    '- sources only if actually used',
    '- plainText should be a safe fallback',
    '- no markdown',
    '- no extra keys',
  ].join('\n');

  const userPrompt = [
    `User request: ${requestText}`,
    `Intent: ${input.route.intent}`,
    `Response mode: ${responseMode}`,
    `User goal: ${normalizeText(input.route.userGoal) || 'Help with the user request.'}`,
    `Entities: ${Array.isArray(input.route.entities) ? input.route.entities.join(', ') : ''}`,
    `Memory summary: ${normalizeText(input.memorySummary) || 'none'}`,
    'Recent conversation:',
    conversation.length
      ? conversation.map((item) => `${item.role}: ${item.content}`).join('\n')
      : 'none',
    'Tool results JSON:',
    compactJson,
    `Plan steps: ${input.plan.steps.map((step) => step.title).join(' -> ')}`,
    'Now produce the best possible structured answer for the user.',
  ].join('\n\n');

  try {
    const completion = await groq.chat.completions.create({
      model: generatorModel,
      temperature: 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const rawOutput = trimOuterWhitespace(completion.choices?.[0]?.message?.content);
    if (!rawOutput) return null;

    const jsonBlock = extractJsonBlock(rawOutput);
    if (!jsonBlock) return null;

    const parsed = JSON.parse(jsonBlock) as Partial<LlmStructuredAnswerSchema>;
    return normalizeStructuredPayload(parsed);
  } catch {
    return null;
  }
}

export async function generateFinalAnswer(
  input: GenerateFinalAnswerInput,
): Promise<AgentFinalAnswer> {
  const language = getLanguage(input);
  const llmStructured = await generateWithModel(input);

  if (!llmStructured) {
    return buildFallbackAnswer(input, language);
  }

  const mappedStructured = mapLlmStructuredToAppStructured(input, llmStructured);
  const finalText =
    mappedStructured.plainText ||
    mappedStructured.summary ||
    llmStructured.lead ||
    llmStructured.summary ||
    '';

  const confidence = estimateConfidence(
    input.route,
    input.toolResults,
    finalText,
  );

  return {
    text: finalText,
    structured: mappedStructured,
    confidence,
    followUps: [],
    metadata: {
      intent: input.route.intent,
      inputLanguage: input.route.inputLanguage,
      responseLanguage: language,
      successfulTools: input.toolResults
        .filter((result) => result.ok)
        .map((result) => result.tool),
      failedTools: input.toolResults
        .filter((result) => !result.ok)
        .map((result) => result.tool),
      planId: input.plan.id,
      stepCount: input.plan.steps.length,
      mode: 'model',
    },
  };
}

function chunkText(text: string, chunkSize = 110): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let rest = normalized;

  while (rest.length > chunkSize) {
    let splitIndex = rest.lastIndexOf(' ', chunkSize);
    if (splitIndex < Math.floor(chunkSize * 0.55)) {
      splitIndex = chunkSize;
    }

    chunks.push(rest.slice(0, splitIndex).trim());
    rest = rest.slice(splitIndex).trim();
  }

  if (rest) chunks.push(rest);

  return chunks;
}

export async function* generateFinalAnswerStream(
  input: GenerateFinalAnswerInput,
): AsyncGenerator<AgentStreamEvent> {
  const answer = await generateFinalAnswer(input);
  const chunks = chunkText(answer.text);

  if (chunks.length === 0) {
    yield {
      type: 'answer_completed',
      requestId: input.request.requestId,
      timestamp: new Date().toISOString(),
      payload: { answer },
    };
    return;
  }

  for (const chunk of chunks) {
    yield {
      type: 'answer_delta',
      requestId: input.request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        delta: `${chunk}${chunk === chunks[chunks.length - 1] ? '' : ' '}`,
      },
    };
  }

  yield {
    type: 'answer_completed',
    requestId: input.request.requestId,
    timestamp: new Date().toISOString(),
    payload: { answer },
  };
}
