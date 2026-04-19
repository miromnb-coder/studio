import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import {
  resolveRequiredTools,
  resolveDefaultToolsForIntent,
} from '@/agent/integrations/integration-router';
import { detectToolNecessity } from '@/agent/integrations/tool-necessity';
import type {
  AgentIntent,
  AgentRequest,
  AgentRouteResult,
  AgentToolName,
} from './types';

type ModelRouteSchema = {
  inputLanguage: string;
  responseLanguage: string;
  languageConfidence: number;
  multilingual: boolean;
  intent: AgentIntent;
  confidence: number;
  userGoal: string;
  entities: string[];
  requiresTools: AgentToolName[];
  shouldFetchMemory: boolean;
  suggestedExecutionMode: 'sync' | 'stream';
  reason: string;
};

const ROUTER_MODEL_FALLBACK = 'gpt-4.1-mini';

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

function getConversationText(request: AgentRequest): string {
  const raw =
    (request as AgentRequest & {
      conversation?: Array<{ role?: string; content?: string }>;
    }).conversation ?? [];

  if (!Array.isArray(raw)) return '';

  return raw
    .filter(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.content === 'string' &&
        item.content.trim().length > 0,
    )
    .slice(-8)
    .map((item) => `${item.role || 'user'}: ${item.content?.trim()}`)
    .join('\n');
}

function defaultResponseLanguage(request: AgentRequest): string | undefined {
  const explicit = normalizeText(
    (request as AgentRequest & { responseLanguage?: string }).responseLanguage,
  );
  if (explicit) return explicit.toLowerCase();

  const inputLanguage = normalizeText(
    (request as AgentRequest & { inputLanguage?: string }).inputLanguage,
  );
  if (inputLanguage) return inputLanguage.toLowerCase();

  return undefined;
}

function detectLanguageFromScript(text: string): {
  inputLanguage: string;
  responseLanguage: string;
  languageConfidence: number;
  multilingual: boolean;
} {
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      inputLanguage: 'unknown',
      responseLanguage: 'en',
      languageConfidence: 0.2,
      multilingual: false,
    };
  }

  if (/[\u4E00-\u9FFF\u3040-\u30FF]/u.test(normalized)) {
    return {
      inputLanguage: 'ja',
      responseLanguage: 'ja',
      languageConfidence: 0.78,
      multilingual: true,
    };
  }

  if (/[\u0400-\u04FF]/u.test(normalized)) {
    return {
      inputLanguage: 'ru',
      responseLanguage: 'ru',
      languageConfidence: 0.76,
      multilingual: true,
    };
  }

  if (/[\u0600-\u06FF]/u.test(normalized)) {
    return {
      inputLanguage: 'ar',
      responseLanguage: 'ar',
      languageConfidence: 0.76,
      multilingual: true,
    };
  }

  if (/[\uAC00-\uD7AF]/u.test(normalized)) {
    return {
      inputLanguage: 'ko',
      responseLanguage: 'ko',
      languageConfidence: 0.78,
      multilingual: true,
    };
  }

  if (/[\u0E00-\u0E7F]/u.test(normalized)) {
    return {
      inputLanguage: 'th',
      responseLanguage: 'th',
      languageConfidence: 0.78,
      multilingual: true,
    };
  }

  if (/[åäö]/i.test(normalized)) {
    return {
      inputLanguage: 'fi',
      responseLanguage: 'fi',
      languageConfidence: 0.64,
      multilingual: true,
    };
  }

  return {
    inputLanguage: 'unknown',
    responseLanguage: 'en',
    languageConfidence: 0.35,
    multilingual: false,
  };
}

function isAgentIntent(value: unknown): value is AgentIntent {
  return (
    value === 'general' ||
    value === 'finance' ||
    value === 'gmail' ||
    value === 'productivity' ||
    value === 'coding' ||
    value === 'memory' ||
    value === 'research' ||
    value === 'compare' ||
    value === 'planning' ||
    value === 'shopping' ||
    value === 'unknown'
  );
}

