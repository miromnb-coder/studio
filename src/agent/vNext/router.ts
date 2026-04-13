import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import type { AgentIntent, AgentRequest, AgentRouteResult, AgentToolName } from './types';

type LanguageDetectionResult = {
  inputLanguage: string;
  responseLanguage: string;
  confidence: number;
  multilingual: boolean;
};

type SemanticSignal = {
  intent: AgentIntent;
  score: number;
};

const LANGUAGE_OVERRIDES: Array<{ pattern: RegExp; language: string }> = [
  { pattern: /\b(answer|respond|reply)\s+in\s+(english|en)\b/i, language: 'en' },
  { pattern: /\b(vastaa|vastaa minulle)\s+(englanniksi|englanniksi.)/i, language: 'en' },
  { pattern: /\b(answer|respond|reply)\s+in\s+(finnish|fi)\b/i, language: 'fi' },
  { pattern: /\b(responde|contesta)\s+en\s+(español|es)\b/i, language: 'es' },
  { pattern: /\b(antworte|antworten)\s+auf\s+deutsch\b/i, language: 'de' },
  { pattern: /\b(svara|svara gärna)\s+på\s+svenska\b/i, language: 'sv' },
];

const INTENT_EMBEDDINGS: Array<{ intent: AgentIntent; seedTerms: string[]; tools: AgentToolName[] }> = [
  { intent: 'compare', seedTerms: ['compare', 'versus', 'difference', 'which is better', 'vertaa', 'compara'], tools: ['compare', 'web', 'memory'] },
  { intent: 'finance', seedTerms: ['budget', 'save money', 'finance', 'spending', 'invest', 'rahaa', 'dinero'], tools: ['finance', 'memory', 'notes'] },
  { intent: 'planning', seedTerms: ['plan', 'roadmap', 'timeline', 'strategy', 'suunnitelma', 'planifica'], tools: ['calendar', 'notes', 'memory'] },
  { intent: 'productivity', seedTerms: ['organize', 'prioritize', 'focus', 'workflow', 'productive'], tools: ['notes', 'calendar', 'memory'] },
  { intent: 'gmail', seedTerms: ['gmail', 'inbox', 'email', 'mailbox', 'subscription', 'receipt'], tools: ['gmail', 'memory'] },
  { intent: 'coding', seedTerms: ['code', 'refactor', 'debug', 'typescript', 'api', 'algorithm'], tools: ['file', 'memory', 'web'] },
  { intent: 'memory', seedTerms: ['remember', 'muista', 'record this', 'what did i say', 'previous context'], tools: ['memory', 'notes'] },
  { intent: 'research', seedTerms: ['research', 'latest', 'sources', 'news', 'analyze', 'investigate'], tools: ['web', 'memory'] },
  { intent: 'shopping', seedTerms: ['buy', 'purchase', 'best price', 'product recommendation', 'shop'], tools: ['compare', 'web', 'finance', 'memory'] },
  { intent: 'general', seedTerms: ['hello', 'thanks', 'help', 'question'], tools: [] },
];

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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zåäöáéíóúñüß0-9]+/i)
    .filter(Boolean);
}

