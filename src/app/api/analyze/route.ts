import { NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

/**
 * @fileOverview Legacy API Wrapper.
 * Redirects legacy /api/analyze calls to the unified Agent V6 Pipeline via src/agent/agent.ts.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("[LEGACY_API] Routing to Agent V6 Bridge...");
    const result = await runAgent(
      body.documentText || "Analysis Request",
      body.history || [],
      body.userMemory || null,
      body.imageDataUri
    );

    // Maintain backwards compatibility for the return format
    return NextResponse.json({
      title: result.data?.title || "Audit Report",
      summary: result.content,
      strategy: result.data?.strategy || "Standard advisor protocol.",
      mode: result.mode,
      isActionable: result.isActionable,
      detectedItems: result.data?.structuredData?.detectedItems || result.data?.detectedItems || [],
      savingsEstimate: result.data?.structuredData?.estimatedMonthlySavings || result.data?.savingsEstimate || 0,
      beforeAfterComparison: result.data?.beforeAfterComparison || null,
      memoryUpdates: null
    });
  } catch (error: any) {
    console.error('LEGACY_API_ERROR:', error.message);
    return NextResponse.json({ 
      title: "Sync Delayed",
      summary: "I'm reconnecting with my reasoning engine. Please standby.",
      isActionable: false,
      mode: 'general'
    });
  }
}
