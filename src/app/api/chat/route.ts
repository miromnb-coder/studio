import { NextRequest } from 'next/server';
import type { AgentResponse } from '@/types/agent-response';
import type { OperatorResponse } from '@/types/operator-response';
import type { ResponseMode } from '@/agent/types/response-mode';

const encoder = new TextEncoder();

const SAFE_FALLBACK =
  'I ran into an issue, but here’s what I could analyze so far.';

type LegacyMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type IncomingAttachment = {
  id?: string;
  name?: string;
  kind?: 'image' | 'file';
  mimeType?: string;
  size?: number;
  previewUrl?: string;
};

type NormalizedAttachment = {
  id: string;
  name: string;
  kind: 'image' | 'file';
  mimeType?: string;
  size?: number;
};

type NormalizedPayload = {
  input: string;
  history: LegacyMessage[];
  userId?: string;
  attachments: NormalizedAttachment[];
};

type AgentStep = {
  action?: string;
  status?: string;
  summary?: string;
  error?: string;
  tool?: string;
};

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function normalizeAttachments(raw: unknown): NormalizedAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is IncomingAttachment => {
      if (!item || typeof item !== 'object') return false;
      return true;
    })
    .map((item, index) => {
      const kind = item.kind === 'image' ? 'image' : 'file';

      return {
        id:
          typeof item.id === 'string' && item.id.trim().length > 0
            ? item.id
            : `attachment-${index + 1}`,
        name:
          typeof item.name === 'string' && item.name.trim().length > 0
            ? item.name
            : kind === 'image'
              ? `image-${index + 1}`
              : `file-${index + 1}`,
        kind,
        mimeType:
          typeof item.mimeType === 'string' ? item.mimeType : undefined,
        size:
          typeof item.size === 'number' && Number.isFinite(item.size)
            ? item.size
            : undefined,
      };
    });
}

function normalizeIncomingPayload(body: unknown): NormalizedPayload {
  const raw =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {};

  const legacyMessage =
    typeof raw.message === 'string' ? raw.message.trim() : '';

  const attachments = normalizeAttachments(raw.attachments);

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
      attachments,
    };
  }

  return {
    input: legacyMessage || 'Continue',
    history: legacyMessage
      ? [{ role: 'user', content: legacyMessage }]
      : [],
    userId:
      typeof raw.userId === 'string' ? raw.userId : undefined,
    attachments,
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
    ? result!.metadata!.suggestedActions
        .map((item) =>
          typeof item === 'string'
            ? item
            : typeof item?.label === 'string'
              ? item.label
              : '',
        )
        .filter((item): item is string => item.trim().length > 0)
    : [];
}

