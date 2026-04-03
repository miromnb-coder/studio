import { NextResponse } from 'next/server';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

/**
 * @fileOverview API Route Handler for Financial Analysis.
 * Hardened to prevent 500 errors from crashing the client.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Execute the analysis flow
    const result = await analyzeFinancialDocument({
      imageDataUri: body.imageDataUri,
      documentText: body.documentText,
      history: body.history,
      userMemory: body.userMemory
    });

    // Ensure we always return a valid structure even if flow had internal issues
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Analysis Error:', error);
    
    // Return a 200 OK with a fallback payload so the client doesn't throw
    return NextResponse.json({ 
      title: "Protocol Interruption",
      summary: "I encountered a protocol interruption while processing your request. My logic is resetting for the next message.",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    });
  }
}
