import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import { resolveRequiredTools, resolveDefaultToolsForIntent } from '@/agent/integrations/integration-router';
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

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
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
} {
  const normalized = normalizeText(text);
  if (!normalized) {
    return {
      inputLanguage: 'unknown',
      responseLanguage: 'en',
      languageConfidence: 0.2,
    };
  }

  if (/[\u4E00-\u9FFF\u3040-\u30FF]/u.test(normalized)) {
    return { inputLanguage: 'ja', responseLanguage: 'ja', languageConfidence: 0.72 };
  }

  if (/[\u0400-\u04FF]/u.test(normalized)) {
    return { inputLanguage: 'ru', responseLanguage: 'ru', languageConfidence: 0.7 };
  }

  if (/[\u0600-\u06FF]/u.test(normalized)) {
    return { inputLanguage: 'ar', responseLanguage: 'ar', languageConfidence: 0.7 };
  }

  if (/[\uAC00-\uD7AF]/u.test(normalized)) {
    return { inputLanguage: 'ko', responseLanguage: 'ko', languageConfidence: 0.72 };
  }

  if (/[\u0E00-\u0E7F]/u.test(normalized)) {
    return { inputLanguage: 'th', responseLanguage: 'th', languageConfidence: 0.72 };
  }

  return {
    inputLanguage: 'unknown',
    responseLanguage: 'en',
    languageConfidence: 0.35,
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
  return [...new Set(values.filter(isToolName))];
}

function uniqueEntities(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .filter((item): item is string => typeof item === 'string')
        .map((item) => normalizeText(item))
        .filter(Boolean),
    ),
  ].slice(0, 8);
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

async function routeIntentWithModel(
  request: AgentRequest,
  text: string,
): Promise<ModelRouteSchema | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const conversationText = getConversationText(request);
  const requestedLanguage = defaultResponseLanguage(request);

  const prompt = [
    'You are a multilingual routing model for an AI agent.',
    'Return JSON only.',
    'Infer the user intent from meaning, not from keyword lists.',
    'The user may write in any language.',
    'Do not explain reasoning outside JSON.',
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
    'Tool rules:',
    '- Use gmail for inbox/email-related work.',
    '- Use calendar for schedule/availability/time planning.',
    '- Use web for current/live/external information.',
    '- Use compare for structured side-by-side choices.',
    '- Use finance for money/subscription/cost analysis.',
    '- Use file for uploaded/referenced file/document inspection.',
    '- Use notes for note/task-like structured internal material.',
    '- Use memory when personal context helps.',
    '',
    `Requested response language: ${requestedLanguage || 'none'}`,
    `Latest user message: ${text}`,
    `Recent conversation context: ${conversationText || 'none'}`,
  ].join('\n');

  const metadata = (request.metadata ?? {}) as Record<string, unknown>;
  const routerModel = normalizeText(metadata.routerModel) || 'gpt-4.1-mini';

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
}

function heuristicFallbackIntent(text: string): AgentIntent {
  const trimmed = normalizeText(text);
  if (!trimmed) return 'unknown';

  const lowered = trimmed.toLowerCase();

  if (lowered.includes(' vs ') || lowered.includes(' versus ')) return 'compare';
  if (/[$€£¥₹]/u.test(trimmed)) return 'shopping';
  if (trimmed.includes('http://') || trimmed.includes('https://')) return 'research';
  if (trimmed.includes('.pdf') || trimmed.includes('.doc') || trimmed.includes('.csv')) {
    return 'coding';
  }

  return 'general';
}

function routeIntentFallback(request: AgentRequest, text: string): AgentRouteResult {
  const requestedLanguage = defaultResponseLanguage(request);
  const detectedLanguage = detectLanguageFromScript(text);
  const intent = heuristicFallbackIntent(text);
  const seededTools = resolveDefaultToolsForIntent(intent);

  return {
    intent,
    confidence: intent === 'general' ? 0.42 : 0.56,
    reason: 'Fallback routing was used because model routing was unavailable.',
    requiresTools: resolveRequiredTools(text, seededTools, {
      routeIntent: intent,
      metadata: request.metadata,
    }),
    shouldFetchMemory: intent !== 'general',
    suggestedExecutionMode: 'sync',
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
    multilingual: detectedLanguage.inputLanguage !== 'unknown',
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
    };
  }

  try {
    const routed = await routeIntentWithModel(request, text);

    if (!routed) {
      return routeIntentFallback(request, text);
    }

    const resolvedInputLanguage =
      routed.inputLanguage === 'unknown' || !routed.inputLanguage
        ? detectedLanguage.inputLanguage
        : routed.inputLanguage;

    const resolvedResponseLanguage =
      normalizeText(defaultResponseLanguage(request)) ||
      normalizeText(routed.responseLanguage) ||
      (resolvedInputLanguage !== 'unknown'
        ? resolvedInputLanguage
        : detectedLanguage.responseLanguage);

    const resolvedLanguageConfidence =
      routed.inputLanguage === 'unknown'
        ? Math.max(routed.languageConfidence, detectedLanguage.languageConfidence)
        : routed.languageConfidence;

    return {
      intent: routed.intent,
      confidence: routed.confidence,
      reason: routed.reason,
      requiresTools: resolveRequiredTools(text, routed.requiresTools, {
        routeIntent: routed.intent,
        currentTools: routed.requiresTools,
        metadata: request.metadata,
      }),
      shouldFetchMemory: routed.shouldFetchMemory,
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
      multilingual: routed.multilingual,
      userGoal: routed.userGoal,
      entities: unique(routed.entities),
    };
  } catch {
    return routeIntentFallback(request, text);
  }
}
