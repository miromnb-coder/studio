import crypto from 'node:crypto';
import { NextRequest } from 'next/server';
import {
  createErrorEvent,
  runKernelStream,
  serializeKernelStreamEvent,
} from '@/agent/kernel';
import { chargeEstimatedCredits, settleCreditCharge, estimateCreditCost } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const encoder = new TextEncoder();

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
  mode: 'fast' | 'agent';
  usesWeb: boolean;
  requestedTools: string[];
  executionSteps: number;
};

function streamLine(payload: unknown) {
  return encoder.encode(serializeKernelStreamEvent(payload));
}

function normalizeAttachments(raw: unknown): NormalizedAttachment[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((item): item is IncomingAttachment => {
      return Boolean(item && typeof item === 'object');
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

function normalizeMessages(raw: unknown): LegacyMessage[] {
  if (!Array.isArray(raw)) return [];

  return raw
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
    }));
}

function normalizeStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function normalizeIncomingPayload(body: unknown): NormalizedPayload {
  const raw =
    body && typeof body === 'object'
      ? (body as Record<string, unknown>)
      : {};

  const legacyMessage =
    typeof raw.message === 'string' ? raw.message.trim() : '';

  const messages = normalizeMessages(raw.messages);
  const attachments = normalizeAttachments(raw.attachments);

  const input =
    messages.length > 0
      ? [...messages].reverse().find((m) => m.role === 'user')?.content ||
        legacyMessage ||
        'Continue'
      : legacyMessage ||
        (typeof raw.input === 'string' && raw.input.trim().length > 0
          ? raw.input.trim()
          : 'Continue');

  return {
    input,
    history: messages.length > 0 ? messages.slice(-12) : legacyMessage ? [{ role: 'user', content: legacyMessage }] : [],
    userId: typeof raw.userId === 'string' ? raw.userId : undefined,
    attachments,
    mode: raw.mode === 'agent' ? 'agent' : 'fast',
    usesWeb: raw.usesWeb === true,
    requestedTools: normalizeStringArray(raw.tools),
    executionSteps: typeof raw.executionSteps === 'number' && Number.isFinite(raw.executionSteps) ? raw.executionSteps : 0,
  };
}


function deriveActualCreditUsage(input: {
  mode: 'fast' | 'agent';
  message: string;
  requestedTools: string[];
  attachments: NormalizedAttachment[];
  observedTools: string[];
  executionSteps: number;
  provider?: 'groq' | 'openai';
  model?: string;
  reasoningDepth?: 'quick' | 'standard' | 'deep' | 'expert';
}) {
  const fileCount = input.attachments.filter((item) => item.kind === 'file').length;
  const imageCount = input.attachments.filter((item) => item.kind === 'image').length;
  const estimate = estimateCreditCost({
    message: input.message,
    mode: input.mode,
    tools: [...input.requestedTools, ...input.observedTools],
    executionSteps: input.executionSteps,
    provider: input.provider,
    model: input.model,
    reasoningDepth: input.reasoningDepth,
    hasFile: fileCount > 0,
    fileCount,
    hasImage: imageCount > 0,
    imageCount,
    usesWeb: input.requestedTools.some((tool) => /web/i.test(tool)) || input.observedTools.some((tool) => /web/i.test(tool)),
  });
  return estimate.estimated;
}

