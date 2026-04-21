import { groq } from '@/ai/groq';
import { openai } from '@/ai/openai';
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

const DEFAULT_OPENAI_GENERATOR_MODEL = 'gpt-5-mini';
const DEFAULT_GROQ_GENERATOR_MODEL = 'openai/gpt-oss-120b';

type FinalTextInput = {
  input: GenerateFinalAnswerInput;
  structured: NonNullable<AgentFinalAnswer['structured']>;
  toolSummaries: ReturnType<typeof summarizeToolResults>['structured'];
  currentText: string;
  responseType: StructuredPayloadSchema['responseType'];
};

type ToolLike =
  | 'gmail'
  | 'calendar'
  | 'web'
  | 'compare'
  | 'finance'
  | 'memory'
  | 'file'
  | 'files'
  | 'notes'
  | 'browser_search'
  | 'browser'
  | string;

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
        'No robotic phrasing, no workflow theater, no internal narration.',
      ].join(' ');
    case 'fast':
      return [
        'Mode: fast.',
        'Be concise, decisive, and immediately useful.',
        'Prefer compact wording with high signal.',
      ].join(' ');
    case 'tool':
      return [
        'Mode: tool.',
        'Ground the answer in available tool context.',
        'Never pretend missing tools were used.',
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

function resolveExecutionIntentFromTool(
  tool: ToolLike,
): 'email' | 'calendar' | 'browser' | 'memory' | 'files' | 'general' {
  if (tool === 'gmail') return 'email';
  if (tool === 'calendar') return 'calendar';
  if (
    tool === 'web' ||
    tool === 'compare' ||
    tool === 'finance' ||
    tool === 'browser_search' ||
    tool === 'browser'
  ) {
    return 'browser';
  }
  if (tool === 'memory') return 'memory';
  if (tool === 'file' || tool === 'files' || tool === 'notes') return 'files';
  return 'general';
}

function pickExecutionIntent(tools: string[]) {
  if (tools.some((tool) => tool === 'gmail')) return 'email' as const;
  if (tools.some((tool) => tool === 'calendar')) return 'calendar' as const;
  if (
    tools.some(
      (tool) =>
        tool === 'web' ||
        tool === 'compare' ||
        tool === 'finance' ||
        tool === 'browser_search' ||
        tool === 'browser',
    )
  ) {
    return 'browser' as const;
  }
  if (tools.some((tool) => tool === 'memory')) return 'memory' as const;
  if (tools.some((tool) => tool === 'file' || tool === 'files' || tool === 'notes')) {
    return 'files' as const;
  }
  return resolveExecutionIntentFromTool(tools[0] ?? '');
}

function buildExecutionIntro(
  intent: 'email' | 'calendar' | 'browser' | 'memory' | 'files' | 'general',
): string | undefined {
  switch (intent) {
    case 'email':
      return 'Sure — checking your email now.';
    case 'calendar':
      return 'Got it — reviewing your calendar now.';
    case 'browser':
      return 'On it — researching this now.';
    case 'memory':
      return 'Let me check your saved context.';
    case 'files':
      return 'Reviewing your files now.';
    default:
      return undefined;
  }
}

function buildExecutionStatus(
  intent: 'email' | 'calendar' | 'browser' | 'memory' | 'files' | 'general',
): string {
  switch (intent) {
    case 'email':
      return 'Reviewing recent messages...';
    case 'calendar':
      return 'Reviewing upcoming events...';
    case 'browser':
      return 'Checking relevant sources...';
    case 'memory':
      return 'Searching memory...';
    case 'files':
      return 'Analyzing attached files...';
    default:
      return 'Working on it...';
  }
}

function buildExecutionData(input: {
  generatorInput: GenerateFinalAnswerInput;
  responseType: StructuredPayloadSchema['responseType'];
}): StructuredPayloadSchema['execution'] | undefined {
  const { generatorInput, responseType } = input;

  const requestedTools = Array.isArray(generatorInput.route.requiresTools)
    ? generatorInput.route.requiresTools.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )
    : [];

  const usedTools = generatorInput.toolResults
    .map((item) => item.tool)
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0);

  const toolSet = [...new Set([...requestedTools, ...usedTools])];

  if (toolSet.length === 0) return undefined;

  const intent = pickExecutionIntent(toolSet);
  const hasFailures = generatorInput.toolResults.some((item) => !item.ok);
  const hasResults = generatorInput.toolResults.length > 0;

  const forceMode: StructuredPayloadSchema['execution']['forceMode'] =
    hasFailures || hasResults
      ? 'execution'
      : responseType === 'plain'
        ? 'thinking'
        : 'status';

  return {
    intent,
    forceMode,
    introText: buildExecutionIntro(intent),
    statusText: buildExecutionStatus(intent),
    activeStepId: hasFailures ? 'summary' : hasResults ? 'summary' : 'process',
    doneStepIds: hasResults ? ['connect', 'fetch', 'review'] : [],
    errorStepIds: hasFailures ? ['summary'] : [],
    toolCount: toolSet.length,
  };
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
    execution: buildExecutionData({
      generatorInput,
      responseType,
    }),
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

function parseStructuredPayload(
  content: string | null | undefined,
): LlmStructuredAnswerSchema | null {
  const rawOutput = trimOuterWhitespace(content);
  if (!rawOutput) return null;

  const jsonBlock = extractJsonBlock(rawOutput);
  if (!jsonBlock) return null;

  const parsed = JSON.parse(jsonBlock) as Partial<LlmStructuredAnswerSchema>;
  return normalizeStructuredPayload(parsed);
}

async function tryOpenAiGeneration(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<LlmStructuredAnswerSchema | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const completion = await openai.chat.completions.create({
      model: params.model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    return parseStructuredPayload(completion.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

async function tryGroqGeneration(params: {
  model: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<LlmStructuredAnswerSchema | null> {
  if (!process.env.GROQ_API_KEY) return null;

  try {
    const completion = await groq.chat.completions.create({
      model: params.model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: params.systemPrompt },
        { role: 'user', content: params.userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    return parseStructuredPayload(completion.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}

async function generateWithModel(
  input: GenerateFinalAnswerInput,
): Promise<LlmStructuredAnswerSchema | null> {
  if (!process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) return null;

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

  const groqGeneratorModel =
    normalizeText(metadata.groqGeneratorModel) ||
    normalizeText(metadata.generatorModel) ||
    process.env.GROQ_MODEL ||
    DEFAULT_GROQ_GENERATOR_MODEL;

  const openaiGeneratorModel =
    normalizeText(metadata.openaiGeneratorModel) ||
    normalizeText(metadata.generatorModel) ||
    process.env.OPENAI_MODEL ||
    process.env.AI_MODEL ||
    DEFAULT_OPENAI_GENERATOR_MODEL;

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
    '- for compare, lead with the verdict and major differences',
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
      normalizeText(input.route.reason) ||
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

  const openAiResult = await tryOpenAiGeneration({
    model: openaiGeneratorModel,
    systemPrompt,
    userPrompt,
  });
  if (openAiResult) return openAiResult;

  return tryGroqGeneration({
    model: groqGeneratorModel,
    systemPrompt,
    userPrompt,
  });
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

function chunkText(text: string, chunkSize = 90): string[] {
  const normalized = trimOuterWhitespace(text);
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
