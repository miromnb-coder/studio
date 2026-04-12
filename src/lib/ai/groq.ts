import type { AIProviderClient, ChatGenerationRequest, ChatStreamEvent } from './types';
import { resolveAIModel } from './config';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

function parseJsonLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractDelta(payload: Record<string, unknown>): string {
  const choices = payload.choices;
  if (!Array.isArray(choices)) return '';

  const first = choices[0];
  if (!first || typeof first !== 'object') return '';

  const delta = (first as { delta?: unknown }).delta;
  if (!delta || typeof delta !== 'object') return '';

  const content = (delta as { content?: unknown }).content;
  return typeof content === 'string' ? content : '';
}

async function consumeSse(response: Response, onEvent: (event: ChatStreamEvent) => void) {
  if (!response.body) {
    throw new Error('Groq response stream missing.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      const payload = parseJsonLine(data);
      if (!payload) continue;
      const delta = extractDelta(payload);
      if (delta) {
        onEvent({ type: 'text-delta', delta });
      }
    }
  }
}

export const groqProvider: AIProviderClient = {
  name: 'groq',
  async streamChat(request: ChatGenerationRequest, onEvent: (event: ChatStreamEvent) => void) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GROQ_API_KEY environment variable.');
    }

    const model = resolveAIModel(request.model);

    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        temperature: 0.4,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          ...request.messages,
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Groq error (${response.status}): ${details || 'unknown error'}`);
    }

    onEvent({ type: 'meta', provider: 'groq', model });
    await consumeSse(response, onEvent);
  },
};
