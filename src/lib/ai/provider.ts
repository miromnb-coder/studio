import { groqProvider } from './groq';
import { openAIProvider } from './openai';
import type { AIProviderClient } from './types';
import { AI_CONFIG } from './config';

const providers = {
  openai: openAIProvider,
  groq: groqProvider,
} as const;

type ProviderName = keyof typeof providers;

export function getAIProvider(): AIProviderClient {
  const selected = AI_CONFIG.provider;

  if (selected in providers) {
    return providers[selected as ProviderName];
  }

  throw new Error(
    `Unsupported AI_PROVIDER "${selected}". Supported providers: ${Object.keys(providers).join(', ')}.`,
  );
}
