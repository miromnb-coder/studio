import { NextRequest } from 'next/server';
import { runKernelStream, serializeKernelStreamEvent, createErrorEvent } from '@/agent/kernel';
import { chargeEstimatedCredits, settleCreditCharge, estimateCreditCost } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const resolveMessage = (b: any) => [b?.message, b?.prompt, b?.input, b?.text, b?.query].find((v: any) => typeof v === 'string' && v.trim())?.trim() || '';
const resolveMode = (b: any): 'fast' | 'agent' => (b?.mode === 'agent' ? 'agent' : 'fast');

function deriveActualCreditUsage(input: { message: string; mode: 'fast' | 'agent'; tools: string[]; executionSteps: number; provider?: 'groq' | 'openai'; model?: string; reasoningDepth?: 'quick' | 'standard' | 'deep' | 'expert'; }) {
  return estimateCreditCost({
    message: input.message,
    mode: input.mode,
    tools: input.tools,
    executionSteps: input.executionSteps,
    provider: input.provider,
    model: input.model,
    reasoningDepth: input.reasoningDepth,
  }).estimated;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 });

    const body = await req.json();
    const message = resolveMessage(body);
    const mode = resolveMode(body);

    if (!message) return Response.json({ error: 'No message provided in request body.' }, { status: 400 });

    const charged = await chargeEstimatedCredits({
      userId,
      message,
      mode,
      hasFile: !!body?.file,
      usesWeb: !!body?.usesWeb,
      model: typeof body?.model === 'string' ? body.model : undefined,
      tools: Array.isArray(body?.tools) ? body.tools : [],
executionSteps: Number(body?.executionSteps || 0),
      provider: 'groq',
      reasoningDepth: mode === 'agent' ? 'standard' : 'quick',
      routingMetadata: {
        provider: 'groq',
        model: typeof body?.model === 'string' ? body.model : 'llama-3.3-70b-versatile',
        costTier: 'low',
        routingReason: 'Default routing to Groq for normal workloads',
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

    const reservationId = charged.reservationId;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let failed = false;
        let steps = 0;
        const observedTools = new Set<string>();
        let routedProvider: 'groq' | 'openai' = 'groq';
        let routedModel = typeof body?.model === 'string' ? body.model : 'llama-3.3-70b-versatile';
        let reasoningDepth: 'quick' | 'standard' | 'deep' | 'expert' = mode === 'agent' ? 'standard' : 'quick';

        try {
          for await (const event of runKernelStream({ message, mode })) {
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
            controller.enqueue(encoder.encode(serializeKernelStreamEvent(event)));
          }
        } catch (error) {
          failed = true;
          controller.enqueue(encoder.encode(serializeKernelStreamEvent(createErrorEvent(error instanceof Error ? error.message : 'Unknown stream error'))));
        } finally {
          const actualUsage = deriveActualCreditUsage({
            message,
            mode,
            tools: Array.from(observedTools),
            executionSteps: Math.max(steps, Number(body?.executionSteps || 0)),
            provider: routedProvider,
            model: routedModel,
            reasoningDepth,
          });
          await settleCreditCharge(reservationId, {
            used: actualUsage,
            failed,
            title: mode === 'agent' ? 'Agent mode request' : 'Quick normal chat',
            agentTool: Array.from(observedTools)[0] || 'agent',
            reason: failed ? 'Agent execution failed' : `provider:${routedProvider};model:${routedModel};reasoning:${reasoningDepth};steps:${Math.max(steps, Number(body?.executionSteps || 0))}`,
          });
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Credits-Remaining': String(charged.account.credits),
        'X-Credits-Estimate': String(charged.estimate.estimated),
        'X-Credits-Requires-Confirmation': String(charged.estimate.requiresConfirmation),
        'X-Credits-Estimate-Message': charged.estimate.estimated >= 8 ? `This task may use ~${charged.estimate.estimated} credits` : '',
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Kernel route failed.' }, { status: 500 });
  }
}
