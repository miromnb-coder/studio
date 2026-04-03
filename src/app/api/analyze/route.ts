import { NextResponse } from 'next/server';
import { analyzeFinancialDocument } from '@/ai/flows/analyze-financial-document';

export const maxDuration = 60; 

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log("API Route: Processing analysis request...");

    const result = await analyzeFinancialDocument({
      imageDataUri: body.imageDataUri,
      documentText: body.documentText,
      history: body.history,
      userMemory: body.userMemory
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('CRITICAL API ERROR:', error.message);
    
    // Provide a localized, helpful fallback instead of a generic system error
    return NextResponse.json({ 
      title: "Yhteyshäiriö",
      summary: "Huomasin pienen viiveen älymoottorissa. Tarkista, että API-avaimet on asetettu oikein Vercel-ympäristöön ja yritä hetken kuluttua uudelleen.",
      strategy: 'direct_answer',
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    });
  }
}
