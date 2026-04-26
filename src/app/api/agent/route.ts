import { NextRequest } from "next/server";
import {
  runKernelStream,
  serializeKernelStreamEvent,
  createErrorEvent,
} from "@/agent/kernel";
import { chargeCredits, estimateCreditCost } from '@/lib/credits';

export const dynamic = "force-dynamic";
function resolveMessage(body:any){const candidates=[body?.message,body?.prompt,body?.input,body?.text,body?.query];for(const v of candidates){if(typeof v==='string'&&v.trim())return v.trim();}return ''}
function resolveMode(body:any):"fast"|"agent"{return body?.mode==='agent'?'agent':'fast'}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = resolveMessage(body);
    const mode = resolveMode(body);
    if (!message) return Response.json({ error:'No message provided in request body.'},{status:400});

    const estimate = estimateCreditCost({ message, mode });
    const charged = chargeCredits({ amount: estimate.cost, action: estimate.action, title: estimate.title });
    if (!charged.ok) {
      return Response.json({ error:'not_enough_credits', credits: charged.account.credits, upgrade:true }, { status: 402 });
    }

    const stream = new ReadableStream({ async start(controller) { const encoder = new TextEncoder(); try {
      for await (const event of runKernelStream({ message, mode })) {
        controller.enqueue(encoder.encode(serializeKernelStreamEvent(event)));
      }
    } catch (error) {
      controller.enqueue(encoder.encode(serializeKernelStreamEvent(createErrorEvent(error instanceof Error ? error.message : 'Unknown stream error'))));
    } finally { controller.close(); } } });

    return new Response(stream, { headers: { 'Content-Type':'application/x-ndjson; charset=utf-8', 'Cache-Control':'no-cache, no-transform', Connection:'keep-alive', 'X-Credits-Remaining': String(charged.account.credits) } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Kernel route failed.' }, { status: 500 });
  }
}
