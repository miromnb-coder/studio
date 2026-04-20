import { groq } from '@/ai/groq';
import type { ResponseMode } from '@/agent/types/response-mode';
import { resolveResponsePolicy } from '@/agent/response-intelligence';

import type { AgentFinalAnswer, AgentStreamEvent } from './types';
import {
  buildAnswerMetadata,
  buildFallbackStructuredAnswer,
  buildLocalizedFallback,
  estimateConfidence,
  extractJsonBlock,
  GenerateFinalAnswerInput,
  getConversationMessages,
  getLanguage,
  getRequestText,
  LlmStructuredAnswerSchema,
  mapLlmStructuredToAppStructured,
  normalizeStructuredPayload,
  normalizeText,
  StructuredPayloadSchema,
  summarizeToolResults,
  trimOuterWhitespace,
} from './generator-types';
import { decideResponseMode } from './generator-response-mode';
import {
  buildSearchResponse,
  buildSearchUserFacingText,
} from './generator-search';
import { buildShoppingResponse } from './generator-shopping';
import { buildCompareResponse } from './generator-compare';
import { buildEmailResponse } from './generator-email';
import { buildOperatorResponse } from './generator-operator';

type FinalTextInput = {
  input: GenerateFinalAnswerInput;
  structured: NonNullable<AgentFinalAnswer['structured']>;
  toolSummaries: ReturnType<typeof summarizeToolResults>['structured'];
  currentText: string;
  responseType: StructuredPayloadSchema['responseType'];
};

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

