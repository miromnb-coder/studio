import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY, });

export async function GET(request: NextRequest) {
 try {
 const message = await openai.messages.create({
 model: 'gpt-4-mini',
 max_tokens: 100,
 messages: [
 {
 role: 'user',
 content: 'Say hello briefly.',
 },
 ],
 });
 const output = message.content[0].type === 'text' ? message.content[0].text : '';
 return NextResponse.json({ success: true, output });
 } catch (error) {
 return NextResponse.json(
 { success: false, error: error instanceof Error ? error.message : 'Unknown error', },
 { status: 500 }
 );
 }
}