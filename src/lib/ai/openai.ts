import type { AIProviderClient, ChatGenerationRequest, ChatStreamEvent } from './types';

const OPENAI_URL = 'https://api.openai.com/v1/responses';

function toOpenAIInput(messages: ChatGenerationRequest['messages']) {
  return messages.map((message) => ({
    role: message.role,
    content: [{ type: 'input_text', text: message.content }],
  }));
}

function parseJsonLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractDelta(payload: Record<string, unknown>): string {
  const delta = payload.delta;
  if (typeof delta === 'string') return delta;

  const text = payload.text;
  if (typeof text === 'string') return text;

  const output = payload.output;
  if (Array.isArray(output)) {
    const parts = output
      .flatMap((item) => {
        if (!item || typeof item !== 'object') return [];
        const content = (item as { content?: unknown }).content;
        if (!Array.isArray(content)) return [];
        return content
          .map((part) => {
            if (!part || typeof part !== 'object') return '';
            const textPart = (part as { text?: unknown }).text;
            return typeof textPart === 'string' ? textPart : '';
          })
          .filter(Boolean);
      })
      .join('');

    return parts;
  }

  return '';
}

async function consumeSse(
  response: Response,
  onEvent: (event: ChatStreamEvent) => void,
) {
  if (!response.body) {
    throw new Error('OpenAI response stream missing.');
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

      const type = payload.type;
      if (type === 'response.created') {
        const model = typeof payload.model === 'string' ? payload.model : 'openai';
        onEvent({ type: 'meta', provider: 'openai', model });
      }

      if (type === 'response.output_text.delta' || type === 'response.delta') {
        const delta = extractDelta(payload);
        if (delta) onEvent({ type: 'text-delta', delta });
      }

      if (type === 'response.error') {
        const message = typeof payload.message === 'string' ? payload.message : 'OpenAI stream failed.';
        onEvent({ type: 'error', message });
      }
    }
  }
}

export const openAIProvider: AIProviderClient = {
  name: 'openai',
  async streamChat(request, onEvent) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable.');
    }

    const model = request.model ?? process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: true,
        input: toOpenAIInput(request.messages),
        ...(request.systemPrompt ? { instructions: request.systemPrompt } : {}),
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenAI error (${response.status}): ${details || 'unknown error'}`);
    }

    onEvent({ type: 'meta', provider: 'openai', model });
    await consumeSse(response, onEvent);
  },
};
