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
    console.error('Provider configuration error:', error);
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const sessionId = buildSessionId(request);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(streamLine({ type: 'typing' }));
        controller.enqueue(streamLine({ type: 'thinking-start' }));

        const result = await runOperatorPipeline(provider, parsed.messages, sessionId, ({ label, status }) => {
          controller.enqueue(streamLine({ type: 'step', status, label }));
        });

        controller.enqueue(streamLine({ type: 'thinking-end' }));
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
        console.error('Chat streaming error:', error);
        controller.enqueue(streamLine({ type: 'error', message: 'Something went wrong. Please try again.' }));
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
