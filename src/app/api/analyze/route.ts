import { NextResponse } from 'next/server';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

export const maxDuration = 60; // Increase timeout for Vercel Pro if applicable, or just explicitly set it

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("API Route: Received request for analysis");

    const result = await analyzeFinancialDocument({
      imageDataUri: body.imageDataUri,
      documentText: body.documentText,
      history: body.history,
      userMemory: body.userMemory
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('FATAL API ERROR:', {
      message: error.message,
      stack: error.stack,
      cause: error.cause
    });
    
    // Return a structured response that the UI can handle without triggering a hard error
    return NextResponse.json({ 
      title: "Sync Status: Advisor Mode",
      summary: "I'm currently looking into this. There's a slight delay in my reasoning engine, but I'm still here. Could you try sending that again or share a bit more detail?",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    });
  }
}
