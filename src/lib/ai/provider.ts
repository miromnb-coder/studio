import { groqProvider } from './groq';
import { openAIProvider } from './openai';
import type { AIProviderClient } from './types';

const providers = {
  openai: openAIProvider,
  groq: groqProvider,
} as const;

type ProviderName = keyof typeof providers;

export function getAIProvider(): AIProviderClient {
  const selected = (process.env.AI_PROVIDER ?? 'groq').toLowerCase();

  if (selected in providers) {
    return providers[selected as ProviderName];
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${selected}". Supported providers: ${Object.keys(providers).join(', ')}.`,
  );
}
