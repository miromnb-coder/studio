import { groqProvider } from './groq';
import { openAIProvider } from './openai';
import type { AIProviderClient } from './types';

const providers: Record<string, AIProviderClient> = {
  openai: openAIProvider,
  groq: groqProvider,
};

export function getAIProvider(): AIProviderClient {
  const selected = (process.env.AI_PROVIDER ?? 'openai').toLowerCase();
  return providers[selected] ?? openAIProvider;
}
