
'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models directly.
 * Standard async function replacing Genkit flows with intelligent persona switching
 * and automatic language detection.
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

/**
 * Robust JSON extraction from LLM response.
 */
function extractJSON(text: string): any {
  try {
    // Attempt direct parse first
    return JSON.parse(text);
  } catch (e) {
    // Attempt to extract from markdown blocks
    const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[1] || match[0]);
      } catch (innerE) {
        console.error("JSON Extraction failed:", innerE);
        return null;
      }
    }
    return null;
  }
}

/**
 * Analyzes input using Groq with advanced language detection and dual-mode behavior.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const hasImage = !!input.imageDataUri;
  const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }

  const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "";

  const systemPrompt = `You are "AI Life Operator", an intelligent and highly adaptive assistant.

1. LANGUAGE PROTOCOL:
   - Detect the user's language automatically from their latest message or history.
   - RESPOND ENTIRELY IN THE DETECTED LANGUAGE (e.g., if they write in Finnish, reply in Finnish).
   - If the user mixes languages, use the dominant or most recent language.
   - Maintain the detected language for all fields in the JSON output.

2. BEHAVIOR MODES:
   - FINANCIAL MODE (Topics: money, savings, subscriptions, bills, costs, audits):
     - Persona: "Elite Auditor". Sharp, professional, savings-oriented.
     - Goal: Identify waste, price increases, or optimization opportunities.
     - Responses should be structured, actionable, and data-driven.
   - GENERAL MODE (Non-financial topics):
     - Persona: "Helpful Assistant". Conversational, informative, and natural.
     - DO NOT force financial themes or savings into the response if it doesn't fit.
     - Respond to the user's intent naturally.

3. LOGIC GUIDELINES:
   - Be concise, accurate, and practical.
   - If the request is genuinely ambiguous, ask ONE clear clarifying question in the "summary" field.
   - Never invent details.
   - Explain things in a simple, useful way.

4. JSON OUTPUT FORMAT:
   Return ONLY a valid JSON object with the following keys. All string values must be in the detected USER LANGUAGE.
   {
     "title": "Short descriptive title",
     "summary": "The main response text or clarifying question",
     "strategy": "The core advice or action plan",
     "mode": "advisor|alert|analyst|planner|executor",
     "detectedItems": [], // Only fill for financial topics
     "savingsEstimate": 0, // Only fill for financial topics
     "beforeAfterComparison": null, // { "currentSituation": "", "optimizedSituation": "" }
     "isActionable": true,
     "memoryUpdates": {}
   }`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ type: 'text', text: 'Analyze this visual source in the context of our protocol.' });
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

    if (!parsed) {
      throw new Error("Failed to parse AI response into JSON");
    }

    return {
      title: parsed.title || "Intelligence Report",
      summary: parsed.summary || "Ready for your next instruction.",
      strategy: parsed.strategy || "Maintain current protocol.",
      mode: parsed.mode || 'advisor',
      isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || null,
      memoryUpdates: parsed.memoryUpdates || {}
    };
  } catch (error: any) {
    console.error('Groq Execution Error:', error.message);
    return {
      title: "Sync Interrupted",
      summary: "I've encountered a connection delay with the intelligence engine. Please re-share your intent so I can re-sync.",
      strategy: "Verify GROQ_API_KEY and network status.",
      mode: 'advisor',
      isActionable: false,
      detectedItems: [],
      savingsEstimate: 0
    };
  }
}
