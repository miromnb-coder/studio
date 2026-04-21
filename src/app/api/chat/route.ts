import { NextRequest } from 'next/server';
import type { AgentResponse as LegacyAgentResponse, AgentResponseMetadata } from '@/types/agent-response';
import type { OperatorResponse } from '@/types/operator-response';
import type { ResponseMode } from '@/agent/types/response-mode';
import type {
  AgentFinalAnswer,
  AgentResponse as VNextAgentResponse,
  StructuredAnswer,
} from '@/agent/vNext/types';

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

type UnifiedResult = {
  reply: string;
  structured?: StructuredAnswer;
  structuredData: Record<string, unknown>;
  metadata: Partial<AgentResponseMetadata>;
  operatorResponse?: OperatorResponse;
  confidence: number | null;
  tools: string[];
  memoryUsed: boolean;
  suggestedActions: string[];
};

function streamLine(payload: Record<string, unknown>) {
  return encoder.encode(`${JSON.stringify(payload)}\n`);
}

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
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

function isVNextResponse(value: unknown): value is VNextAgentResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.requestId === 'string' &&
    typeof record.route === 'object' &&
    typeof record.plan === 'object' &&
    typeof record.answer === 'object'
  );
}

function isLegacyResponse(value: unknown): value is LegacyAgentResponse {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.reply === 'string' && typeof record.metadata === 'object';
}

function getSafeReply(result: UnifiedResult | null): string {
  const reply = typeof result?.reply === 'string' ? result.reply.trim() : '';
  return reply || SAFE_FALLBACK;
}

function buildRouteStructuredData(route: Record<string, unknown>) {
  return {
    intent: typeof route.intent === 'string' ? route.intent : undefined,
    confidence:
      typeof route.confidence === 'number' ? route.confidence : undefined,
    reason: typeof route.reason === 'string' ? route.reason : undefined,
    requiresTools: Array.isArray(route.requiresTools)
      ? route.requiresTools
      : undefined,
    shouldFetchMemory:
      typeof route.shouldFetchMemory === 'boolean'
        ? route.shouldFetchMemory
        : undefined,
    suggestedExecutionMode:
      route.suggestedExecutionMode === 'sync' ||
      route.suggestedExecutionMode === 'stream'
        ? route.suggestedExecutionMode
        : undefined,
    fallbackMessage:
      typeof route.fallbackMessage === 'string'
        ? route.fallbackMessage
        : undefined,
  };
}

