
import { NextResponse } from 'next/server';
import { runAgentV6 } from '@/agent/v6/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent Engine v6.
 * Includes Rigorous Sanitization, Monetization Enforcement, and Debug Logging.
 */

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    console.log("--- AGENT_API_INBOUND ---");
    console.log("USER_ID:", userId);
    console.log("INPUT_LENGTH:", input?.length);
    console.log("HAS_IMAGE:", !!imageUri);

    if (!process.env.GROQ_API_KEY) {
      console.error("[CRITICAL] GROQ_API_KEY is missing from environment.");
      throw new Error('GROQ_API_KEY is not configured.');
    }

    // SANITIZE HISTORY: Ensure content is never null or empty to prevent 400 invalid_request_error
    const sanitizedHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim()
      }));

    const sanitizedInput = (typeof input === 'string' && input.trim().length > 0) 
      ? input.trim() 
      : "Analyze current state.";

    console.log("SENDING TO AI PAYLOAD:", {
      inputLength: sanitizedInput.length,
      historyCount: sanitizedHistory.length,
      sanitizedHistorySample: sanitizedHistory.slice(-1)
    });

    const { firestore } = initializeFirebase();
    
    // 1. Rigorous Monetization Check
    if (userId && userId !== 'system_anonymous' && firestore) {
      const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);
      
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
      
      await SubscriptionService.incrementUsage(firestore, userId);
    }

    console.log("Initializing Agent V6 Orchestrator...");
    const { stream, metadata } = await runAgentV6(sanitizedInput, userId || 'system_anonymous', sanitizedHistory, imageUri);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        console.log("Stream starting...");
        // First chunk is always metadata for UI routing
        controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify(metadata)}\n`));

        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          console.log("Stream finished successfully.");
        } catch (e: any) {
          console.error("STREAM_ITERATION_ERROR:", e.message);
          controller.enqueue(encoder.encode(`\n[ERROR: ${e.message}]`));
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
    console.error('--- AGENT_API_CRITICAL_FAILURE ---');
    console.error('ERROR_MESSAGE:', error.message);
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message,
        content: "Operational sync delayed. Recalibrating logic core."
      }, 
      { status: 500 }
    );
  }
}