function isToolName(value: unknown): value is AgentToolName {
  return (
    value === 'gmail' ||
    value === 'memory' ||
    value === 'calendar' ||
    value === 'web' ||
    value === 'compare' ||
    value === 'file' ||
    value === 'finance' ||
    value === 'notes'
  );
}

function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function uniqueTools(values: unknown): AgentToolName[] {
  if (!Array.isArray(values)) return [];
  return unique(values.filter(isToolName));
}

function uniqueEntities(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return unique(
    values
      .filter((item): item is string => typeof item === 'string')
      .map((item) => normalizeText(item))
      .filter(Boolean),
  ).slice(0, 8);
}

function normalizeModelRoute(raw: unknown): ModelRouteSchema | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  if (!isAgentIntent(record.intent)) return null;

  return {
    inputLanguage: normalizeText(record.inputLanguage) || 'unknown',
    responseLanguage:
      normalizeText(record.responseLanguage) ||
      normalizeText(record.inputLanguage) ||
      'en',
    languageConfidence: clamp01(record.languageConfidence, 0.72),
    multilingual: Boolean(record.multilingual),
    intent: record.intent,
    confidence: clamp01(record.confidence, 0.76),
    userGoal: normalizeText(record.userGoal) || 'Help the user effectively.',
    entities: uniqueEntities(record.entities),
    requiresTools: uniqueTools(record.requiresTools),
    shouldFetchMemory:
      typeof record.shouldFetchMemory === 'boolean'
        ? record.shouldFetchMemory
        : record.intent !== 'general',
    suggestedExecutionMode:
      record.suggestedExecutionMode === 'stream' ? 'stream' : 'sync',
    reason:
      normalizeText(record.reason) ||
      'Model-based routing selected the most likely intent.',
  };
}