function normalizeUnifiedResult(raw: unknown): UnifiedResult | null {
  if (isVNextResponse(raw)) {
    const answer = raw.answer as AgentFinalAnswer;
    const route = asObject(raw.route);
    const memory = asObject(raw.memory);
    const evaluation = asObject(raw.evaluation);
    const routeStructured = buildRouteStructuredData(route);
    const toolResults = Array.isArray(raw.toolResults) ? raw.toolResults : [];

    const structuredData = {
      ...(asObject(answer.structuredData)),
      route: {
        ...routeStructured,
        ...asObject(asObject(answer.structuredData).route),
      },
      evaluation: {
        passed:
          typeof evaluation.passed === 'boolean' ? evaluation.passed : undefined,
        score: typeof evaluation.score === 'number' ? evaluation.score : undefined,
        issues: Array.isArray(evaluation.issues) ? evaluation.issues : [],
        suggestedActions: Array.isArray(evaluation.suggestedActions)
          ? evaluation.suggestedActions
          : [],
      },
      toolResults: toolResults.map((item) => ({
        callId: item.callId,
        stepId: item.stepId,
        tool: item.tool,
        ok: item.ok,
        error: item.error,
        data: item.data,
      })),
      memory: {
        summary:
          typeof memory.summary === 'string' ? memory.summary : undefined,
        source: typeof memory.source === 'string' ? memory.source : undefined,
        items: Array.isArray(memory.items) ? memory.items : [],
      },
      structuredAnswer: answer.structured,
    };

    return {
      reply: answer.text,
      structured: answer.structured,
      structuredData,
      metadata: {
        intent:
          typeof route.intent === 'string'
            ? (route.intent as AgentResponseMetadata['intent'])
            : 'general',
        responseMode:
          (asObject(answer.metadata).mode as ResponseMode) ||
          (asObject(answer.metadata).responseMode as ResponseMode) ||
          'operator',
        plan:
          typeof raw.plan.summary === 'string' ? raw.plan.summary : 'Generated plan',
        steps: Array.isArray(raw.plan.steps)
          ? raw.plan.steps.map((step) => ({
              action:
                typeof step.title === 'string'
                  ? step.title
                  : typeof step.id === 'string'
                    ? step.id
                    : 'Step',
              status:
                typeof step.status === 'string' ? step.status : 'completed',
              summary:
                typeof step.description === 'string'
                  ? step.description
                  : undefined,
              tool:
                typeof step.requiredTool === 'string'
                  ? step.requiredTool
                  : undefined,
            }))
          : [],
        structuredData,
        suggestedActions: Array.isArray(answer.followUps)
          ? answer.followUps.map((item, index) => ({
              id: `followup-${index + 1}`,
              label: String(item),
              kind: 'general' as const,
            }))
          : [],
        memoryUsed: Array.isArray(memory.items) ? memory.items.length > 0 : false,
      },
      operatorResponse:
        asObject(answer.metadata).operatorResponse &&
        typeof asObject(answer.metadata).operatorResponse === 'object'
          ? (asObject(answer.metadata).operatorResponse as OperatorResponse)
          : undefined,
      confidence:
        typeof answer.confidence === 'number' ? answer.confidence : null,
      tools: toolResults
        .map((item) => item.tool)
        .filter((tool): tool is string => typeof tool === 'string')
        .slice(0, 8),
      memoryUsed: Array.isArray(memory.items) ? memory.items.length > 0 : false,
      suggestedActions: Array.isArray(answer.followUps)
        ? answer.followUps.map(String)
        : [],
    };
  }

  if (isLegacyResponse(raw)) {
    const metadata = raw.metadata ?? {};
    const structuredData =
      metadata.structuredData && typeof metadata.structuredData === 'object'
        ? (metadata.structuredData as Record<string, unknown>)
        : {};

    const fromMetadata = structuredData.structuredAnswer;
    const structured =
      fromMetadata && typeof fromMetadata === 'object'
        ? (fromMetadata as StructuredAnswer)
        : raw.operatorResponse &&
            typeof raw.operatorResponse === 'object' &&
            typeof raw.operatorResponse.answer === 'string'
          ? {
              summary: raw.operatorResponse.answer,
              plainText: raw.reply,
            }
          : undefined;

    const route = asObject(structuredData.route);
    const evaluation = asObject(structuredData.evaluation);

    const confidence =
      typeof route.confidence === 'number'
        ? route.confidence
        : typeof evaluation.score === 'number'
          ? evaluation.score > 1
            ? evaluation.score / 100
            : evaluation.score
          : null;

    const toolsFromStructured = Array.isArray(structuredData.toolResults)
      ? structuredData.toolResults
          .map((item) => {
            const record = asObject(item);
            return typeof record.tool === 'string' ? record.tool : null;
          })
          .filter((item): item is string => Boolean(item))
      : [];

    const toolsFromSteps = Array.isArray(metadata.steps)
      ? metadata.steps
          .map((step) => {
            const record = asObject(step);
            return typeof record.tool === 'string'
              ? record.tool
              : typeof record.action === 'string'
                ? record.action
                : null;
          })
          .filter((item): item is string => Boolean(item))
      : [];

    const tools = [...new Set([...toolsFromStructured, ...toolsFromSteps])].slice(0, 8);

    const memoryUsed =
      typeof metadata.memoryUsed === 'boolean'
        ? metadata.memoryUsed
        : Array.isArray(asObject(structuredData.memory).items)
          ? (asObject(structuredData.memory).items as unknown[]).length > 0
          : false;

    const suggestedActions = Array.isArray(metadata.suggestedActions)
      ? metadata.suggestedActions
          .map((item) =>
            typeof item === 'string'
              ? item
              : typeof asObject(item).label === 'string'
                ? String(asObject(item).label)
                : '',
          )
          .filter((item): item is string => item.trim().length > 0)
      : [];

    return {
      reply: raw.reply,
      structured,
      structuredData,
      metadata,
      operatorResponse:
        raw.operatorResponse && typeof raw.operatorResponse === 'object'
          ? raw.operatorResponse
          : undefined,
      confidence,
      tools,
      memoryUsed,
      suggestedActions,
    };
  }

  return null;
}

function tokenChunks(text: string): string[] {
  return text.split(/(\s+)/).filter(Boolean);
}

function getResponseMode(result: UnifiedResult | null): ResponseMode {
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

  const structuredMode = asObject(result?.structuredData).response_mode;

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
    return new Response(
      JSON.stringify({ error: 'Operator backend unavailable.' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const rawResult = (await upstream.json().catch(
    () => null,
  )) as unknown;

  if (!upstream.ok) {
    const reason =
      rawResult && typeof rawResult === 'object' ? (rawResult as Record<string, unknown>) : null;

    const message =
      reason && typeof reason.message === 'string'
        ? reason.message
        : 'Something went wrong. Please try again.';

    if (
      upstream.status === 402 &&
      reason &&
      reason.error === 'limit_reached'
    ) {
      return new Response(JSON.stringify(reason), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        error:
          reason && typeof reason.error === 'string'
            ? reason.error
            : 'upstream_error',
        message,
      }),
      {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const unified = normalizeUnifiedResult(rawResult);

  if (!unified) {
    return new Response(
      JSON.stringify({
        error: 'invalid_upstream_shape',
        message: 'Operator returned an unsupported response shape.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const final = getSafeReply(unified);
  const structured = unified.structured;
  const structuredData = unified.structuredData ?? {};
  const confidence = unified.confidence;
  const tools = unified.tools;
  const memoryUsed = unified.memoryUsed;
  const suggestedActions = unified.suggestedActions;
  const operatorResponse = unified.operatorResponse;
  const responseMode = getResponseMode(unified);
  const route = unified.metadata.intent || 'general';

  const steps = Array.isArray(unified.metadata.steps)
    ? (unified.metadata.steps as AgentStep[])
    : [];

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
        structured,
        structuredData,
        toolResults: Array.isArray(structuredData.toolResults)
          ? structuredData.toolResults
          : tools.map((tool) => ({ tool, ok: true })),
        route,
        metadata: {
          ...(unified.metadata || {}),
          responseMode,
          execution:
            typeof structuredData.execution === 'object' &&
            structuredData.execution
              ? (structuredData.execution as Record<string, unknown>)
              : undefined,
          operatorResponse,
          structuredData: {
            ...structuredData,
            route: {
              ...(typeof structuredData.route === 'object' &&
              structuredData.route
                ? (structuredData.route as Record<string, unknown>)
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
            structuredAnswer: structured,
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
