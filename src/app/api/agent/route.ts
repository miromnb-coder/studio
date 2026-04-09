import { NextResponse } from 'next/server';
import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent Engine v7.
 * Includes mandatory message sanitization and metadata-first streaming.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { input, history, imageUri, userId } = body ?? {};

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const safeHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim(),
      }));

    const safeInput =
      typeof input === 'string' && input.trim().length > 0
        ? input.trim()
        : imageUri
          ? '[Analyze visual data]'
          : null;

    if (!safeInput && safeHistory.length === 0) {
      return NextResponse.json({ error: 'No valid content provided.' }, { status: 400 });
    }

    const { firestore } = initializeFirebase();

    if (userId && userId !== 'system_anonymous' && firestore) {
      const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);

      const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
      const limit = limits.dailyAgentRuns;

      if (usage.agentRuns >= limit) {
        return NextResponse.json(
          {
            error: 'LIMIT_REACHED',
            message: 'Daily intelligence quota exceeded.',
            usage: { ...usage, limit },
          },
          { status: 403 },
        );
      }

      await SubscriptionService.incrementUsage(firestore, userId);
    }

    console.log('Initializing Agent V7 Orchestrator...');
    const { stream, metadata, steps, structuredData } = await runAgentV7(
      safeInput || 'Continue',
      userId || 'system_anonymous',
      safeHistory,
      imageUri
    );

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        const safeMetadata = {
          intent: metadata?.intent || 'general',
          plan: metadata?.planSummary || 'No plan available.',
          steps: Array.isArray(steps) ? steps : [],
          structuredData: structuredData ?? null,
          memoryUsed: !!metadata?.memoryUsed,
          iterationCount: Array.isArray(steps) ? steps.length : 0,
          version: metadata?.version || 'v7',
          debug: metadata?.debug ?? null,
        };

        controller.enqueue(
          encoder.encode(`__METADATA__:${JSON.stringify(safeMetadata)}\n`)
        );

        try {
          if (!stream) {
            controller.enqueue(encoder.encode('No streaming response available.'));
            return;
          }

          for await (const chunk of stream as any) {
            const content = chunk?.choices?.[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (e: any) {
          console.error('STREAM_ITERATION_ERROR:', e?.message || e);
          controller.enqueue(
            encoder.encode('\nSomething went wrong while generating the response.')
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AGENT_ROUTE_ERROR:', error);

    return NextResponse.json(
      {
        error: 'AGENT_ROUTE_ERROR',
        message: error?.message || 'Unknown server error',
      },
      { status: 500 }
    );
  }
}
