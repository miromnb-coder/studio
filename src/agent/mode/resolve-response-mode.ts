import type { ResponseMode } from '@/agent/types/response-mode';

type ResolveResponseModeInput = {
  input: string;
  history?: Array<{ role?: string; content?: string }>;
  routeIntent?: string;
  requiresTools?: string[];
  hasAttachments?: boolean;
  requestedActionType?: string | null;
  hadError?: boolean;
  lowConfidence?: boolean;
};

const CASUAL_PATTERNS = [
  /^(hi|hello|hey|yo|sup|thanks|thank you|thx|ok|okay|cool|nice|great|good morning|good evening)[!.\s]*$/i,
  /^(hei|moi|moikka|kiitos|mitä kuuluu|mita kuuluu|hyvää huomenta|hyvaa huomenta)[!.\s]*$/i,
  /^(hej|tack|hur mår du|hur mar du)[!.\s]*$/i,
  /^(hola|gracias|qué tal|que tal|como estas)[!.\s]*$/i,
];

const TOOL_SIGNALS =
  /\b(muisti|memory|calendar|gmail|email|inbox|search web|web|lookup|tarkista muististani|check my memory|integration|attachment|file|finance data|price today|kurssi|stock|crypto)\b/i;

const OPERATOR_SIGNALS =
  /\b(plan|suunnitelma|priori|priority|decide|decision|organize|järjestä|jarjesta|aikataulu|schedule|budget|talous|raha|säästä|saasta|money|subscription|tilaus|risk|opportunity|next step|mitä minun pitäisi|mita minun pitaisi|weekly|ensi viikolle|goal|target)\b/i;

const FAST_SIGNALS =
  /\b(what|why|how|when|where|who|paljonko|miten|miksi|milloin|mikä|mika|anna|give|list|quick|lyhyesti|briefly)\b/i;

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function isCasualPrompt(input: string): boolean {
  const normalized = normalizeText(input);
  if (!normalized) return false;
  if (normalized.split(' ').length > 6) return false;
  return CASUAL_PATTERNS.some((pattern) => pattern.test(normalized));
}

function inferToolNeed(params: ResolveResponseModeInput): boolean {
  if (params.requestedActionType) return true;
  if (params.hasAttachments) return true;
  if (Array.isArray(params.requiresTools) && params.requiresTools.length > 0) {
    return true;
  }

  return TOOL_SIGNALS.test(params.input);
}

function inferOperatorNeed(params: ResolveResponseModeInput): boolean {
  if (params.routeIntent === 'planning' || params.routeIntent === 'finance') {
    return true;
  }

  return OPERATOR_SIGNALS.test(params.input);
}

export function resolveResponseMode(
  params: ResolveResponseModeInput,
): ResponseMode {
  const input = normalizeText(params.input);

  if (params.hadError || params.lowConfidence) {
    return 'fallback';
  }

  if (!input) {
    return 'fallback';
  }

  if (isCasualPrompt(input)) {
    return 'casual';
  }

  if (inferToolNeed({ ...params, input })) {
    return 'tool';
  }

  if (inferOperatorNeed({ ...params, input })) {
    return 'operator';
  }

  const shortPrompt = input.length <= 120;
  if (shortPrompt || FAST_SIGNALS.test(input)) {
    return 'fast';
  }

  return 'operator';
}
