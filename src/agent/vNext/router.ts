import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
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

function detectLanguageFromText(text: string): {
  inputLanguage: string;
  responseLanguage: string;
  languageConfidence: number;
} {
  const normalized = normalizeText(text).toLowerCase();
  if (!normalized) {
    return {
      inputLanguage: 'unknown',
      responseLanguage: 'en',
      languageConfidence: 0.2,
    };
  }

  const compact = normalized
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s?!.,]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const directMap: Record<string, 'fi' | 'sv' | 'es' | 'en'> = {
    'hei': 'fi',
    'moi': 'fi',
    'mita kuuluu': 'fi',
    'mita kuuluu?': 'fi',
    'mitä kuuluu': 'fi',
    'mitä kuuluu?': 'fi',
    'vad hander': 'sv',
    'vad hander?': 'sv',
    'vad händer': 'sv',
    'vad händer?': 'sv',
    'hola': 'es',
    'hola!': 'es',
    'hello': 'en',
    'hello!': 'en',
  };

  const direct = directMap[compact];
  if (direct) {
    return {
      inputLanguage: direct,
      responseLanguage: direct,
      languageConfidence: 0.98,
    };
  }

  if (/\b(että|mikä|mitä|kuuluu|suomi|minä|sinä|tämä|ole|kiitos)\b/.test(compact)) {
    return {
      inputLanguage: 'fi',
      responseLanguage: 'fi',
      languageConfidence: 0.86,
    };
  }

  if (/\b(vad|händer|hej|jag|du|och|är|detta)\b/.test(compact)) {
    return {
      inputLanguage: 'sv',
      responseLanguage: 'sv',
      languageConfidence: 0.86,
    };
  }

  if (/[\u00e1\u00e9\u00ed\u00f3\u00fa\u00f1\u00bf\u00a1]/.test(compact) || /\b(hola|gracias|que|cómo|puedo|ayudar|está)\b/.test(compact)) {
    return {
      inputLanguage: 'es',
      responseLanguage: 'es',
      languageConfidence: 0.84,
    };
  }

  if (/\b(hello|hi|what|how|can|help|please|thanks)\b/.test(compact)) {
    return {
      inputLanguage: 'en',
      responseLanguage: 'en',
      languageConfidence: 0.8,
    };
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
    value === 'execution' ||
    value === 'email' ||
    value === 'scheduling' ||
    value === 'tool_use' ||
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

  const suggestedExecutionMode =
    record.suggestedExecutionMode === 'stream' ? 'stream' : 'sync';

  const normalized: ModelRouteSchema = {
    inputLanguage: normalizeText(record.inputLanguage) || 'unknown',
    responseLanguage:
      normalizeText(record.responseLanguage) ||
      normalizeText(record.inputLanguage) ||
      'en',
    languageConfidence: clamp01(record.languageConfidence, 0.7),
    multilingual: Boolean(record.multilingual),
    intent: record.intent,
    confidence: clamp01(record.confidence, 0.72),
    userGoal: normalizeText(record.userGoal) || 'Help the user effectively.',
    entities: uniqueEntities(record.entities),
    requiresTools: uniqueTools(record.requiresTools),
    shouldFetchMemory:
      typeof record.shouldFetchMemory === 'boolean'
        ? record.shouldFetchMemory
        : record.intent !== 'general',
    suggestedExecutionMode,
    reason:
      normalizeText(record.reason) ||
      'Model-based routing selected the most likely intent.',
  };

  return normalized;
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
  const conversationText = getConversationText(request);
  const requestedLanguage = defaultResponseLanguage(request);

  const prompt = [
    'You are a routing model for a multilingual AI agent.',
    'Return JSON only.',
    'Do not explain your reasoning.',
    'Infer meaning semantically, not by keyword matching.',
    'Understand any language you can.',
    '',
    'Schema:',
    '{',
    '  "inputLanguage": "string",',
    '  "responseLanguage": "string",',
    '  "languageConfidence": 0.0,',
    '  "multilingual": false,',
    '  "intent": "general | finance | gmail | productivity | coding | memory | research | compare | planning | execution | email | scheduling | tool_use | shopping | unknown",',
    '  "confidence": 0.0,',
    '  "userGoal": "string",',
    '  "entities": ["string"],',
    '  "requiresTools": ["gmail" | "memory" | "calendar" | "web" | "compare" | "file" | "finance" | "notes"],',
    '  "shouldFetchMemory": true,',
    '  "suggestedExecutionMode": "sync" | "stream",',
    '  "reason": "short reason"',
    '}',
    '',
    'Rules:',
    '- The entire output must be valid JSON.',
    '- responseLanguage should follow explicit user language instruction when present.',
    '- If no explicit override exists, use the language of the latest user message.',
    '- Use tools only when genuinely helpful.',
    '- entities should contain concrete items, products, people, documents, or topics when present.',
    '- userGoal should describe what the user is actually trying to achieve.',
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

function routeIntentFallback(request: AgentRequest, text: string): AgentRouteResult {
  const requestedLanguage = defaultResponseLanguage(request);

  return {
    intent: 'general',
    confidence: 0.45,
    reason: 'Fallback routing was used because model routing was unavailable.',
    requiresTools: [],
    shouldFetchMemory: true,
    suggestedExecutionMode: 'sync',
    fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
    inputLanguage:
      normalizeText((request as AgentRequest & { inputLanguage?: string }).inputLanguage) ||
      'unknown',
    responseLanguage: requestedLanguage || 'en',
    languageConfidence: clamp01(
      (request as AgentRequest & { languageConfidence?: number }).languageConfidence,
      0.35,
    ),
    multilingual: false,
  };
}

export async function routeIntent(request: AgentRequest): Promise<AgentRouteResult> {
  const text = getRequestText(request);
  const detectedLanguage = detectLanguageFromText(text);

  if (!text) {
    return {
      intent: 'unknown',
      confidence: 0.2,
      reason: 'Request did not contain usable text.',
      requiresTools: [],
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
      (resolvedInputLanguage !== 'unknown' ? resolvedInputLanguage : detectedLanguage.responseLanguage);
    const resolvedLanguageConfidence =
      routed.inputLanguage === 'unknown'
        ? Math.max(routed.languageConfidence, detectedLanguage.languageConfidence)
        : routed.languageConfidence;

    return {
      intent: routed.intent,
      confidence: routed.confidence,
      reason: routed.reason,
      requiresTools: routed.requiresTools,
      shouldFetchMemory: routed.shouldFetchMemory,
      suggestedExecutionMode: routed.suggestedExecutionMode,
      fallbackMessage:
        routed.intent === 'unknown'
          ? AGENT_VNEXT_FALLBACK_MESSAGES.missingContext
          : undefined,
      inputLanguage: resolvedInputLanguage,
      responseLanguage: resolvedResponseLanguage,
      languageConfidence: clamp01(resolvedLanguageConfidence, detectedLanguage.languageConfidence),
      multilingual: routed.multilingual,
      userGoal: routed.userGoal,
      entities: routed.entities,
    };
  } catch {
    return routeIntentFallback(request, text);
  }
}
