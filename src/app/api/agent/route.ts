import { NextResponse } from 'next/server';
import { runAgentV5 } from '@/agent/v5/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent Engine v5.
 * Includes Rigorous Monetization Enforcement.
 */

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const { firestore } = initializeFirebase();
    
    // 1. Rigorous Monetization Check
    if (userId && userId !== 'system_anonymous' && firestore) {
      const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);
      
      // Ensure plan exists in limits, fallback to FREE
      const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
      const limit = limits.dailyAgentRuns;
      
      if (usage.agentRuns >= limit) {
        console.warn(`[ENFORCEMENT] Limit reached for User ${userId} (${usage.agentRuns}/${limit})`);
        return NextResponse.json({ 
          error: 'LIMIT_REACHED',
          message: "Daily intelligence quota exceeded. Please elevate clearance.",
          usage: { ...usage, limit }
        }, { status: 403 });
      }
      
      // Increment usage immediately (optimistic update)
      await SubscriptionService.incrementUsage(firestore, userId);
    }

    const { stream, metadata } = await runAgentV5(input, userId || 'system_anonymous', history, imageUri);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // First chunk is always metadata for UI routing
        controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify(metadata)}\n`));

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (e) {
          console.error("Stream iteration error", e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
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
