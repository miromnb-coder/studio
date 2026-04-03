
import { NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview API Endpoint for the AI Agent v3.
 */

export async function POST(req: Request) {
  try {
    const { input, history, memory } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    const result = await runAgent(input, history, memory);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Agent API Error:', error.message);
    return NextResponse.json(
      { 
        content: "I encountered a synchronization delay with my reasoning engine. Please try again.",
        intent: 'general',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