function extractJsonBlock(text: string): string | null {
  const trimmed = text.trim();
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

function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function inferEntitiesFromText(text: string): string[] {
  const quoted = [...text.matchAll(/"([^"]+)"|'([^']+)'/g)]
    .map((match) => normalizeText(match[1] || match[2] || ''))
    .filter(Boolean);

  const vsMatch = text.match(/(.+?)\s+(?:vs|versus)\s+(.+?)(?:[.?!]|$)/i);
  const compared = vsMatch
    ? [normalizeText(vsMatch[1]), normalizeText(vsMatch[2])].filter(Boolean)
    : [];

  return unique([...quoted, ...compared]).slice(0, 8);
}

function inferIntentFromText(text: string): AgentIntent {
  const lowered = normalizeLower(text);
  if (!lowered) return 'unknown';

  if (
    hasAnyPattern(lowered, [
      /\bcompare\b/i,
      /\bversus\b/i,
      /\bvs\b/i,
      /\bkumpi\b/i,
      /\bwhich is better\b/i,
    ])
  ) {
    return 'compare';
  }

  if (
    hasAnyPattern(lowered, [
      /\bprice\b/i,
      /\bcost\b/i,
      /\bsubscription\b/i,
      /\bsave money\b/i,
      /\bbudget\b/i,
      /\btilaus\b/i,
      /\bhinta\b/i,
      /\braha\b/i,
    ])
  ) {
    return 'finance';
  }

  if (
    hasAnyPattern(lowered, [
      /\binbox\b/i,
      /\bgmail\b/i,
      /\bemail\b/i,
      /\bmailbox\b/i,
      /\bsähköposti\b/i,
    ])
  ) {
    return 'gmail';
  }

  if (
    hasAnyPattern(lowered, [
      /\bcalendar\b/i,
      /\bschedule\b/i,
      /\bavailability\b/i,
      /\bfree time\b/i,
      /\btoday plan\b/i,
      /\bkalenteri\b/i,
      /\baikataulu\b/i,
      /\bvapaa\b/i,
    ])
  ) {
    return 'planning';
  }

  if (
    hasAnyPattern(lowered, [
      /\blatest\b/i,
      /\brecent\b/i,
      /\bnews\b/i,
      /\bcurrent\b/i,
      /\bresearch\b/i,
      /\blook up\b/i,
      /\betsi\b/i,
      /\bajankohta/i,
      /\buusin/i,
    ])
  ) {
    return 'research';
  }

  if (
    hasAnyPattern(lowered, [
      /\bbuy\b/i,
      /\bworth it\b/i,
      /\bwhich one should i buy\b/i,
      /\bshop\b/i,
      /\bproduct\b/i,
      /\bosta\b/i,
      /\bparas vaihtoehto\b/i,
    ])
  ) {
    return 'shopping';
  }

  if (
    hasAnyPattern(lowered, [
      /\bremember\b/i,
      /\bearlier\b/i,
      /\bpreviously\b/i,
      /\babout me\b/i,
      /\bmuista\b/i,
      /\baiemmin\b/i,
    ])
  ) {
    return 'memory';
  }

  if (
    hasAnyPattern(lowered, [
      /\bcode\b/i,
      /\bbug\b/i,
      /\berror\b/i,
      /\btypescript\b/i,
      /\breact\b/i,
      /\bnext\.?js\b/i,
      /\bkoodi\b/i,
      /\bvirhe\b/i,
    ])
  ) {
    return 'coding';
  }

  if (
    hasAnyPattern(lowered, [
      /\bplan\b/i,
      /\borganize\b/i,
      /\bprioritize\b/i,
      /\bnext step\b/i,
      /\bsuunnitel/i,
      /\bpriorisoi\b/i,
    ])
  ) {
    return 'planning';
  }

  return 'general';
}

function inferShouldFetchMemory(intent: AgentIntent, text: string): boolean {
  if (
    intent === 'gmail' ||
    intent === 'finance' ||
    intent === 'planning' ||
    intent === 'productivity' ||
    intent === 'memory' ||
    intent === 'shopping' ||
    intent === 'compare'
  ) {
    return true;
  }

  const lowered = normalizeLower(text);

  return hasAnyPattern(lowered, [
    /\bmy\b/i,
    /\bfor me\b/i,
    /\babout me\b/i,
    /\bpreferences\b/i,
    /\bgoals\b/i,
    /\bminun\b/i,
    /\bminulle\b/i,
    /\btavoitte/i,
  ]);
}

function inferExecutionMode(
  intent: AgentIntent,
  text: string,
  tools: AgentToolName[],
): 'sync' | 'stream' {
  const lowered = normalizeLower(text);

  const complex =
    text.split(/\s+/).filter(Boolean).length > 24 ||
    tools.length > 2 ||
    intent === 'research' ||
    intent === 'compare' ||
    intent === 'shopping' ||
    hasAnyPattern(lowered, [
      /\bdeep\b/i,
      /\bdetailed\b/i,
      /\bstep by step\b/i,
      /\bresearch\b/i,
      /\btradeoff\b/i,
      /\byksityiskoht/i,
      /\bperusteelli/i,
    ]);

  return complex ? 'stream' : 'sync';
}

function inferFallbackConfidence(
  intent: AgentIntent,
  detectedLanguageConfidence: number,
  tools: AgentToolName[],
  toolNecessityStrong: boolean,
): number {
  let base =
    intent === 'general'
      ? 0.44
      : intent === 'unknown'
        ? 0.22
        : 0.6;

  if (tools.length >= 2) base += 0.05;
  if (detectedLanguageConfidence >= 0.7) base += 0.04;
  if (toolNecessityStrong) base += 0.06;

  return clamp01(base, 0.56);
}

function applyNecessityAwareToolPolicy(params: {
  text: string;
  intent: AgentIntent;
  candidateTools: AgentToolName[];
  metadata?: Record<string, unknown>;
}): {
  tools: AgentToolName[];
  shouldFetchMemory: boolean;
  necessityReason: string;
} {
  const necessity = detectToolNecessity(params.text, {
    routeIntent: params.intent,
    currentTools: params.candidateTools,
    metadata: params.metadata,
  });

  const tools = resolveRequiredTools(params.text, params.candidateTools, {
    routeIntent: params.intent,
    currentTools: params.candidateTools,
    metadata: params.metadata,
  });

  const shouldFetchMemory =
    necessity.memory.required || inferShouldFetchMemory(params.intent, params.text);

  const reasons = [
    necessity.gmail.required ? `gmail: ${necessity.gmail.reason}` : null,
    necessity.calendar.required ? `calendar: ${necessity.calendar.reason}` : null,
    shouldFetchMemory ? `memory: ${necessity.memory.reason}` : null,
  ].filter(Boolean);

  return {
    tools,
    shouldFetchMemory,
    necessityReason: reasons.join(' ') || 'No strong user-owned source requirement detected.',
  };
}

async function routeIntentWithModel(
  request: AgentRequest,
  text: string,
): Promise<ModelRouteSchema | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const conversationText = getConversationText(request);
  const requestedLanguage = defaultResponseLanguage(request);
  const metadata = asObject(request.metadata);
  const routerModel = normalizeText(metadata.routerModel) || ROUTER_MODEL_FALLBACK;
  const candidateEntities = unique([
    ...uniqueEntities(metadata.entities),
    ...inferEntitiesFromText(text),
  ]).slice(0, 8);

  const prompt = [
    'You are a strict multilingual routing engine for an AI operator.',
    'Return JSON only.',
    'Infer the user goal from meaning, context, and constraints.',
    'Do not rely on language-specific keyword lists.',
    'Choose tools only when they are useful.',
    'Prefer the lightest effective path.',
    'Distinguish between a topic and a required user-owned data source.',
    '',
    'Schema:',
    '{',
    '  "inputLanguage": "string",',
    '  "responseLanguage": "string",',
    '  "languageConfidence": 0.0,',
    '  "multilingual": false,',
    '  "intent": "general | finance | gmail | productivity | coding | memory | research | compare | planning | shopping | unknown",',
    '  "confidence": 0.0,',
    '  "userGoal": "string",',
    '  "entities": ["string"],',
    '  "requiresTools": ["gmail" | "memory" | "calendar" | "web" | "compare" | "file" | "finance" | "notes"],',
    '  "shouldFetchMemory": true,',
    '  "suggestedExecutionMode": "sync" | "stream",',
    '  "reason": "short reason"',
    '}',
    '',
    'Tool guidelines:',
    '- gmail only when inbox/email data is actually needed.',
    '- calendar only when schedule/availability data is actually needed.',
    '- web for current/live/external information.',
    '- compare for structured option comparison.',
    '- file for uploaded/referenced file inspection.',
    '- finance for money, subscriptions, cost/savings analysis.',
    '- notes for note/task-like internal structured material.',
    '- memory when personal context, goals, or preferences matter.',
    '',
    `Requested response language: ${requestedLanguage || 'none'}`,
    `Latest user message: ${text}`,
    `Recent conversation context: ${conversationText || 'none'}`,
    `Candidate entities: ${candidateEntities.join(', ') || 'none'}`,
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: routerModel,
        temperature: 0,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: 'You are a strict multilingual routing engine. Output JSON only.',
              },
            ],
          },
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as {
      output_text?: string;
    };

    const textOutput = normalizeText(payload.output_text);
    if (!textOutput) return null;

    const jsonBlock = extractJsonBlock(textOutput);
    if (!jsonBlock) return null;

    try {
      const parsed = JSON.parse(jsonBlock) as unknown;
      return normalizeModelRoute(parsed);
    } catch {
      return null;
    }
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function routeIntentFallback(request: AgentRequest, text: string): AgentRouteResult {
  const requestedLanguage = defaultResponseLanguage(request);
  const detectedLanguage = detectLanguageFromScript(text);
  const intent = inferIntentFromText(text);
  const inferredEntities = inferEntitiesFromText(text);
  const seededTools = resolveDefaultToolsForIntent(intent);

  const necessityAware = applyNecessityAwareToolPolicy({
    text,
    intent,
    candidateTools: seededTools,
    metadata: request.metadata,
  });

  return {
    intent,
    confidence: inferFallbackConfidence(
      intent,
      detectedLanguage.languageConfidence,
      necessityAware.tools,
      necessityAware.shouldFetchMemory,
    ),
    reason: `Fallback routing was used because model routing was unavailable. ${necessityAware.necessityReason}`,
    requiresTools: necessityAware.tools,
    shouldFetchMemory: necessityAware.shouldFetchMemory,
    suggestedExecutionMode: inferExecutionMode(intent, text, necessityAware.tools),
    fallbackMessage:
      intent === 'unknown'
        ? AGENT_VNEXT_FALLBACK_MESSAGES.missingContext
        : undefined,
    inputLanguage:
      normalizeText((request as AgentRequest & { inputLanguage?: string }).inputLanguage) ||
      detectedLanguage.inputLanguage,
    responseLanguage: requestedLanguage || detectedLanguage.responseLanguage,
    languageConfidence: clamp01(
      (request as AgentRequest & { languageConfidence?: number }).languageConfidence,
      detectedLanguage.languageConfidence,
    ),
    multilingual: detectedLanguage.multilingual,
    userGoal: text || 'Help the user effectively.',
    entities: inferredEntities,
  };
}

