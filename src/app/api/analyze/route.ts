import { NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

/**
 * @fileOverview Legacy API Wrapper.
 * Redirects legacy /api/analyze calls to the unified Agent v3 Pipeline.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("LEGACY_REDIRECT: Routing to Agent v3...");
    const result = await runAgent(
      body.documentText || "Analysis Request",
      body.userId || 'legacy-analyze-user',
      body.history || [],
      body.imageDataUri
    );
    const nestedData = ((result.data as any)?.data ?? result.data) as any;

    // Maintain backwards compatibility for the return format
    return NextResponse.json({
      title: result.data?.title || "Audit Report",
      summary: result.content,
      strategy: result.data?.strategy || "Standard advisor protocol.",
      mode: result.mode,
      intent: result.intent,
      isActionable: false,
      detectedItems: nestedData?.detectedItems || [],
      savingsEstimate: nestedData?.savingsEstimate || 0,
      beforeAfterComparison: result.data?.beforeAfterComparison || null,
      memoryUpdates: result.data?.memoryUpdates || null
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
