import { NextRequest } from 'next/server';
import { runKernelStream, serializeKernelStreamEvent, createErrorEvent } from '@/agent/kernel';
import { chargeEstimatedCredits, settleCreditCharge } from '@/lib/credits';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const resolveMessage = (b: any) => [b?.message, b?.prompt, b?.input, b?.text, b?.query].find((v: any) => typeof v === 'string' && v.trim())?.trim() || '';
const resolveMode = (b: any): 'fast' | 'agent' => (b?.mode === 'agent' ? 'agent' : 'fast');

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

        try {
          for await (const event of runKernelStream({ message, mode })) {
            steps += 1;
            controller.enqueue(encoder.encode(serializeKernelStreamEvent(event)));
          }
        } catch (error) {
          failed = true;
          controller.enqueue(encoder.encode(serializeKernelStreamEvent(createErrorEvent(error instanceof Error ? error.message : 'Unknown stream error'))));
        } finally {
          const estimated = charged.estimate.estimated;
          const actualUsage = Math.max(1, Math.round(estimated * (failed ? 0.35 : Math.min(1, 0.55 + steps * 0.06))));
          await settleCreditCharge(reservationId, {
            used: actualUsage,
            failed,
            reason: failed ? 'Agent execution failed' : 'Agent execution completed',
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
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Kernel route failed.' }, { status: 500 });
  }
}
