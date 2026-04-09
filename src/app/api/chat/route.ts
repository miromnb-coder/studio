import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getAIProvider } from '@/lib/ai/provider';
import { runOperatorPipeline } from '@/agent/operator/operator';

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant', 'system']), content: z.string().min(1) })).min(1),
});

const encoder = new TextEncoder();

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function normalizeProviderError(providerName: string, error: unknown): string {
  const raw = error instanceof Error ? error.message : 'Unexpected provider failure.';

  if (providerName === 'groq' && /GROQ_API_KEY/i.test(raw)) {
    return 'Groq is selected but not configured. Set AI_PROVIDER=groq and add a valid GROQ_API_KEY (and optional GROQ_MODEL) on the server.';
  }

  if (providerName === 'openai' && /OPENAI_API_KEY/i.test(raw)) {
    return 'OpenAI is selected but not configured. Add OPENAI_API_KEY on the server or switch AI_PROVIDER=groq.';
  }

  return raw;
}

function buildSessionId(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for') ?? 'local';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  return `${forwardedFor.split(',')[0]?.trim()}:${userAgent.slice(0, 48)}`;
}

function streamAsDeltas(controller: ReadableStreamDefaultController<Uint8Array>, text: string) {
  const chunks = text.match(/.{1,120}/g) ?? [];
  for (const chunk of chunks) {
    controller.enqueue(streamLine({ type: 'text-delta', delta: chunk }));
  }
}

export async function POST(request: NextRequest) {
  let parsed: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    parsed = requestSchema.parse(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let provider;
  try {
    provider = getAIProvider();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider configuration error.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionId = buildSessionId(request);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(streamLine({ type: 'meta', provider: provider.name, agent: 'Supervisor Agent' }));

        const result = await runOperatorPipeline(provider, parsed.messages, sessionId, ({ label, status, agent }) => {
          controller.enqueue(streamLine({ type: 'step', status, label, agent }));
        });

        streamAsDeltas(controller, result.final || 'I could not generate a response.');
        controller.enqueue(streamLine({
          type: 'final',
          content: result.final,
          route: result.route,
          memoryUsed: result.memoryUsed.map((item) => ({ source: item.source, key: item.key })),
          memoryStored: result.memoryStored.map((item) => ({ source: item.source, key: item.key })),
        }));
        controller.enqueue(streamLine({ type: 'done' }));
        controller.close();
      } catch (error) {
        const message = normalizeProviderError(provider.name, error);
        controller.enqueue(streamLine({ type: 'error', message }));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
