'use server';
/**
 * @fileOverview AI Engine v3: Adaptive Agent.
 * Multi-intent reasoning engine powered by Genkit and Groq.
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
  detectedItems?: Array<{
    title: string;
    summary: string;
    type: 'subscription' | 'recurring_charge' | 'hidden_fee' | 'trial_ending' | 'price_increase' | 'unusual_spending' | 'savings_opportunity' | 'duplicate_charge' | 'time_leak' | 'revenue_opportunity' | 'task_simplification';
    estimatedSavings?: number;
    estimatedTimeGain?: string;
    alternativeSuggestion?: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    copyableMessage: string;
  }>;
  savingsEstimate?: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  };
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

/**
 * AI Engine v3: Adaptive Agent.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const hasImage = !!input.imageDataUri;
  const modelId = hasImage ? 'groq/llama-3.2-11b-vision-preview' : 'groq/llama-3.3-70b-versatile';
  
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }

  const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "";

  const systemPrompt = `You are "AI Engine v3", the advanced agent core of the Operator system.

PRIMARY OBJECTIVE:
- Solve the user's current request as effectively as possible.
- Re-evaluate every message independently.
- Detect the user's language automatically and reply in that language.
- Switch instantly when the user changes intent.

INTENT ROUTER:
Classify the dominant intent:
- FINANCE: Money, bills, savings, leaks. (Mode: 'analyst' or 'alert')
- TIME_OPTIMIZER: Calendars, schedules, productivity, task removal. (Mode: 'time_optimizer')
- MONETIZATION: Revenue, pricing, business opportunities. (Mode: 'monetization')
- TECHNICAL: Code, systems, architecture. (Mode: 'technical')
- PLANNING: Roadmaps, build plans, execution steps. (Mode: 'planner')
- ANALYSIS: Comparisons, reasoning, step-by-step logic. (Mode: 'analyst')
- GENERAL: Everyday questions, casual conversation. (Mode: 'general')

OUTPUT FORMAT:
Return ONLY a valid JSON object. All user-facing strings MUST be in the user's detected language.
{
  "title": "Short descriptive header",
  "summary": "Natural language response (Agent persona)",
  "strategy": "The implementation plan, advice, or next best action",
  "mode": "time_optimizer|monetization|technical|analyst|planner|general|alert",
  "detectedItems": [], // Populate for Finance/Time/Monetization
  "savingsEstimate": 0, // Populate ONLY for Finance
  "beforeAfterComparison": { "currentSituation": "", "optimizedSituation": "" },
  "isActionable": boolean,
  "memoryUpdates": {}
}

FAILSAFE:
- If intent is unclear, ask ONE clarifying question in the "summary" field.
- Never invent details. If uncertain, say so.`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ text: 'Analyze this visual source using Agent v3 protocols. Detect language automatically.' });
    userContent.push({ media: { url: input.imageDataUri } });
  } else {
    userContent.push({ 
      text: `USER_MESSAGE: "${latestUserMessage}"\n\nCONTEXTUAL_HISTORY:\n${JSON.stringify(input.history || [])}\n\nUSER_MEMORY:\n${JSON.stringify(input.userMemory || {})}` 
    });
  }

  try {
    const response = await ai.generate({
      model: modelId,
      system: systemPrompt,
      prompt: userContent,
      config: {
        temperature: 0.1,
      }
    });

    const rawContent = response.text;
    const parsed = extractJSON(rawContent);

    if (!parsed) throw new Error("JSON Extraction failed");

    return {
      title: parsed.title || "Intelligence Briefing",
      summary: parsed.summary || "Ready for next instruction.",
      strategy: parsed.strategy || "Maintain current protocol.",
      mode: parsed.mode || 'general',
      isActionable: !!parsed.isActionable,
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || null,
      memoryUpdates: parsed.memoryUpdates || {}
    };
  } catch (error: any) {
    console.error('AI Agent Error:', error.message);
    return {
      title: "Sync Interrupted",
      summary: "I've encountered a connection delay with the reasoning engine. Please re-share your intent.",
      strategy: "Verify API status and intent clarity.",
      mode: 'general',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    };
  }
}