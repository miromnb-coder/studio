import { NextResponse } from 'next/server';
import { runAgentV5 } from '@/agent/v5/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent Engine v5.
 */

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const { stream, metadata } = await runAgentV5(input, userId || 'system_anonymous', history, imageUri);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // First, send the metadata as a separate chunk
        controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify(metadata)}\n`));

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('ENGINE_V5_CRITICAL_ERROR:', error.message);
    return NextResponse.json(
      { 
        content: "Operational sync delayed. Recalibrating logic core.",
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
