import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import type {
  AgentRequest,
  AgentRouteResult,
  AgentToolName,
} from './types';

type AgentIntent = AgentRouteResult['intent'];

type KeywordRule = {
  intent: AgentIntent;
  keywords: string[];
  tools?: AgentToolName[];
  confidence?: number;
  mode?: AgentRouteResult['suggestedExecutionMode'];
  shouldFetchMemory?: boolean;
};

const KEYWORD_RULES: KeywordRule[] = [
  {
    intent: 'email',
    keywords: [
      'email',
      'gmail',
      'inbox',
      'reply',
      'send',
      'message',
      'mail',
      'receipt',
      'subscription',
      'unsubscribe',
    ],
    tools: ['gmail', 'memory'],
    confidence: 0.84,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'scheduling',
    keywords: [
      'calendar',
      'schedule',
      'meeting',
      'availability',
      'free time',
      'reschedule',
      'event',
      'tomorrow',
    ],
    tools: ['calendar', 'memory'],
    confidence: 0.84,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'memory_lookup',
    keywords: [
      'remember',
      'memory',
      'last time',
      'history',
      'what did i say',
      'what did we do',
      'saved thread',
      'pinned',
    ],
    tools: ['memory', 'notes'],
    confidence: 0.86,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'compare',
    keywords: [
      'compare',
      'versus',
      'vs',
      'difference',
      'better than',
      'pros and cons',
      'which is better',
    ],
    tools: ['compare', 'web', 'memory'],
    confidence: 0.87,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'research',
    keywords: [
      'research',
      'latest',
      'look up',
      'find sources',
      'search the web',
      'news',
      'current info',
      'find information',
    ],
    tools: ['web', 'memory'],
    confidence: 0.88,
    mode: 'stream',
    shouldFetchMemory: true,
  },
  {
    intent: 'planning',
    keywords: [
      'plan',
      'roadmap',
      'steps',
      'strategy',
      'what should i do',
      'next steps',
      'organize',
      'weekly plan',
    ],
    tools: ['calendar', 'notes', 'memory'],
    confidence: 0.82,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'execution',
    keywords: [
      'do this',
      'execute',
      'run this',
      'perform',
      'take care of',
      'handle this',
      'complete this',
      'start this',
    ],
    tools: ['notes', 'memory', 'calendar'],
    confidence: 0.83,
    mode: 'stream',
    shouldFetchMemory: true,
  },
  {
    intent: 'tool_use',
    keywords: [
      'tool',
      'integrate',
      'connect',
      'connector',
      'upload file',
      'analyze file',
      'finance scan',
      'use the tool',
    ],
    tools: ['file', 'finance', 'memory'],
    confidence: 0.8,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'question',
    keywords: [
      'what',
      'why',
      'how',
      'when',
      'where',
      'who',
      'can you explain',
      'tell me',
    ],
    tools: ['memory'],
    confidence: 0.72,
    mode: 'sync',
    shouldFetchMemory: true,
  },
  {
    intent: 'chat',
    keywords: [
      'hey',
      'hello',
      'hi',
      'help me',
      'thanks',
      'thank you',
      'good morning',
    ],
    tools: [],
    confidence: 0.66,
    mode: 'sync',
    shouldFetchMemory: false,
  },
];

const STRONG_RESEARCH_PATTERNS = [
  'latest',
  'current',
  'today',
  'right now',
  'recent',
  'news',
];

const DIRECT_ACTION_PATTERNS = [
  'please do',
  'can you do',
  'i want you to',
  'make a',
  'create a',
  'set up',
  'draft a',
];

const MEMORY_PATTERNS = [
  'last time',
  'previously',
  'earlier',
  'before',
  'remember when',
  'saved',
  'pinned',
];

const COMPARISON_PATTERNS = [
  'vs',
  'versus',
  'compare',
  'difference between',
  'better than',
];

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
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

function countKeywordMatches(text: string, keywords: string[]): number {
  return keywords.reduce(
    (count, keyword) => count + (text.includes(keyword.toLowerCase()) ? 1 : 0),
    0,
  );
}

function uniqueTools(tools: AgentToolName[]): AgentToolName[] {
  return [...new Set(tools)];
}

function buildFallbackResult(reason: string): AgentRouteResult {
  return {
    intent: 'fallback',
    confidence: 0.3,
    reason,
    requiresTools: [],
    shouldFetchMemory: true,
    suggestedExecutionMode: 'sync',
    fallbackMessage: AGENT_VNEXT_FALLBACK_MESSAGES.missingContext,
  };
}

function detectIntentHints(text: string): {
  researchBoost: boolean;
  actionBoost: boolean;
  memoryBoost: boolean;
  compareBoost: boolean;
  longRequest: boolean;
} {
  return {
    researchBoost: STRONG_RESEARCH_PATTERNS.some((pattern) =>
      text.includes(pattern),
    ),
    actionBoost: DIRECT_ACTION_PATTERNS.some((pattern) =>
      text.includes(pattern),
    ),
    memoryBoost: MEMORY_PATTERNS.some((pattern) => text.includes(pattern)),
    compareBoost: COMPARISON_PATTERNS.some((pattern) => text.includes(pattern)),
    longRequest: text.split(/\s+/).filter(Boolean).length > 18,
  };
}

