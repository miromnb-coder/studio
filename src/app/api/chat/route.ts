import { NextRequest } from 'next/server';
import type { AgentResponse } from '@/types/agent-response';

const encoder = new TextEncoder();

const SAFE_FALLBACK = 'I ran into an issue, but here’s what I could analyze so far.';

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

type LegacyMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function normalizeIncomingPayload(body: unknown): { input: string; history: LegacyMessage[] } {
  const raw = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};

  const legacyMessage = typeof raw.message === 'string' ? raw.message.trim() : '';
  const messages = Array.isArray(raw.messages)
    ? raw.messages
      .filter((item): item is LegacyMessage => {
        if (!item || typeof item !== 'object') return false;
        const record = item as Record<string, unknown>;
        return (
          (record.role === 'user' || record.role === 'assistant' || record.role === 'system') &&
          typeof record.content === 'string' &&
          record.content.trim().length > 0
        );
      })
      .map((item) => ({ role: item.role, content: item.content.trim() }))
    : [];

  if (messages.length > 0) {
    const input = [...messages].reverse().find((m) => m.role === 'user')?.content || legacyMessage || 'Continue';
    return { input, history: messages.slice(-10) };
  }

  return {
    input: legacyMessage || 'Continue',
    history: legacyMessage ? [{ role: 'user', content: legacyMessage }] : [],
  };
}

export async function POST(request: NextRequest) {
  let payload: { input: string; history: LegacyMessage[] };

  try {
    const body = await request.json().catch(() => ({}));
    payload = normalizeIncomingPayload(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const agentUrl = new URL('/api/agent', request.url);

  const upstream = await fetch(agentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
    },
    body: JSON.stringify({
      input: payload.input,
      history: payload.history,
    }),
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream) {
    return new Response(JSON.stringify({ error: 'Operator backend unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await upstream.json().catch(() => null) as AgentResponse | null;

  if (!upstream.ok) {
    const message = (result as Record<string, unknown> | null)?.message;
    return new Response(JSON.stringify({ error: typeof message === 'string' ? message : 'Something went wrong. Please try again.' }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const final = typeof result?.reply === 'string' && result.reply.trim().length > 0 ? result.reply.trim() : SAFE_FALLBACK;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(streamLine({ type: 'typing' }));
      controller.enqueue(streamLine({ type: 'thinking-start' }));
      controller.enqueue(streamLine({ type: 'thinking-end' }));
      controller.enqueue(streamLine({ type: 'text-delta', delta: final }));
      controller.enqueue(streamLine({
        type: 'final',
        content: final,
        route: result?.metadata?.intent || 'general',
        memoryUsed: [],
        memoryStored: [],
        metadata: result?.metadata || {},
      }));
      controller.enqueue(streamLine({ type: 'done' }));
      controller.close();
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