function resolveIntentForPolicy(
  responseType: StructuredPayloadSchema['responseType'],
  input: GenerateFinalAnswerInput,
):
  | 'plain'
  | 'search'
  | 'shopping'
  | 'compare'
  | 'email'
  | 'calendar'
  | 'operator' {
  if (
    responseType === 'search' ||
    responseType === 'shopping' ||
    responseType === 'compare' ||
    responseType === 'email' ||
    responseType === 'operator' ||
    responseType === 'plain'
  ) {
    return responseType;
  }

  if (input.route.intent === 'planning' || input.route.intent === 'productivity') {
    return 'calendar';
  }

  return 'plain';
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

function buildLengthInstruction(length: 'short' | 'medium' | 'deep'): string {
  switch (length) {
    case 'short':
      return 'Keep the visible answer short. Prefer 1-2 concise paragraphs maximum.';
    case 'deep':
      return 'You may give a more complete answer, but still stay structured and avoid bloated filler.';
    case 'medium':
    default:
      return 'Keep the answer moderately concise and readable.';
  }
}

function buildStyleInstruction(
  style:
    | 'concise'
    | 'source_first'
    | 'recommendation_first'
    | 'comparison_first'
    | 'operator'
    | 'casual',
) {
  switch (style) {
    case 'source_first':
      return 'For search/news answers, give a short summary and let sources carry the detail.';
    case 'recommendation_first':
      return 'For shopping answers, lead with the best recommendation before secondary options.';
    case 'comparison_first':
      return 'For comparison answers, lead with the verdict and core differences.';
    case 'operator':
      return 'For operator answers, lead with the decision and the next action.';
    case 'casual':
      return 'Keep the tone natural, warm, and light.';
    case 'concise':
    default:
      return 'Prefer concise, high-signal wording over long explanation.';
  }
}

function buildStructuredData(input: {
  generatorInput: GenerateFinalAnswerInput;
  finalText: string;
  mappedStructured: NonNullable<AgentFinalAnswer['structured']>;
  toolSummaries: ReturnType<typeof summarizeToolResults>['structured'];
}): StructuredPayloadSchema {
  const { generatorInput, finalText, mappedStructured, toolSummaries } = input;

  const confidence = estimateConfidence(
    generatorInput.route,
    generatorInput.toolResults,
    finalText,
  );

  const responseType = decideResponseMode({
    input: generatorInput,
    toolSummaries,
    structured: mappedStructured,
    confidence,
  });

  const base: StructuredPayloadSchema = {
    responseType,
    title: mappedStructured.title ?? null,
    lead: mappedStructured.lead ?? null,
    summary: mappedStructured.summary ?? null,
  };

  if (responseType === 'search') {
    return {
      ...base,
      ...buildSearchResponse({ structured: mappedStructured, toolSummaries }),
    };
  }

  if (responseType === 'shopping') {
    return {
      ...base,
      ...buildShoppingResponse({ structured: mappedStructured, toolSummaries }),
    };
  }

  if (responseType === 'compare') {
    return {
      ...base,
      ...buildCompareResponse({ structured: mappedStructured, toolSummaries }),
    };
  }

  if (responseType === 'email') {
    return {
      ...base,
      ...buildEmailResponse({ structured: mappedStructured, toolSummaries }),
    };
  }

  if (responseType === 'operator') {
    return {
      ...base,
      ...buildOperatorResponse({
        input: generatorInput,
        structured: mappedStructured,
        toolSummaries,
      }),
    };
  }

  return base;
}

async function generateWithModel(
  input: GenerateFinalAnswerInput,
): Promise<LlmStructuredAnswerSchema | null> {
  if (!process.env.GROQ_API_KEY) return null;

  const requestText = getRequestText(input.request);
  const detectedLanguage = getLanguage(input);
  const conversation = getConversationMessages(input.request);
  const { compactJson, structured } = summarizeToolResults(input.toolResults);
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;
  const responseMode = getResponseMode(input);

  const previewResponseType = decideResponseMode({
    input,
    toolSummaries: structured,
    structured: undefined,
    confidence: input.route.confidence ?? 0.6,
  });

  const policy = resolveResponsePolicy({
    intent: resolveIntentForPolicy(previewResponseType, input),
    userMessage: requestText,
    detectedLanguage,
    explicitLanguage:
      normalizeText(input.route.responseLanguage) ||
      normalizeText(input.request.responseLanguage) ||
      null,
    responseMode,
    hasStructuredResults: structured.some((item) => item.ok),
    confidence: input.route.confidence ?? null,
  });

  const generatorModel =
    normalizeText(metadata.generatorModel) || 'openai/gpt-oss-120b';

  const systemPrompt = [
    'You are the final answer generator for Kivo, a premium AI assistant.',
    'Your job is to create a polished user-facing answer.',
    'Never expose internal reasoning, planning stages, tool logs, provider diagnostics, query/mode/provider metadata, or system pipeline labels.',
    'Never write raw search-debug text such as Query, Mode, Provider, URL, Snippet, or Live browser search results.',
    'Only show what helps the user.',
    buildModeInstruction(responseMode),
    buildLanguageInstruction(policy.language),
    buildLengthInstruction(policy.length),
    buildStyleInstruction(policy.style),
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
    '- for search/news, keep the answer short and source-first',
    '- for shopping, keep buying advice short and recommendation-first',
    '- for compare, lead with the decision and major differences',
    '- no markdown',
    '- no extra keys',
  ].join('\n');

  const userPrompt = [
    `User request: ${requestText}`,
    `Intent: ${input.route.intent}`,
    `Planned response type: ${previewResponseType}`,
    `Resolved language: ${policy.language}`,
    `Resolved style: ${policy.style}`,
    `Resolved length: ${policy.length}`,
    `Response mode: ${responseMode}`,
    `User goal: ${
      normalizeText((input.route as { userGoal?: string }).userGoal) ||
      'Help with the user request.'
    }`,
    `Entities: ${
      Array.isArray((input.route as { entities?: string[] }).entities)
        ? ((input.route as { entities?: string[] }).entities ?? []).join(', ')
        : ''
    }`,
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

    const rawOutput = trimOuterWhitespace(
      completion.choices?.[0]?.message?.content,
    );
    if (!rawOutput) return null;

    const jsonBlock = extractJsonBlock(rawOutput);
    if (!jsonBlock) return null;

    const parsed = JSON.parse(jsonBlock) as Partial<LlmStructuredAnswerSchema>;
    return normalizeStructuredPayload(parsed);
  } catch {
    return null;
  }
}

function buildPolicyAwareSearchText(params: {
  input: GenerateFinalAnswerInput;
  structured: NonNullable<AgentFinalAnswer['structured']>;
  toolSummaries: ReturnType<typeof summarizeToolResults>['structured'];
  currentText: string;
  responseType: StructuredPayloadSchema['responseType'];
}): string {
  const { input, structured, toolSummaries, currentText, responseType } = params;

  const requestText = getRequestText(input.request);
  const detectedLanguage = getLanguage(input);

  const policy = resolveResponsePolicy({
    intent: resolveIntentForPolicy(responseType, input),
    userMessage: requestText,
    detectedLanguage,
    explicitLanguage:
      normalizeText(input.route.responseLanguage) ||
      normalizeText(input.request.responseLanguage) ||
      null,
    responseMode: getResponseMode(input),
    hasStructuredResults: toolSummaries.some((item) => item.ok),
    confidence: input.route.confidence ?? null,
  });

  return buildSearchUserFacingText({
    language: policy.language,
    query: requestText,
    structured,
    toolSummaries,
    currentText,
  });
}

function finalizeVisibleText(params: FinalTextInput): string {
  const { responseType } = params;

  if (responseType === 'search') {
    return buildPolicyAwareSearchText(params);
  }

  return params.currentText;
}

function buildFallbackAnswer(
  input: GenerateFinalAnswerInput,
  language: string,
): AgentFinalAnswer {
  const requestText = getRequestText(input.request);
  const { successful, failed, structured } = summarizeToolResults(
    input.toolResults,
  );

  const previewResponseType = decideResponseMode({
    input,
    toolSummaries: structured,
    structured: undefined,
    confidence: input.route.confidence ?? 0.6,
  });

  const policy = resolveResponsePolicy({
    intent: resolveIntentForPolicy(previewResponseType, input),
    userMessage: requestText,
    detectedLanguage: language,
    explicitLanguage:
      normalizeText(input.route.responseLanguage) ||
      normalizeText(input.request.responseLanguage) ||
      null,
    responseMode: getResponseMode(input),
    hasStructuredResults: structured.some((item) => item.ok),
    confidence: input.route.confidence ?? null,
  });

  const localized = buildLocalizedFallback(policy.language, {
    requestText,
    memorySummary: input.memorySummary,
    successful,
    failed,
  });

  const fallbackStructured =
    buildFallbackStructuredAnswer(input, localized.text) ?? {
      plainText: localized.text,
      summary: localized.text,
    };

  const preliminaryStructuredData = buildStructuredData({
    generatorInput: input,
    finalText: localized.text,
    mappedStructured: fallbackStructured,
    toolSummaries: structured,
  });

  const finalText = finalizeVisibleText({
    input,
    structured: fallbackStructured,
    toolSummaries: structured,
    currentText: localized.text,
    responseType: preliminaryStructuredData.responseType,
  });

  const finalStructured =
    preliminaryStructuredData.responseType === 'search'
      ? {
          ...fallbackStructured,
          plainText: finalText,
          summary: fallbackStructured.summary || finalText,
        }
      : fallbackStructured;

  const structuredData =
    preliminaryStructuredData.responseType === 'search'
      ? buildStructuredData({
          generatorInput: input,
          finalText,
          mappedStructured: finalStructured,
          toolSummaries: structured,
        })
      : preliminaryStructuredData;

  return {
    text: finalText,
    structured: finalStructured,
    structuredData,
    confidence: estimateConfidence(
      input.route,
      input.toolResults,
      finalText,
      structuredData,
    ),
    followUps: [],
    metadata: buildAnswerMetadata(
      input,
      policy.language,
      'fallback',
      structuredData.responseType,
    ),
  };
}

export async function generateFinalAnswer(
  input: GenerateFinalAnswerInput,
): Promise<AgentFinalAnswer> {
  const detectedLanguage = getLanguage(input);
  const llmStructured = await generateWithModel(input);

  if (!llmStructured) {
    return buildFallbackAnswer(input, detectedLanguage);
  }

  const toolSummary = summarizeToolResults(input.toolResults);
  const mappedStructured = mapLlmStructuredToAppStructured(input, llmStructured);

  const preliminaryText =
    mappedStructured.plainText ||
    mappedStructured.lead ||
    mappedStructured.summary ||
    llmStructured.lead ||
    llmStructured.summary ||
    '';

  const preliminaryStructuredData = buildStructuredData({
    generatorInput: input,
    finalText: preliminaryText,
    mappedStructured,
    toolSummaries: toolSummary.structured,
  });

  const policy = resolveResponsePolicy({
    intent: resolveIntentForPolicy(preliminaryStructuredData.responseType, input),
    userMessage: getRequestText(input.request),
    detectedLanguage,
    explicitLanguage:
      normalizeText(input.route.responseLanguage) ||
      normalizeText(input.request.responseLanguage) ||
      null,
    responseMode: getResponseMode(input),
    hasStructuredResults: toolSummary.structured.some((item) => item.ok),
    confidence: input.route.confidence ?? null,
  });

  const finalText = finalizeVisibleText({
    input,
    structured: mappedStructured,
    toolSummaries: toolSummary.structured,
    currentText: preliminaryText,
    responseType: preliminaryStructuredData.responseType,
  });

  const finalStructured =
    preliminaryStructuredData.responseType === 'search'
      ? {
          ...mappedStructured,
          plainText: finalText,
          summary: mappedStructured.summary || finalText,
        }
      : mappedStructured;

  const structuredData =
    preliminaryStructuredData.responseType === 'search'
      ? buildStructuredData({
          generatorInput: input,
          finalText,
          mappedStructured: finalStructured,
          toolSummaries: toolSummary.structured,
        })
      : preliminaryStructuredData;

  const confidence = estimateConfidence(
    input.route,
    input.toolResults,
    finalText,
    structuredData,
  );

  return {
    text: finalText,
    structured: finalStructured,
    structuredData,
    confidence,
    followUps: [],
    metadata: buildAnswerMetadata(
      input,
      policy.language,
      'model',
      structuredData.responseType,
    ),
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

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];

    yield {
      type: 'answer_delta',
      requestId: input.request.requestId,
      timestamp: new Date().toISOString(),
      payload: {
        delta: `${chunk}${index === chunks.length - 1 ? '' : ' '}`,
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
