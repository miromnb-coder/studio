import { NextResponse } from 'next/server';
import { runAgentV4Stream } from '@/agent/v4/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent v4.2.
 */

export async function POST(req: Request) {
  try {
    let parsedBody: any = {};
    try {
      parsedBody = await req.json();
    } catch {
      return NextResponse.json(
        {
          content: "Invalid JSON payload.",
          error: "Request body must be valid JSON."
        },
        { status: 400 }
      );
    }

    const input = typeof parsedBody?.input === 'string' ? parsedBody.input : '';
    const history = Array.isArray(parsedBody?.history) ? parsedBody.history : [];
    const imageUri = typeof parsedBody?.imageUri === 'string' ? parsedBody.imageUri : undefined;
    const userId = typeof parsedBody?.userId === 'string' ? parsedBody.userId : 'anonymous';

    if (!input.trim()) {
      return NextResponse.json(
        {
          content: "Please provide an input message.",
          error: "Field `input` is required."
        },
        { status: 400 }
      );
    }

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
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'metadata', data: metadata })}\n`));

          for await (const chunk of stream!) {
            const content = chunk?.choices?.[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'chunk', data: content })}\n`));
            }
          }
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'done' })}\n`));
        } catch (streamError: any) {
          controller.enqueue(encoder.encode(`${JSON.stringify({ type: 'error', error: streamError?.message || 'Streaming failed.' })}\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('AGENT_V4_CRITICAL_ERROR:', error.message);
    return NextResponse.json(
      { 
        content: "I've encountered a slight sync delay in my reasoning core. Neural pathways are recalibrating.",
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
