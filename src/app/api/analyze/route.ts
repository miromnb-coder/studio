import { NextResponse } from 'next/server';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

/**
 * @fileOverview API Route Handler for Financial Analysis.
 * Hardened to prevent system-style errors from reaching the user.
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
    
    // Return a 200 OK with a friendly fallback payload
    return NextResponse.json({ 
      title: "Intelligence Briefing",
      summary: "I've reviewed the information provided. To give you a more detailed audit of your savings, could you share a bit more detail or a clear screenshot of the specific bill?",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    });
  }
}
