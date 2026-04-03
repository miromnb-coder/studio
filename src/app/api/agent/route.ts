import { NextResponse } from 'next/server';
import { runAgentV4Stream } from '@/agent/v4/orchestrator';
import { AgentApiResponse, AgentStreamEvent } from '@/agent/v4/types';

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

    const { stream, response, metadata } = await runAgentV4Stream(input, userId, history, imageUri);

    if (response) {
      return NextResponse.json(response);
    }

    if (!stream) {
      throw new Error('Agent stream did not initialize.');
    }

    const encoder = new TextEncoder();

    const encodeEvent = (event: AgentStreamEvent) => {
      return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
    };

    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        controller.enqueue(
          encodeEvent({
            type: 'metadata',
            payload: metadata
          })
        );

        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            fullContent += token;
            controller.enqueue(
              encodeEvent({
                type: 'token',
                payload: { delta: token }
              })
            );
          }
        }

        const finalPayload: AgentApiResponse = {
          analysis: `Intent ${metadata.intent} processed via full-path orchestration with planner and tool execution.`,
          plan: metadata.plan || [],
          actions: metadata.actions || [],
          result: fullContent.trim()
        };

        controller.enqueue(
          encodeEvent({
            type: 'final',
            payload: finalPayload
          })
        );

        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      },
    });
  } catch (error: any) {
    console.error('AGENT_V4_CRITICAL_ERROR:', error.message);
    const fallback: AgentApiResponse = {
      analysis: 'Pipeline failed before completion; returned fallback response.',
      plan: [],
      actions: [],
      result: "I've encountered a slight sync delay in my reasoning core. Neural pathways are recalibrating."
    };

    return NextResponse.json(
      {
        ...fallback,
        error: error.message
      },
      { status: 500 }
    );
  }
}