export async function POST(request: NextRequest) {
  let payload: NormalizedPayload;

  try {
    const body = await request.json().catch(() => ({}));
    payload = normalizeIncomingPayload(body);
  } catch {
    return Response.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const requestId = crypto.randomUUID();

  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id || payload.userId;

    if (!userId) {
      return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });
    }

    if (!payload.input.trim()) {
      return Response.json({ error: 'No message provided in request body.' }, { status: 400 });
    }

    const fileCount = payload.attachments.filter((item) => item.kind === 'file').length;
    const imageCount = payload.attachments.filter((item) => item.kind === 'image').length;

    const charged = await chargeEstimatedCredits({
      userId,
      message: payload.input,
      mode: payload.mode,
      hasFile: fileCount > 0,
      fileCount,
      hasImage: imageCount > 0,
      imageCount,
      usesWeb: payload.usesWeb,
      tools: payload.requestedTools,
      executionSteps: payload.executionSteps,
      provider: 'groq',
      model: 'llama-3.3-70b-versatile',
      reasoningDepth: payload.mode === 'agent' ? 'standard' : 'quick',
      routingMetadata: {
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        costTier: 'low',
        routingReason: 'Default routing to Groq for normal chat and planning tasks',
        fallbackUsed: false,
      },
    });

    if (!charged.ok) {
      return Response.json(
        {
          error: 'no_credits',
          credits: charged.account.credits,
          required: charged.required,
          estimate: charged.estimate,
          upgrade: true,
        },
        { status: 402 },
      );
    }

    const startedAt = Date.now();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let failed = false;
        let steps = 0;
        const observedTools = new Set<string>();
        let routedProvider: 'groq' | 'openai' = 'groq';
        let routedModel = 'llama-3.3-70b-versatile';
        let reasoningDepth: 'quick' | 'standard' | 'deep' | 'expert' = payload.mode === 'agent' ? 'standard' : 'quick';

        try {
          for await (const event of runKernelStream({
            message: payload.input,
            userId,
            mode: payload.mode,
            metadata: {
              requestId,
              history: payload.history,
              attachments: payload.attachments,
              source: 'api.chat.direct_kernel',
            },
          })) {
            steps += 1;
            if (event && typeof event === 'object' && 'type' in event) {
              const typedEvent = event as Record<string, unknown>;
              if (typedEvent.type === 'tool_started' && typeof typedEvent.tool === 'string') observedTools.add(typedEvent.tool);
              if (typedEvent.type === 'done' && typedEvent.result && typeof typedEvent.result === 'object') {
                const result = typedEvent.result as Record<string, unknown>;
                const metadata = result.metadata && typeof result.metadata === 'object' ? (result.metadata as Record<string, unknown>) : undefined;
                if (metadata?.provider === 'openai' || metadata?.provider === 'groq') routedProvider = metadata.provider;
                if (typeof metadata?.model === 'string') routedModel = metadata.model;
                if (metadata?.taskDepth === 'deep') reasoningDepth = 'deep';
                if (metadata?.taskDepth === 'standard') reasoningDepth = 'standard';
                if (metadata?.taskDepth === 'quick') reasoningDepth = 'quick';
              }
            }
            controller.enqueue(streamLine(event));
          }
        } catch (error) {
          failed = true;
          controller.enqueue(
            streamLine(
              createErrorEvent(
                error instanceof Error
                  ? error.message
                  : 'Unknown chat stream error.',
              ),
            ),
          );
        } finally {
          try {
            const actualUsage = deriveActualCreditUsage({
              mode: payload.mode,
              message: payload.input,
              requestedTools: payload.requestedTools,
              attachments: payload.attachments,
              observedTools: Array.from(observedTools),
              executionSteps: Math.max(steps, payload.executionSteps),
              provider: routedProvider,
              model: routedModel,
              reasoningDepth,
            });

            await settleCreditCharge(charged.reservationId, {
              used: actualUsage,
              failed,
              title: payload.mode === 'agent' ? 'Agent mode request' : 'Quick normal chat',
              agentTool: Array.from(observedTools)[0] || 'chat',
              reason: failed
                ? 'Chat kernel execution failed'
                : `provider:${routedProvider};model:${routedModel};reasoning:${reasoningDepth};steps:${Math.max(steps, payload.executionSteps)}`,
            });
          } catch (settleError) {
            console.error('Failed to settle chat credit charge', {
              requestId,
              error:
                settleError instanceof Error
                  ? settleError.message
                  : String(settleError),
            });
          } finally {
            controller.close();
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'x-kivo-request-id': requestId,
        'X-Credits-Remaining': String(charged.account.credits),
        'X-Credits-Estimate': String(charged.estimate.estimated),
        'X-Credits-Requires-Confirmation': String(
          charged.estimate.requiresConfirmation,
        ),
        'X-Credits-Estimate-Message': charged.estimate.estimated >= 8 ? `This task may use ~${charged.estimate.estimated} credits` : '',
        'X-Kivo-Route': 'chat-direct-kernel',
        'X-Kivo-Started-At': String(startedAt),
      },
    });
  } catch (error) {
    console.error('Kivo chat route failed before stream start', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
    });

    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Chat route failed.',
      },
      { status: 500 },
    );
  }
}
