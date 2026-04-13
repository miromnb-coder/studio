import { NextRequest } from 'next/server';
import type { AgentResponse } from '@/types/agent-response';

const encoder = new TextEncoder();

const SAFE_FALLBACK =
  'I ran into an issue, but here’s what I could analyze so far.';

type LegacyMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type NormalizedPayload = {
  input: string;
  history: LegacyMessage[];
  userId?: string;
};

type AgentStep = {
  action?: string;
  status?: string;
  summary?: string;
  error?: string;
};

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function normalizeIncomingPayload(body: unknown): NormalizedPayload {
  const raw =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {};

  const legacyMessage =
    typeof raw.message === 'string' ? raw.message.trim() : '';

  const messages = Array.isArray(raw.messages)
    ? raw.messages
        .filter((item): item is LegacyMessage => {
          if (!item || typeof item !== 'object') return false;
          const record = item as Record<string, unknown>;

          return (
            (record.role === 'user' ||
              record.role === 'assistant' ||
              record.role === 'system') &&
            typeof record.content === 'string' &&
            record.content.trim().length > 0
          );
        })
        .map((item) => ({
          role: item.role,
          content: item.content.trim(),
        }))
    : [];

  if (messages.length > 0) {
    const input =
      [...messages].reverse().find((m) => m.role === 'user')?.content ||
      legacyMessage ||
      'Continue';

    return {
      input,
      history: messages.slice(-12),
      userId:
        typeof raw.userId === 'string' ? raw.userId : undefined,
    };
  }

  return {
    input: legacyMessage || 'Continue',
    history: legacyMessage
      ? [{ role: 'user', content: legacyMessage }]
      : [],
    userId:
      typeof raw.userId === 'string' ? raw.userId : undefined,
  };
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getSafeReply(result: AgentResponse | null): string {
  const reply =
    typeof result?.reply === 'string' ? result.reply.trim() : '';
  return reply || SAFE_FALLBACK;
}

function getSteps(result: AgentResponse | null): AgentStep[] {
  return Array.isArray(result?.metadata?.steps)
    ? (result?.metadata?.steps as AgentStep[])
    : [];
}

function getStructuredData(result: AgentResponse | null) {
  return result?.metadata?.structuredData &&
    typeof result.metadata.structuredData === 'object'
    ? (result.metadata.structuredData as Record<string, unknown>)
    : {};
}

function getConfidence(
  result: AgentResponse | null,
  structuredData: Record<string, unknown>,
): number | null {
  const route = structuredData.route;
  if (
    route &&
    typeof route === 'object' &&
    typeof (route as Record<string, unknown>).confidence === 'number'
  ) {
    return (route as Record<string, unknown>).confidence as number;
  }

  const evaluation = structuredData.evaluation;
  if (
    evaluation &&
    typeof evaluation === 'object' &&
    typeof (evaluation as Record<string, unknown>).score === 'number'
  ) {
    const score = (evaluation as Record<string, unknown>).score as number;
    return score > 1 ? score / 100 : score;
  }

  return null;
}

function getToolNames(
  result: AgentResponse | null,
  structuredData: Record<string, unknown>,
): string[] {
  const fromStructured =
    Array.isArray(structuredData.toolResults)
      ? structuredData.toolResults
          .map((item) => {
            if (
              item &&
              typeof item === 'object' &&
              typeof (item as Record<string, unknown>).tool === 'string'
            ) {
              return (item as Record<string, unknown>).tool as string;
            }
            return null;
          })
          .filter((item): item is string => Boolean(item))
      : [];

  const fromSteps = getSteps(result)
    .map((step) =>
      typeof step.action === 'string' ? step.action : null,
    )
    .filter((item): item is string => Boolean(item));

  return [...new Set([...fromStructured, ...fromSteps])].slice(0, 8);
}

function getMemoryUsed(
  result: AgentResponse | null,
  structuredData: Record<string, unknown>,
): boolean {
  if (typeof result?.metadata?.memoryUsed === 'boolean') {
    return result.metadata.memoryUsed;
  }

  const memory = structuredData.memory;
  if (
    memory &&
    typeof memory === 'object' &&
    Array.isArray((memory as Record<string, unknown>).items)
  ) {
    return ((memory as Record<string, unknown>).items as unknown[]).length > 0;
  }

  return false;
}

function getSuggestedActions(result: AgentResponse | null): string[] {
  return Array.isArray(result?.metadata?.suggestedActions)
    ? result!.metadata!.suggestedActions.filter(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      )
    : [];
}

function statusPhaseFromStep(step: AgentStep): string {
  if (step.status === 'failed') return 'retrying';
  if (step.status === 'running') return 'tool_running';
  if (step.status === 'pending') return 'planning';
  return 'tool_running';
}

function tokenChunks(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

export async function POST(request: NextRequest) {
  let payload: NormalizedPayload;

  try {
    const body = await request.json().catch(() => ({}));
    payload = normalizeIncomingPayload(body);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid request payload.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const requestId = crypto.randomUUID();
  const start = Date.now();
  const agentUrl = new URL('/api/agent', request.url);

  console.info('CHAT_STREAM_START', {
    requestId,
    historyCount: payload.history.length,
  });

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

    return new Response(
      JSON.stringify({ error: 'Operator backend unavailable.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const result = (await upstream.json().catch(
    () => null,
  )) as AgentResponse | null;

  if (!upstream.ok) {
    const message = (result as Record<string, unknown> | null)?.message;

    console.error('CHAT_STREAM_UPSTREAM_FAILED', {
      requestId,
      status: upstream.status,
      durationMs: Date.now() - start,
      message,
    });

    return new Response(
      JSON.stringify({
        error:
          typeof message === 'string'
            ? message
            : 'Something went wrong. Please try again.',
      }),
      {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const final = getSafeReply(result);
  const steps = getSteps(result);
  const structuredData = getStructuredData(result);
  const confidence = getConfidence(result, structuredData);
  const tools = getToolNames(result, structuredData);
  const memoryUsed = getMemoryUsed(result, structuredData);
  const suggestedActions = getSuggestedActions(result);
  const route = result?.metadata?.intent || 'general';
  const tokens = tokenChunks(final);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payloadLine: Record<string, unknown>) =>
        controller.enqueue(streamLine(payloadLine));

      send({ type: 'typing', requestId });

      await delay(50);
      send({
        type: 'status',
        phase: 'planning',
        label: 'Understanding your request',
        requestId,
      });

      await delay(60);
      send({
        type: 'status',
        phase: 'planning',
        label: 'Building execution plan',
        requestId,
      });

      if (memoryUsed) {
        await delay(60);
        send({
          type: 'status',
          phase: 'memory',
          label: 'Checking memory',
          requestId,
        });
      }

      if (steps.length > 0) {
        for (const step of steps.slice(0, 6)) {
          await delay(70);
          send({
            type: 'status',
            phase: statusPhaseFromStep(step),
            label:
              step.action ||
              (step.status === 'failed'
                ? 'A step failed'
                : 'Running step'),
            detail: step.summary,
            requestId,
          });
        }
      } else if (tools.length > 0) {
        for (const tool of tools.slice(0, 4)) {
          await delay(70);
          send({
            type: 'status',
            phase: 'tool_running',
            label: `Using ${tool}`,
            requestId,
          });
        }
      } else {
        await delay(70);
        send({
          type: 'status',
          phase: 'tool_running',
          label: 'Running checks and gathering context',
          requestId,
        });
      }

      await delay(60);
      send({
        type: 'status',
        phase: 'synthesizing',
        label: 'Generating final answer',
        requestId,
      });

      const firstTokenAt = Date.now();
      let emittedChars = 0;

      for (const token of tokens) {
        await delay(token.trim().length > 0 ? 10 : 5);
        emittedChars += token.length;

        send({
          type: 'text-delta',
          delta: token,
          emittedChars,
          requestId,
        });
      }

      send({
        type: 'final',
        content: final,
        route,
        metadata: {
          ...(result?.metadata || {}),
          structuredData: {
            ...structuredData,
            route: {
              ...(typeof structuredData.route === 'object' &&
              structuredData.route
                ? structuredData.route
                : {}),
              confidence,
            },
            toolResults:
              Array.isArray(structuredData.toolResults)
                ? structuredData.toolResults
                : tools.map((tool) => ({ tool, ok: true })),
            memory:
              structuredData.memory && typeof structuredData.memory === 'object'
                ? structuredData.memory
                : {
                    items: memoryUsed ? [{ kind: 'summary' }] : [],
                  },
          },
          suggestedActions,
          memoryUsed,
        },
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
        route,
        confidence,
        toolCount: tools.length,
        memoryUsed,
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
