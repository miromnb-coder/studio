import { NextRequest } from "next/server";
import { runKernelStream } from "@/agent/kernel";
import { serializeKernelStreamEvent } from "@/agent/kernel";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message =
      typeof body?.message === "string" ? body.message : "";

    const mode =
      body?.mode === "agent" ? "agent" : "fast";

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        for await (const event of runKernelStream({
          message,
          mode,
        })) {
          controller.enqueue(
            encoder.encode(
              serializeKernelStreamEvent(event)
            )
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Kernel route failed.",
      },
      { status: 500 }
    );
  }
}
