
'use server';
/**
 * @fileOverview AI Engine v2: Multi-intent reasoning engine.
 * Adapts to user intent (Finance, Technical, General, Analysis, Advice) 
 * with automatic language detection and persona switching.
 */

import { groq } from '@/ai/groq';

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
  mode: 'alert' | 'advisor' | 'analyst' | 'planner' | 'executor' | 'reminder';
  detectedItems?: Array<{
    title: string;
    summary: string;
    type: 'subscription' | 'recurring_charge' | 'hidden_fee' | 'trial_ending' | 'price_increase' | 'unusual_spending' | 'savings_opportunity' | 'duplicate_charge';
    estimatedSavings: number;
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
 * AI Engine v2: Adaptive multi-modal analysis.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const hasImage = !!input.imageDataUri;
  const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }

  const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "";

  const systemPrompt = `You are "AI Engine v2", the intelligence core of the Operator system.

ENGINE RULES:
1. RE-EVALUATE: Every message is evaluated independently for its specific intent.
2. LANGUAGE: Detect user's language (Finnish, English, etc.) automatically and reply entirely in that language. 
3. INTENT DETECTION: Identify intent before answering (Finance, General, Technical, Advice, Analysis).
4. NO LOCK-IN: Switch modes instantly if the user changes topic.

INTENT MODES:
- FINANCE (Money/Bills/Savings): Persona "Elite Auditor". Structured, practical, focused on reclaimed liquidity.
- GENERAL (Casual/Broad): Persona "Helpful Assistant". Natural and conversational. Do not force financial framing.
- TECHNICAL (Code/Systems): Persona "Lead Engineer". Concise, solution-focused, exact.
- ADVICE (Recommendations): Persona "Strategist". Compare options, show tradeoffs, give clear direction.
- ANALYSIS (Reasoning): Persona "Logical Analyst". Step-by-step breakdown of patterns.

OUTPUT FORMAT:
Return ONLY a valid JSON object. All user-facing strings MUST be in the user's detected language.
{
  "title": "Short descriptive header",
  "summary": "Main natural language response or 1 clarifying question if intent is ambiguous",
  "strategy": "The core advice, implementation plan, or reasoning logic",
  "mode": "advisor|analyst|executor|planner|alert",
  "detectedItems": [], // Populate ONLY for Finance intent
  "savingsEstimate": 0, // Populate ONLY for Finance intent
  "beforeAfterComparison": null, // { "currentSituation": "", "optimizedSituation": "" }
  "isActionable": boolean, // True if there is a concrete next step
  "memoryUpdates": {}
}

FAILSAFE:
- If uncertain, say so. 
- Ask at most ONE follow-up question in the "summary" field if the request is genuinely ambiguous.
- Prioritize topic fit over repeating old context.`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ type: 'text', text: 'Analyze this visual source using Engine v2 protocols.' });
    userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
  } else {
    userContent.push({ 
      type: 'text', 
      text: `USER INTENT: "${latestUserMessage}"\n\nCONTEXTUAL HISTORY:\n${JSON.stringify(input.history || [])}` 
    });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });

    const rawContent = completion.choices[0]?.message?.content || '{}';
    const parsed = extractJSON(rawContent);

    if (!parsed) throw new Error("JSON Extraction failed");

    return {
      title: parsed.title || "Intelligence Briefing",
      summary: parsed.summary || "Ready for next instruction.",
      strategy: parsed.strategy || "Maintain current protocol.",
      mode: parsed.mode || 'advisor',
      isActionable: !!parsed.isActionable,
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || null,
      memoryUpdates: parsed.memoryUpdates || {}
    };
  } catch (error: any) {
    console.error('AI Engine Error:', error.message);
    return {
      title: "Sync Interrupted",
      summary: "I've encountered a connection delay with the reasoning engine. Please re-share your intent.",
      strategy: "Verify API status and intent clarity.",
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    };
  }
}
