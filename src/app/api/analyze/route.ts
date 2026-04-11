import { NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

/**
 * @fileOverview Legacy API Wrapper.
 * Redirects legacy /api/analyze calls to the unified Agent v8 pipeline via src/agent/agent.ts.
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("[LEGACY_API] Routing to Agent v8 compatibility bridge...");
    const result = await runAgent(
      body.documentText || "Analysis Request",
      body.history || [],
      body.userMemory || null,
      body.imageDataUri
    );
    const legacyData = (result.data ?? {}) as Record<string, any>;

    // Maintain backwards compatibility for the return format
    return NextResponse.json({
      title: legacyData.title || "Audit Report",
      summary: result.content,
      strategy: legacyData.strategy || "Standard advisor protocol.",
      mode: result.mode,
      isActionable: result.isActionable,
      detectedItems: legacyData.structuredData?.detectedItems || legacyData.detectedItems || [],
      savingsEstimate: legacyData.structuredData?.estimatedMonthlySavings || legacyData.savingsEstimate || 0,
      beforeAfterComparison: legacyData.beforeAfterComparison || null,
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
