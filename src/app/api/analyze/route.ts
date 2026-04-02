
import { NextResponse } from 'next/server';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

/**
 * @fileOverview API Route Handler for Financial Analysis.
 * Provides a hard boundary between client-side UI and server-side AI logic.
 */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Execute the analysis flow strictly on the server
    const result = await analyzeFinancialDocument({
      imageDataUri: body.imageDataUri,
      documentText: body.documentText,
      history: body.history,
      userMemory: body.userMemory
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Analysis Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process analysis protocol.',
        summary: 'I encountered a protocol interruption while processing your request.',
        isActionable: false,
        detectedItems: [],
        savingsEstimate: 0
      }, 
      { status: 500 }
    );
  }
}