export async function routeIntent(request: AgentRequest): Promise<AgentRouteResult> {
  const text = getRequestText(request);
  const detectedLanguage = detectLanguageFromScript(text);

  if (!text) {
    return {
      intent: 'unknown',
      confidence: 0.2,
      reason: 'Request did not contain usable text.',
      requiresTools: ['memory'],
      shouldFetchMemory: true,
      suggestedExecutionMode: 'sync',
      fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
      inputLanguage:
        normalizeText((request as AgentRequest & { inputLanguage?: string }).inputLanguage) ||
        detectedLanguage.inputLanguage,
      responseLanguage: defaultResponseLanguage(request) || detectedLanguage.responseLanguage,
      languageConfidence: clamp01(
        (request as AgentRequest & { languageConfidence?: number }).languageConfidence,
        detectedLanguage.languageConfidence,
      ),
      multilingual: false,
      userGoal: 'Clarify the user request.',
      entities: [],
    };
  }

  try {
    const routed = await routeIntentWithModel(request, text);

    if (!routed) {
      return routeIntentFallback(request, text);
    }

    const requestedResponseLanguage = normalizeText(defaultResponseLanguage(request));
    const resolvedInputLanguage =
      routed.inputLanguage === 'unknown' || !routed.inputLanguage
        ? detectedLanguage.inputLanguage
        : routed.inputLanguage;

    const resolvedResponseLanguage =
      requestedResponseLanguage ||
      normalizeText(routed.responseLanguage) ||
      (resolvedInputLanguage !== 'unknown'
        ? resolvedInputLanguage
        : detectedLanguage.responseLanguage);

    const resolvedLanguageConfidence =
      routed.inputLanguage === 'unknown'
        ? Math.max(routed.languageConfidence, detectedLanguage.languageConfidence)
        : routed.languageConfidence;

    const necessityAware = applyNecessityAwareToolPolicy({
      text,
      intent: routed.intent,
      candidateTools: routed.requiresTools,
      metadata: request.metadata,
    });

    return {
      intent: routed.intent,
      confidence: routed.confidence,
      reason: `${routed.reason} ${necessityAware.necessityReason}`.trim(),
      requiresTools: necessityAware.tools,
      shouldFetchMemory: routed.shouldFetchMemory || necessityAware.shouldFetchMemory,
      suggestedExecutionMode: routed.suggestedExecutionMode,
      fallbackMessage:
        routed.intent === 'unknown'
          ? AGENT_VNEXT_FALLBACK_MESSAGES.missingContext
          : undefined,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: clamp01(
        resolvedLanguageConfidence,
        detectedLanguage.languageConfidence,
      ),
      multilingual: routed.multilingual || detectedLanguage.multilingual,
      userGoal: routed.userGoal,
      entities: unique([...routed.entities, ...inferEntitiesFromText(text)]).slice(0, 8),
    };
  } catch {
    return routeIntentFallback(request, text);
  }
}
