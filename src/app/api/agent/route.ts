
import { NextResponse } from 'next/server';
import { runAgentV7 } from '@/agent/v7/orchestrator';
import { initializeFirebase } from '@/firebase';
import { SubscriptionService, PLAN_LIMITS } from '@/services/subscription-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Streaming API Entry Point for Agent Engine v7.
 * Includes Mandatory Message Sanitization to prevent 'messages.content is missing' errors.
 */

export async function POST(req: Request) {
  try {
    const { input, history, imageUri, userId } = await req.json();

    console.log("--- AGENT_API_INBOUND ---");
    console.log("USER_ID:", userId);
    console.log("HAS_IMAGE:", !!imageUri);

    if (!process.env.GROQ_API_KEY) {
      console.error("[CRITICAL] GROQ_API_KEY is missing from environment.");
      throw new Error('GROQ_API_KEY is not configured.');
    }

    // 🛡️ MANDATORY SANITIZATION: Ensure every message has valid content string.
    // This prevents 400 invalid_request_error: 'messages.1.content' is missing.
    const safeHistory = (history || [])
      .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map((m: any) => ({
        role: m.role || 'user',
        content: m.content.trim()
      }));

    // Ensure we have a valid input. If it's an image-only message, provide fallback text.
    const safeInput = (typeof input === 'string' && input.trim().length > 0) 
      ? input.trim() 
      : (imageUri ? "[Analyze visual data]" : null);

    if (!safeInput && safeHistory.length === 0) {
      return NextResponse.json({ error: 'No valid content provided.' }, { status: 400 });
    }

    console.log("SAFE MESSAGES TO AI:", safeHistory);

    const { firestore } = initializeFirebase();
    
    // 1. Rigorous Monetization Check
    if (userId && userId !== 'system_anonymous' && firestore) {
      const { plan, usage } = await SubscriptionService.getUserStatus(firestore, userId);
      
      const planKey = (plan || 'FREE').toUpperCase() as keyof typeof PLAN_LIMITS;
      const limits = PLAN_LIMITS[planKey] || PLAN_LIMITS.FREE;
      const limit = limits.dailyAgentRuns;
      
      if (usage.agentRuns >= limit) {
        return NextResponse.json({ 
          error: 'LIMIT_REACHED',
          message: "Daily intelligence quota exceeded.",
          usage: { ...usage, limit }
        }, { status: 403 });
      }
      
      await SubscriptionService.incrementUsage(firestore, userId);
    }

    console.log("Initializing Agent V7 Orchestrator...");
    const { stream, metadata, steps, structuredData } = await runAgentV7(safeInput || "Continue", userId || 'system_anonymous', safeHistory, imageUri);

    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        // First chunk is always metadata for UI routing
        controller.enqueue(encoder.encode(`__METADATA__:${JSON.stringify({ ...metadata, steps, structuredData })}\n`));

        try {
          if (!stream) {
            controller.enqueue(encoder.encode('No streaming response available.'));
            return;
          }

          for await (const chunk of stream) {
            const content = (chunk as any).choices?.[0]?.delta?.content || "";
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
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
    console.error('--- AGENT_API_CRITICAL_FAILURE ---', error.message);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}