function scoreRule(text: string, rule: KeywordRule): {
  rule: KeywordRule;
  score: number;
  matchCount: number;
} {
  const matchCount = countKeywordMatches(text, rule.keywords);
  if (matchCount === 0) {
    return { rule, score: 0, matchCount: 0 };
  }

  const hints = detectIntentHints(text);
  let score = matchCount * 1.2;

  if (rule.intent === 'research' && hints.researchBoost) score += 1.2;
  if (rule.intent === 'execution' && hints.actionBoost) score += 1.0;
  if (rule.intent === 'memory_lookup' && hints.memoryBoost) score += 1.0;
  if (rule.intent === 'compare' && hints.compareBoost) score += 1.1;
  if (
    (rule.intent === 'planning' || rule.intent === 'research') &&
    hints.longRequest
  ) {
    score += 0.5;
  }

  return { rule, score, matchCount };
}

function chooseBestRule(text: string): KeywordRule | null {
  const scored = KEYWORD_RULES.map((rule) => scoreRule(text, rule))
    .filter((entry) => entry.matchCount > 0)
    .sort((a, b) => b.score - a.score);

  if (!scored.length) return null;

  const best = scored[0];
  return best.rule;
}

function inferToolsFromText(text: string, baseTools: AgentToolName[]): AgentToolName[] {
  const inferred = [...baseTools];

  if (
    text.includes('email') ||
    text.includes('gmail') ||
    text.includes('inbox') ||
    text.includes('receipt') ||
    text.includes('subscription')
  ) {
    inferred.push('gmail');
  }

  if (
    text.includes('calendar') ||
    text.includes('meeting') ||
    text.includes('schedule') ||
    text.includes('availability')
  ) {
    inferred.push('calendar');
  }

  if (
    text.includes('compare') ||
    text.includes('versus') ||
    text.includes('vs')
  ) {
    inferred.push('compare');
  }

  if (
    text.includes('search') ||
    text.includes('latest') ||
    text.includes('news') ||
    text.includes('research')
  ) {
    inferred.push('web');
  }

  if (
    text.includes('memory') ||
    text.includes('remember') ||
    text.includes('history') ||
    text.includes('saved')
  ) {
    inferred.push('memory');
  }

  if (
    text.includes('file') ||
    text.includes('pdf') ||
    text.includes('document') ||
    text.includes('image')
  ) {
    inferred.push('file');
  }

  if (
    text.includes('money') ||
    text.includes('finance') ||
    text.includes('spending') ||
    text.includes('budget')
  ) {
    inferred.push('finance');
  }

  if (
    text.includes('note') ||
    text.includes('notes') ||
    text.includes('write this down')
  ) {
    inferred.push('notes');
  }

  return uniqueTools(inferred);
}

function inferIntentFromStructure(text: string): AgentIntent {
  if (!text) return 'fallback';

  if (COMPARISON_PATTERNS.some((pattern) => text.includes(pattern))) {
    return 'compare';
  }

  if (MEMORY_PATTERNS.some((pattern) => text.includes(pattern))) {
    return 'memory_lookup';
  }

  if (STRONG_RESEARCH_PATTERNS.some((pattern) => text.includes(pattern))) {
    return 'research';
  }

  if (DIRECT_ACTION_PATTERNS.some((pattern) => text.includes(pattern))) {
    return 'execution';
  }

  if (
    text.startsWith('what ') ||
    text.startsWith('why ') ||
    text.startsWith('how ') ||
    text.startsWith('when ') ||
    text.startsWith('where ') ||
    text.startsWith('who ')
  ) {
    return 'question';
  }

  return 'chat';
}

export function routeIntent(request: AgentRequest): AgentRouteResult {
  const text = getRequestText(request);

  if (!text) {
    return buildFallbackResult('Request did not contain usable text.');
  }

  const matchedRule = chooseBestRule(text);

  if (!matchedRule) {
    const inferredIntent = inferIntentFromStructure(text);
    const inferredTools = inferToolsFromText(text, inferredIntent === 'chat' ? [] : ['memory']);

    return {
      intent: inferredIntent,
      confidence: inferredIntent === 'chat' ? 0.48 : 0.55,
      reason: `No direct keyword rule matched. Inferred intent from request structure: ${inferredIntent}.`,
      requiresTools: uniqueTools(inferredTools),
      shouldFetchMemory: inferredIntent !== 'chat',
      suggestedExecutionMode:
        inferredIntent === 'research' || inferredIntent === 'execution'
          ? 'stream'
          : 'sync',
      fallbackMessage:
        inferredIntent === 'fallback'
          ? AGENT_VNEXT_FALLBACK_MESSAGES.missingContext
          : undefined,
    };
  }

  const requiresTools = inferToolsFromText(text, matchedRule.tools ?? []);
  const shouldFetchMemory =
    matchedRule.shouldFetchMemory ?? !['chat', 'fallback'].includes(matchedRule.intent);

  let confidence = matchedRule.confidence ?? 0.75;

  const extraMatches = countKeywordMatches(text, matchedRule.keywords);
  if (extraMatches >= 2) confidence += 0.04;
  if (extraMatches >= 3) confidence += 0.04;
  confidence = Math.min(0.96, confidence);

  return {
    intent: matchedRule.intent,
    confidence,
    reason: `Matched routing rule for intent "${matchedRule.intent}" using lexical and structural signals.`,
    requiresTools,
    shouldFetchMemory,
    suggestedExecutionMode:
      matchedRule.mode ??
      (matchedRule.intent === 'research' || matchedRule.intent === 'execution'
        ? 'stream'
        : 'sync'),
  };
}
