import { NextResponse } from 'next/server';
import { runAgentV4Stream } from '@/agent/v4/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent v4.2.
 */

export async function POST(req: Request) {
  const correlationId = crypto.randomUUID();
  try {
    const { input, history, imageUri, userId } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const { stream, fastPathResponse, metadata } = await runAgentV4Stream(input, userId, history, imageUri);

    if (fastPathResponse) {
      return NextResponse.json({ 
        content: fastPathResponse, 
        ...metadata 
      });
    }

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // First, send the metadata as a separate chunk
        controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify(metadata)}\n`));

        for await (const chunk of stream!) {
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
    console.error('AGENT_V4_CRITICAL_ERROR:', {
      correlationId,
      message: error?.message,
      code: error?.code,
      retryable: error?.retryable,
      context: error?.context
    });
    return NextResponse.json(
      { 
        content: "I hit a temporary issue while processing your request. Please try again in a moment.",
        error: {
          summary: 'Temporary processing issue.',
          correlationId
        }
      }, 
      { status: 500 }
    );
  }
}
