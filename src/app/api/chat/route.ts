import { NextRequest } from 'next/server';
import type { AgentResponse } from '@/types/agent-response';

const encoder = new TextEncoder();

const SAFE_FALLBACK = 'I ran into an issue, but here’s what I could analyze so far.';

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

type LegacyMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function normalizeIncomingPayload(body: unknown): { input: string; history: LegacyMessage[]; userId?: string } {
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
    return {
      input,
      history: messages.slice(-10),
      userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    };
  }

  return {
    input: legacyMessage || 'Continue',
    history: legacyMessage ? [{ role: 'user', content: legacyMessage }] : [],
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
  };
}

export async function POST(request: NextRequest) {
  let payload: { input: string; history: LegacyMessage[]; userId?: string };

  try {
    const body = await request.json().catch(() => ({}));
    payload = normalizeIncomingPayload(body);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request payload.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const requestId = crypto.randomUUID();
  const start = Date.now();
  const agentUrl = new URL('/api/agent', request.url);

  console.info('CHAT_STREAM_START', { requestId, historyCount: payload.history.length });

  const upstream = await fetch(agentUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      cookie: request.headers.get('cookie') || '',
      'x-kivo-request-id': requestId,
    },
    body: JSON.stringify({
      input: payload.input,
      history: payload.history,
      userId: payload.userId,
    }),
    cache: 'no-store',
  }).catch(() => null);

  if (!upstream) {
    console.error('CHAT_STREAM_UPSTREAM_UNAVAILABLE', { requestId });
    return new Response(JSON.stringify({ error: 'Operator backend unavailable.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const result = await upstream.json().catch(() => null) as AgentResponse | null;

  if (!upstream.ok) {
    const message = (result as Record<string, unknown> | null)?.message;
    console.error('CHAT_STREAM_UPSTREAM_FAILED', {
      requestId,
      status: upstream.status,
      durationMs: Date.now() - start,
      message,
    });

    return new Response(JSON.stringify({ error: typeof message === 'string' ? message : 'Something went wrong. Please try again.' }), {
      status: upstream.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const final = typeof result?.reply === 'string' && result.reply.trim().length > 0 ? result.reply.trim() : SAFE_FALLBACK;
  const tokens = final.split(/(\s+)/).filter(Boolean);
  const steps = Array.isArray(result?.metadata?.steps) ? result!.metadata.steps : [];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payloadLine: Record<string, unknown>) => controller.enqueue(streamLine(payloadLine));

      send({ type: 'typing', requestId });
      send({ type: 'status', phase: 'planning', label: 'Understanding your request', requestId });

      if (steps.length > 0) {
        for (const step of steps.slice(0, 3)) {
          await new Promise((resolve) => setTimeout(resolve, 60));
          send({
            type: 'status',
            phase: step.status === 'failed' ? 'retrying' : 'tool_running',
            label: step.action,
            detail: step.summary,
            requestId,
          });
        }
      } else {
        await new Promise((resolve) => setTimeout(resolve, 60));
        send({ type: 'status', phase: 'tool_running', label: 'Running checks and gathering context', requestId });
      }

      send({ type: 'status', phase: 'synthesizing', label: 'Synthesizing final answer', requestId });

      let emittedChars = 0;
      const firstTokenAt = Date.now();

      for (const token of tokens) {
        await new Promise((resolve) => setTimeout(resolve, token.trim().length > 0 ? 10 : 5));
        emittedChars += token.length;
        send({ type: 'text-delta', delta: token, emittedChars, requestId });
      }

      send({
        type: 'final',
        content: final,
        route: result?.metadata?.intent || 'general',
        memoryUsed: [],
        memoryStored: [],
        metadata: result?.metadata || {},
        metrics: {
          ttfbMs: firstTokenAt - start,
          completionMs: Date.now() - start,
          charCount: final.length,
        },
        requestId,
      });
      send({ type: 'done', requestId });
      controller.close();

      console.info('CHAT_STREAM_DONE', {
        requestId,
        durationMs: Date.now() - start,
        charCount: final.length,
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'x-kivo-request-id': requestId,
    },
  });
}