function detectLanguage(text: string, request: AgentRequest): LanguageDetectionResult {
  const lowered = text.toLowerCase();
  const requested = normalizeText(request.responseLanguage || request.inputLanguage).toLowerCase();

  const hasNordic = /[åäö]/i.test(text);
  const hasSpanishChars = /[ñáéíóúü¿¡]/i.test(text);
  const hasGermanChars = /[ß]/i.test(text);

  const scoreMap: Record<string, number> = {
    en: 0.2,
    fi: hasNordic ? 0.45 : 0.1,
    sv: hasNordic ? 0.35 : 0.08,
    de: hasGermanChars ? 0.45 : 0.1,
    es: hasSpanishChars ? 0.45 : 0.1,
  };

  const weightedTerms: Record<string, string[]> = {
    en: ['the', 'and', 'compare', 'answer', 'please', 'how', 'what'],
    fi: ['ja', 'että', 'minulle', 'vertaa', 'muista', 'suunnitelma'],
    sv: ['och', 'jag', 'jämför', 'planera', 'svenska'],
    de: ['und', 'ich', 'vergleiche', 'planung', 'deutsch'],
    es: ['y', 'para', 'compara', 'responde', 'español'],
  };

  for (const [lang, terms] of Object.entries(weightedTerms)) {
    const hits = terms.reduce((count, term) => count + (lowered.includes(term) ? 1 : 0), 0);
    scoreMap[lang] += hits * 0.1;
  }

  for (const rule of LANGUAGE_OVERRIDES) {
    if (rule.pattern.test(text)) {
      return {
        inputLanguage: request.inputLanguage || 'auto',
        responseLanguage: rule.language,
        confidence: 0.98,
        multilingual: true,
      };
    }
  }

  const sorted = Object.entries(scoreMap).sort((a, b) => b[1] - a[1]);
  const [bestLang, bestScore] = sorted[0] ?? ['en', 0.4];
  const second = sorted[1]?.[1] ?? 0;
  const multilingual = Math.abs(bestScore - second) < 0.18;
  const confidence = Math.max(0.4, Math.min(0.98, Number((bestScore - second + 0.55).toFixed(2))));
  const responseLanguage = requested || bestLang;

  return {
    inputLanguage: bestLang,
    responseLanguage,
    confidence,
    multilingual,
  };
}

function scoreSemanticIntents(text: string): SemanticSignal[] {
  const lowered = text.toLowerCase();
  const tokens = new Set(tokenize(text));

  return INTENT_EMBEDDINGS.map((embedding) => {
    const score = embedding.seedTerms.reduce((total, term) => {
      const normalizedTerm = term.toLowerCase();
      if (normalizedTerm.includes(' ') && lowered.includes(normalizedTerm)) return total + 2.2;
      if (tokens.has(normalizedTerm)) return total + 1.7;
      if ([...tokens].some((token) => token.startsWith(normalizedTerm.slice(0, 4)))) return total + 0.7;
      return total;
    }, 0);

    const structuralBoost =
      embedding.intent === 'compare' && /(vs|versus|contra|gegen|jämför|vertaa)/i.test(text)
        ? 1.5
        : 0;

    return {
      intent: embedding.intent,
      score: score + structuralBoost,
    };
  }).sort((a, b) => b.score - a.score);
}

function toolsForIntent(intent: AgentIntent): AgentToolName[] {
  return INTENT_EMBEDDINGS.find((item) => item.intent === intent)?.tools ?? ['memory'];
}

export { detectLanguage };

export function routeIntent(request: AgentRequest): AgentRouteResult {
  const text = getRequestText(request);

  if (!text) {
    return {
      intent: 'unknown',
      confidence: 0.2,
      reason: 'Request did not contain usable text.',
      requiresTools: [],
      shouldFetchMemory: true,
      suggestedExecutionMode: 'sync',
      fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
      inputLanguage: request.inputLanguage,
      responseLanguage: request.responseLanguage,
      languageConfidence: request.languageConfidence,
      multilingual: false,
    };
  }

  const language = detectLanguage(text, request);
  const semantic = scoreSemanticIntents(text);
  const top = semantic[0];

  if (!top || top.score < 0.8) {
    return {
      intent: 'unknown',
      confidence: 0.44,
      reason: 'No stable semantic intent signal was found.',
      requiresTools: ['memory'],
      shouldFetchMemory: true,
      suggestedExecutionMode: 'sync',
      fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
      inputLanguage: language.inputLanguage,
      responseLanguage: language.responseLanguage,
      languageConfidence: language.confidence,
      multilingual: language.multilingual,
    };
  }

  return {
    intent: top.intent,
    confidence: Math.max(0.52, Math.min(0.96, Number((0.5 + top.score / 10).toFixed(2)))),
    reason: `Semantic routing selected "${top.intent}" from intent-embedding similarity.`,
    requiresTools: toolsForIntent(top.intent),
    shouldFetchMemory: !['general'].includes(top.intent),
    suggestedExecutionMode: ['research', 'coding'].includes(top.intent) ? 'stream' : 'sync',
    inputLanguage: language.inputLanguage,
    responseLanguage: language.responseLanguage,
    languageConfidence: language.confidence,
    multilingual: language.multilingual,
  };
}
