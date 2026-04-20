import { resolveResponseLanguage } from './resolve-response-language';
import { resolveResponseStyle } from './resolve-response-style';
import { resolveResponseVisibility } from './resolve-response-visibility';
import type {
  ResolveResponsePolicyInput,
  ResponseLength,
  ResponsePolicy,
} from './types';

function resolveLength(input: ResolveResponsePolicyInput): ResponseLength {
  const text = input.userMessage.toLowerCase();

  if (/\b(deep|detailed|long|perusteellisesti|tarkasti)\b/.test(text)) {
    return 'deep';
  }

  if (/\b(short|brief|quick|lyhyesti|tiiviisti)\b/.test(text)) {
    return 'short';
  }

  switch (input.intent) {
    case 'search':
    case 'shopping':
      return 'short';
    case 'compare':
    case 'operator':
      return 'medium';
    default:
      return 'medium';
  }
}

function resolvePriority(input: ResolveResponsePolicyInput): ResponsePolicy['priority'] {
  switch (input.intent) {
    case 'search':
      return 'top_result_first';
    case 'shopping':
      return 'top_pick_first';
    case 'compare':
      return 'decision_first';
    case 'operator':
      return 'action_first';
    default:
      return 'summary_first';
  }
}

export function resolveResponsePolicy(
  input: ResolveResponsePolicyInput,
): ResponsePolicy {
  const language = resolveResponseLanguage({
    explicitLanguage: input.explicitLanguage,
    detectedLanguage: input.detectedLanguage,
    userMessage: input.userMessage,
  });

  const style = resolveResponseStyle({
    intent: input.intent,
    responseMode: input.responseMode,
    userMessage: input.userMessage,
    confidence: input.confidence,
  });

  return {
    language,
    style,
    length: resolveLength(input),
    priority: resolvePriority(input),
    visibility: resolveResponseVisibility(input.intent),
    suppressRawToolText: true,
    suppressDebugText: true,
    preferStructuredView: Boolean(input.hasStructuredResults),
  };
}
