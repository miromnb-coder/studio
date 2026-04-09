import type { ChatMessage } from '@/lib/ai/types';
import type { AIProviderClient } from '@/lib/ai/types';
import type { StoredMemory } from './types';

async function completeText(provider: AIProviderClient, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  let content = '';
  await provider.streamChat(
    { messages, systemPrompt },
    (event) => {
      if (event.type === 'text-delta') content += event.delta;
    },
  );
  return content.trim();
}

export async function runResearchAgent(provider: AIProviderClient, userInput: string, conversation: ChatMessage[]): Promise<string> {
  return completeText(
    provider,
    'You are Research Agent. Gather accurate, broad, practical knowledge. Use concise bullets. Separate facts from assumptions.',
    [...conversation.slice(-6), { role: 'user', content: userInput }],
  );
}

export async function runAnalysisAgent(
  provider: AIProviderClient,
  userInput: string,
  research: string,
  memory: StoredMemory[],
): Promise<string> {
  const memoryText = memory.map((item) => `- [${item.source}] ${item.value}`).join('\n') || 'No relevant memory';

  return completeText(
    provider,
    'You are Analysis Agent. Perform structured reasoning, tradeoff analysis, and decision framing. Be explicit and numerate when possible.',
    [
      { role: 'user', content: `User request:\n${userInput}` },
      { role: 'system', content: `Research notes:\n${research || 'N/A'}` },
      { role: 'system', content: `Relevant memory:\n${memoryText}` },
    ],
  );
}

export async function runResponseAgent(
  provider: AIProviderClient,
  userInput: string,
  options: {
    research?: string;
    analysis?: string;
    memory?: StoredMemory[];
    complexity: 'low' | 'medium' | 'high';
  },
): Promise<string> {
  const style =
    options.complexity === 'low'
      ? 'Give a direct short answer first, then one concise supporting note.'
      : options.complexity === 'medium'
      ? 'Use clear sections and bullets. Keep practical.'
      : 'Provide structured response with summary, detailed reasoning, risks, and recommended next steps.';

  const memoryText = (options.memory ?? []).map((item) => `- ${item.value}`).join('\n') || 'No relevant memory';

  return completeText(
    provider,
    `You are Response Agent. Produce the final user-facing response. ${style} Admit uncertainty where needed and avoid hallucinations.`,
    [
      { role: 'user', content: userInput },
      { role: 'system', content: `Research output:\n${options.research || 'Not run'}` },
      { role: 'system', content: `Analysis output:\n${options.analysis || 'Not run'}` },
      { role: 'system', content: `Relevant memory:\n${memoryText}` },
    ],
  );
}
