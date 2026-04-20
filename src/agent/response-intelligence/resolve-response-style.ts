import type { ResponseIntent, ResponseStyle } from './types';

export function resolveResponseStyle(params: {
  intent: ResponseIntent;
  responseMode?: string | null;
  userMessage: string;
  confidence?: number | null;
}): ResponseStyle {
  const { intent, responseMode, userMessage } = params;
  const text = userMessage.toLowerCase();

  if (responseMode === 'casual') return 'casual';
  if (intent === 'search') return 'source_first';
  if (intent === 'shopping') return 'recommendation_first';
  if (intent === 'compare') return 'comparison_first';
  if (intent === 'operator') return 'operator';

  if (/\b(short|brief|quick|lyhyesti|tiiviisti)\b/.test(text)) {
    return 'concise';
  }

  return 'concise';
}
