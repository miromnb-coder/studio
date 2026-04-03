import { NextResponse } from 'next/server';
import { runAgent } from '@/agent/agent';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * @fileOverview Primary API entry point for the AI Agent v3.
 * Handles chat, image audits, and general intelligence requests.
 */

export async function POST(req: Request) {
  try {
    const { input, history, memory, imageUri } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured.');
    }

    console.log("AGENT_REQUEST: Processing intent...");
    const result = await runAgent(input, history, memory, imageUri);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('CRITICAL AGENT ERROR:', error.message);
    return NextResponse.json(
      { 
        content: "I've encountered a slight sync delay with my reasoning engine. Standing by for retry.",
        intent: 'general',
        isActionable: false,
        mode: 'general',
        error: error.message 
      }, 
      { status: 500 }
    );
  }
}
