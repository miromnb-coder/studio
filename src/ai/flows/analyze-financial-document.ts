'use server';
/**
 * @fileOverview AI Engine v3: Adaptive Agent (Legacy Bridge).
 * Exclusively Groq-powered via Genkit.
 */

import { ai } from '@/ai/genkit';

export interface AnalyzeFinancialDocumentInput {
  imageDataUri?: string;
  documentText?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userMemory?: any;
  source?: string;
}

export interface AnalyzeFinancialDocumentOutput {
  title: string;
  summary: string;
  strategy: string;
  mode: 'alert' | 'advisor' | 'analyst' | 'planner' | 'executor' | 'reminder' | 'time_optimizer' | 'monetization' | 'technical' | 'general';
  detectedItems?: any[];
  savingsEstimate?: number;
  beforeAfterComparison?: any;
  isActionable: boolean;
  memoryUpdates?: any;
}

function extractJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[1] || match[0]);
      } catch (innerE) {
        return null;
      }
    }
    return null;
  }
}

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const hasImage = !!input.imageDataUri;
  // Exclusively Groq Models
  const modelId = hasImage ? 'groq/llama-3.2-11b-vision-preview' : 'groq/llama-3.3-70b-versatile';
  
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }

  const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "";

  const systemPrompt = `You are "AI Engine v3", the advanced agent core powered by Groq.

PRIMARY OBJECTIVE:
- Solve the user's current request using high-performance Groq reasoning.
- Detect the user's language automatically and reply in that language.

OUTPUT FORMAT:
Return ONLY a valid JSON object.
{
  "title": "Header",
  "summary": "Persona response",
  "strategy": "Plan",
  "mode": "analyst|planner|general",
  "detectedItems": [],
  "savingsEstimate": 0,
  "isActionable": boolean
}`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ text: 'Analyze this visual source using Groq protocols.' });
    userContent.push({ media: { url: input.imageDataUri } });
  } else {
    userContent.push({ 
      text: `USER_MESSAGE: "${latestUserMessage}"\n\nCONTEXTUAL_HISTORY:\n${JSON.stringify(input.history || [])}` 
    });
  }

  try {
    const response = await ai.generate({
      model: modelId,
      system: systemPrompt,
      prompt: userContent,
      config: { temperature: 0.1 }
    });

    const parsed = extractJSON(response.text);
    if (!parsed) throw new Error("JSON Extraction failed");

    return {
      title: parsed.title || "Intelligence Briefing",
      summary: parsed.summary || "Ready.",
      strategy: parsed.strategy || "Maintain protocol.",
      mode: parsed.mode || 'general',
      isActionable: !!parsed.isActionable,
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || null,
      memoryUpdates: parsed.memoryUpdates || {}
    };
  } catch (error: any) {
    console.error('Groq Flow Error:', error.message);
    return {
      title: "Sync Interrupted",
      summary: "I've encountered a delay with Groq. Please retry.",
      strategy: "Verify API status.",
      mode: 'general',
      isActionable: false
    };
  }
}