function tokenChunks(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

function getOperatorResponse(
  result: AgentResponse | null,
): OperatorResponse | undefined {
  if (result?.operatorResponse && typeof result.operatorResponse === 'object') {
    return result.operatorResponse;
  }

  if (
    result?.metadata?.operatorResponse &&
    typeof result.metadata.operatorResponse === 'object'
  ) {
    return result.metadata.operatorResponse;
  }

  return undefined;
}

function getResponseMode(result: AgentResponse | null): ResponseMode {
  const metadataMode = result?.metadata?.responseMode;
  if (
    metadataMode === 'casual' ||
    metadataMode === 'fast' ||
    metadataMode === 'operator' ||
    metadataMode === 'tool' ||
    metadataMode === 'fallback'
  ) {
    return metadataMode;
  }

  const structuredMode =
    result?.metadata?.structuredData &&
    typeof result.metadata.structuredData === 'object'
      ? (result.metadata.structuredData as Record<string, unknown>).response_mode
      : undefined;

  if (
    structuredMode === 'casual' ||
    structuredMode === 'fast' ||
    structuredMode === 'operator' ||
    structuredMode === 'tool' ||
    structuredMode === 'fallback'
  ) {
    return structuredMode;
  }

  return 'operator';
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
    attachmentCount: payload.attachments.length,
    hasUserId: Boolean(payload.userId),
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
      attachments: payload.attachments,
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
  )) as AgentResponse | (Record<string, unknown> & { message?: string }) | null;

  if (!upstream.ok) {
    const message =
      result && typeof result === 'object' && typeof result.message === 'string'
        ? result.message
        : 'Something went wrong. Please try again.';

    console.error('CHAT_STREAM_UPSTREAM_FAILED', {
      requestId,
      status: upstream.status,
      durationMs: Date.now() - start,
      message,
      errorType:
        result && typeof result === 'object' ? result.error : undefined,
    });

    if (
      upstream.status === 402 &&
      result &&
      typeof result === 'object' &&
      result.error === 'limit_reached'
    ) {
      return new Response(JSON.stringify(result), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        error:
          result && typeof result === 'object' && typeof result.error === 'string'
            ? result.error
            : 'upstream_error',
        message,
      }),
      {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const agentResult = result as AgentResponse | null;

  const final = getSafeReply(agentResult);
  const steps = getSteps(agentResult);
  const structuredData = getStructuredData(agentResult);
  const confidence = getConfidence(agentResult, structuredData);
  const tools = getToolNames(agentResult, structuredData);
  const memoryUsed = getMemoryUsed(agentResult, structuredData);
  const suggestedActions = getSuggestedActions(agentResult);
  const operatorResponse = getOperatorResponse(agentResult);
  const responseMode = getResponseMode(agentResult);
  const route = agentResult?.metadata?.intent || 'general';
  const tokens = tokenChunks(final);
  const normalizedSteps = steps.slice(0, 8).map((step, index) => ({
    stepId: `tool-${index + 1}`,
    label:
      step.action?.trim() ||
      step.tool?.trim() ||
      `Tool step ${index + 1}`,
    status: step.status,
    summary: step.summary,
    error: step.error,
    tool: step.tool,
  }));
  const fallbackToolSteps =
    normalizedSteps.length === 0
      ? tools.slice(0, 4).map((tool, index) => ({
          stepId: `tool-${index + 1}`,
          label: `Using ${tool}`,
          status: 'completed',
          summary: undefined,
          error: undefined,
          tool,
        }))
      : [];
  const toolSteps = normalizedSteps.length > 0 ? normalizedSteps : fallbackToolSteps;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payloadLine: Record<string, unknown>) => {
        console.debug('CHAT_STREAM_EVENT', { requestId, ...payloadLine });
        controller.enqueue(streamLine(payloadLine));
      };

      const shouldEmitWorkflow =
        responseMode === 'operator' || responseMode === 'tool';
      const shouldEmitCompactWorkflow = responseMode === 'fast';

      if (shouldEmitWorkflow || shouldEmitCompactWorkflow) {
        send({
          type: 'router_started',
          stepId: 'router',
          label: 'Analyzing request',
          requestId,
        });

        await delay(40);
        send({
          type: 'router_completed',
          stepId: 'router',
          label: 'Analyzing request',
          requestId,
        });
      }

      if (shouldEmitWorkflow) {
        await delay(40);
        send({
          type: 'planning_started',
          stepId: 'planning',
          label: 'Building execution plan',
          requestId,
        });

        await delay(40);
        send({
          type: 'planning_completed',
          stepId: 'planning',
          label: 'Building execution plan',
          requestId,
        });

        await delay(40);
        send({
          type: 'memory_started',
          stepId: 'memory',
          label: 'Checking memory',
          requestId,
        });

        await delay(40);
        send({
          type: 'memory_completed',
          stepId: 'memory',
          label: 'Checking memory',
          status: memoryUsed ? 'completed' : 'skipped',
          summary: memoryUsed
            ? 'Relevant memory was incorporated.'
            : 'No relevant memory found for this request.',
          requestId,
        });
      }

      if (responseMode === 'tool' || (responseMode === 'operator' && toolSteps.length > 0)) {
        for (const step of toolSteps) {
          await delay(45);
          send({
            type: 'tool_started',
            stepId: step.stepId,
            label: step.label,
            summary: step.summary,
            tool: step.tool,
            requestId,
          });

          await delay(45);
          send({
            type: 'tool_completed',
            stepId: step.stepId,
            label: step.label,
            summary: step.summary,
            tool: step.tool,
            status: step.status,
            error: step.error,
            requestId,
          });
        }
      }

      const firstTokenAt = Date.now();
      let emittedChars = 0;

      for (const token of tokens) {
        await delay(token.trim().length > 0 ? 10 : 5);
        emittedChars += token.length;

        send({
          type: 'answer_delta',
          delta: token,
          emittedChars,
          requestId,
        });
      }

      send({
        type: 'answer_completed',
        content: final,
        route,
        metadata: {
          ...(agentResult?.metadata || {}),
          responseMode,
          operatorResponse,
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
        operatorResponse,
        metrics: {
          ttfbMs: firstTokenAt - start,
          completionMs: Date.now() - start,
          charCount: final.length,
        },
        requestId,
      });
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
