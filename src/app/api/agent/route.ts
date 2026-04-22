import { NextRequest } from "next/server";
import {
  runKernelStream,
  serializeKernelStreamEvent,
  createErrorEvent,
} from "@/agent/kernel";

export const dynamic = "force-dynamic";

function resolveMessage(body: any): string {
  const candidates = [
    body?.message,
    body?.prompt,
    body?.input,
    body?.text,
    body?.query,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function resolveMode(body: any): "fast" | "agent" {
  return body?.mode === "agent" ? "agent" : "fast";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const message = resolveMessage(body);
    const mode = resolveMode(body);

    console.log("AGENT BODY:", body);
    console.log("AGENT MESSAGE:", message);
    console.log("AGENT MODE:", mode);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        try {
          if (!message) {
            controller.enqueue(
              encoder.encode(
                serializeKernelStreamEvent(
                  createErrorEvent(
                    "No message provided in request body."
                  )
                )
              )
            );
            controller.close();
            return;
          }

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
        } catch (error) {
          console.error("AGENT STREAM ERROR:", error);

          controller.enqueue(
            encoder.encode(
              serializeKernelStreamEvent(
                createErrorEvent(
                  error instanceof Error
                    ? error.message
                    : "Unknown stream error"
                )
              )
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type":
          "application/x-ndjson; charset=utf-8",
        "Cache-Control":
          "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("AGENT ROUTE ERROR:", error);

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Kernel route failed.",
      },
      { status: 500 }
    );
  }
}
