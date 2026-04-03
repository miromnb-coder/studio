import { NextResponse } from 'next/server';
import { runAgentV4Stream } from '@/agent/v4/orchestrator';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent v4.2.
 */

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const { mode, toolCall, stream, fastPathResponse, metadata } = await runAgentV4Stream(input, userId, history, imageUri);

    if (fastPathResponse) {
      return NextResponse.json({ 
        mode: 'final_answer',
        content: fastPathResponse, 
        ...metadata 
      });
    }

    if (mode === 'tool_call') {
      return NextResponse.json({
        mode,
        ...toolCall,
        metadata
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
