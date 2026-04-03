'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models.
 * Optimized for speed and reliability to avoid Vercel timeouts.
 */

import { ai } from '@/ai/genkit';
import { groq } from '@/ai/groq';
import { z } from 'genkit';

const DetectedItemSchema = z.object({
  title: z.string().describe('Service or category name.'),
  summary: z.string().describe('Brief reasoning for the finding.'),
  type: z.enum([
    'subscription',
    'recurring_charge',
    'hidden_fee',
    'trial_ending',
    'price_increase',
    'unusual_spending',
    'savings_opportunity',
    'duplicate_charge'
  ]),
  estimatedSavings: z.number().describe('Estimated monthly savings.'),
  alternativeSuggestion: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Pre-written cancellation or negotiation script.'),
});

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional(),
  documentText: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  userMemory: z.any().optional(),
});

const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  strategy: z.string(),
  mode: z.enum(['alert', 'advisor', 'analyst', 'planner', 'executor', 'reminder']),
  detectedItems: z.array(DetectedItemSchema).optional(),
  savingsEstimate: z.number().optional(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }).optional(),
  isActionable: z.boolean(),
  memoryUpdates: z.any().optional(),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;
export type AnalyzeFinancialDocumentInput = z.infer<typeof AnalyzeFinancialDocumentInputSchema>;

export const analyzeFinancialDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialDocumentFlow',
    inputSchema: AnalyzeFinancialDocumentInputSchema,
    outputSchema: AnalyzeFinancialDocumentOutputSchema,
  },
  async (input) => {
    const hasImage = !!input.imageDataUri;
    // Using faster models to stay within Vercel execution limits
    const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    
    console.log(`Starting analysis with model: ${modelId}`);

    const systemPrompt = `You are "AI Life Operator", a financial intelligence agent.
Tavoitteesi on löytää säästöjä ja optimoida kuluja.

OHJEET:
1. Analysoi käyttäjän syöte.
2. Jos havaitset kuluja, listaa ne 'detectedItems' kenttään.
3. Palauta vastaus AINA puhtaana JSON-objektina.

USER INTENT:
"${input.history?.slice(-1)[0]?.content || input.documentText || "Analysoi tilanne."}"

HISTORIA:
${JSON.stringify(input.history?.slice(-5) || [])}
`;

    const userContent: any[] = [];
    if (hasImage) {
      userContent.push({ type: 'text', text: 'Analyze this document.' });
      userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
    } else {
      userContent.push({ type: 'text', text: input.documentText || "Provide a summary of my financial standing based on history." });
    }

    try {
      if (!process.env.GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY is missing in environment variables.");
      }

      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 2000,
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      return {
        title: parsed.title || "Audit Report",
        summary: parsed.summary || "Analysis complete.",
        strategy: parsed.strategy || 'direct_answer',
        mode: parsed.mode || 'advisor',
        isActionable: !!parsed.detectedItems?.length,
        detectedItems: parsed.detectedItems || [],
        savingsEstimate: parsed.savingsEstimate || 0,
        beforeAfterComparison: parsed.beforeAfterComparison,
        memoryUpdates: parsed.memoryUpdates
      };
    } catch (error: any) {
      console.error('SERVER-SIDE ANALYSIS ERROR:', error.message || error);
      // Throwing error here so the API route catches it and logs it properly
      throw error;
    }
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
