import { openai } from '@/ai/openai';

import type { AgentFinalAnswer } from './types';
import {
  buildAnswerMetadata,
  buildFallbackStructuredAnswer,
  estimateConfidence,
  extractJsonBlock,
  type GenerateFinalAnswerInput,
  getConversationMessages,
  getLanguage,
  getRequestText,
  mapLlmStructuredToAppStructured,
  normalizeStructuredPayload,
  normalizeText,
  summarizeToolResults,
} from './generator-types';
import { decideResponseMode } from './generator-response-mode';
import { resolveResponsePolicy } from '@/agent/response-intelligence';

const DEFAULT_OPENAI_RESPONSES_MODEL = 'gpt-5-mini';

type ResponsesStructuredEnvelope = {
  text: string;
  structured: {
    title: string | null;
    lead: string | null;
    summary: string | null;
    highlights: Array<{
      text: string;
      tone: 'default' | 'important' | 'success' | 'warning';
    }>;
    nextStep: string | null;
    sources: Array<{
      id: string;
      label: string;
      used: boolean;
    }>;
    plainText: string | null;
  };
};

export type ResponsesFinalAnswerResult = {
  text: string;
  structured: NonNullable<AgentFinalAnswer['structured']>;
  structuredData: NonNullable<AgentFinalAnswer['structuredData']>;
  confidence: number;
  followUps: string[];
  metadata: NonNullable<AgentFinalAnswer['metadata']>;
  rawOutputText: string;
};

function resolveOpenAiResponsesModel(input: GenerateFinalAnswerInput): string {
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;

  return (
    normalizeText(metadata.openaiResponsesModel) ||
    process.env.OPENAI_RESPONSES_MODEL ||
    process.env.OPENAI_MODEL ||
    DEFAULT_OPENAI_RESPONSES_MODEL
  );
}

function buildSystemPrompt(language: string): string {
  return [
    'You are the final answer generator for Kivo, a premium AI assistant.',
    `Respond only in ${language}.`,
    'Return strict JSON only with this shape:',
    '{"text":string,"structured":{"title":string|null,"lead":string|null,"summary":string|null,"highlights":[{"text":string,"tone":"default|important|success|warning"}],"nextStep":string|null,"sources":[{"id":string,"label":string,"used":boolean}],"plainText":string|null}}',
    'No markdown fences. No additional keys. No tools.',
  ].join('\n');
}

function buildUserPrompt(input: GenerateFinalAnswerInput): string {
  const requestText = getRequestText(input.request);
  const conversation = getConversationMessages(input.request)
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');
  const toolSummary = summarizeToolResults(input.toolResults).compactJson;

  return [
    `User request: ${requestText || 'none'}`,
    `Intent: ${input.route.intent}`,
    `Plan summary: ${input.plan.summary}`,
    `Memory summary: ${input.memorySummary || 'none'}`,
    `Conversation:\n${conversation || 'none'}`,
    `Tool results:\n${toolSummary}`,
    'Produce a concise, high-signal final answer and structured payload.',
  ].join('\n\n');
}

function extractOutputText(response: unknown): string {
  const payload =
    response && typeof response === 'object'
      ? (response as {
          output_text?: unknown;
          output?: Array<{
            content?: Array<{ type?: string; text?: string; [key: string]: unknown }>;
          }>;
        })
      : undefined;

  const direct = normalizeText(payload?.output_text);
  if (direct) return direct;

  const segments = (payload?.output ?? [])
    .flatMap((entry) => (Array.isArray(entry.content) ? entry.content : []))
    .map((part) => (part.type === 'output_text' || part.type === 'text' ? normalizeText(part.text) : ''))
    .filter(Boolean);

  return segments.join('\n').trim();
}

function toAgentFinalShape(params: {
  input: GenerateFinalAnswerInput;
  rawText: string;
  parsed: ResponsesStructuredEnvelope | null;
}): ResponsesFinalAnswerResult {
  const { input, rawText, parsed } = params;
  const language = getLanguage(input);
  const toolSummaries = summarizeToolResults(input.toolResults).structured;
  const normalizedStructured = parsed?.structured
    ? normalizeStructuredPayload(parsed.structured)
    : null;
  const structuredForMode = normalizedStructured
    ? mapLlmStructuredToAppStructured(input, normalizedStructured)
    : undefined;
  const responseType = decideResponseMode({
    input,
    toolSummaries,
    structured: structuredForMode,
    confidence: input.route.confidence ?? 0.6,
  });

  const policy = resolveResponsePolicy({
    intent:
      responseType === 'search' ||
      responseType === 'shopping' ||
      responseType === 'compare' ||
      responseType === 'email' ||
      responseType === 'operator' ||
      responseType === 'plain'
        ? responseType
        : 'plain',
    userMessage: getRequestText(input.request),
    detectedLanguage: language,
    explicitLanguage:
      normalizeText(input.route.responseLanguage) ||
      normalizeText(input.request.responseLanguage) ||
      null,
    responseMode: 'operator',
    hasStructuredResults: toolSummaries.some((item) => item.ok),
    confidence: input.route.confidence ?? null,
  });

  const mapped = normalizedStructured
    ? mapLlmStructuredToAppStructured(input, normalizedStructured)
    : buildFallbackStructuredAnswer(input, parsed?.text || rawText) || {
        summary: parsed?.text || rawText,
        plainText: parsed?.text || rawText,
      };

  const finalText =
    normalizeText(parsed?.text) ||
    normalizeText(mapped.plainText) ||
    normalizeText(mapped.summary) ||
    normalizeText(rawText);

  return {
    text: finalText,
    structured: {
      ...mapped,
      plainText: mapped.plainText || finalText,
    },
    structuredData: {
      responseType,
      title: mapped.title ?? null,
      lead: mapped.lead ?? null,
      summary: mapped.summary ?? finalText,
      nextActions: [],
      risks: [],
      opportunities: [],
    },
    confidence: estimateConfidence(input.route, input.toolResults, finalText),
    followUps: [],
    metadata: buildAnswerMetadata(input, policy.language, 'model', responseType) ?? {},
    rawOutputText: rawText,
  };
}

function parseEnvelope(rawText: string): ResponsesStructuredEnvelope | null {
  const jsonBlock = extractJsonBlock(rawText);
  if (!jsonBlock) return null;

  try {
    const parsed = JSON.parse(jsonBlock) as Partial<ResponsesStructuredEnvelope>;
    const text = normalizeText(parsed.text);
    const structured = normalizeStructuredPayload(parsed.structured ?? {});

    if (!text && !structured) return null;

    return {
      text,
      structured: structured ?? {
        title: null,
        lead: null,
        summary: text || null,
        highlights: [],
        nextStep: null,
        sources: [],
        plainText: text || null,
      },
    };
  } catch {
    return null;
  }
}

export async function generateFinalAnswerWithResponses(
  input: GenerateFinalAnswerInput,
): Promise<ResponsesFinalAnswerResult | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const language = getLanguage(input);
  const model = resolveOpenAiResponsesModel(input);

  try {
    const response = await openai.responses.create({
      model,
      temperature: 0.2,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: buildSystemPrompt(language) }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: buildUserPrompt(input) }],
        },
      ],
    });

    const rawOutputText = extractOutputText(response);
    if (!rawOutputText) return null;

    return toAgentFinalShape({
      input,
      rawText: rawOutputText,
      parsed: parseEnvelope(rawOutputText),
    });
  } catch (error) {
    console.error('VNEXT_RESPONSES_FINAL_ANSWER_ERROR', {
      requestId: input.request.requestId,
      model,
      error,
    });
    return null;
  }
}
