
'use server';
/**
 * @fileOverview Universal "AI Life Operator" flow.
 *
 * - analyzeFinancialDocument - Distinguishes between general assistance and deep financial audits.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const DetectedItemSchema = z.object({
  title: z.string().describe('The name of the service or category.'),
  summary: z.string().describe('Why this is an optimization opportunity.'),
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
  estimatedSavings: z.number().describe('Monthly USD savings.'),
  alternativeSuggestion: z.string().optional(),
  alternativeLink: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Professional script.'),
  actionLabel: z.string().describe('Button label.'),
});

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional(),
  documentText: z.string().optional(),
});

const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string(),
  summary: z.string().describe('The primary conversational response.'),
  detectedItems: z.array(DetectedItemSchema).optional(),
  savingsEstimate: z.number().optional(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }).optional(),
  isActionable: z.boolean().describe('True if this triggered a financial audit with items.'),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;

export async function analyzeFinancialDocument(input: z.infer<typeof AnalyzeFinancialDocumentInputSchema>): Promise<AnalyzeFinancialDocumentOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing.');
  }

  const groq = new Groq({ apiKey });

  const prompt = `You are the "AI Life Operator". You are a refined, intelligent, and proactive assistant.
Your goal is to help the user optimize their life, primarily their finances.

INTENT ROUTING:
1. If the input contains financial data, statements, or a request to "save money":
   - Act as a "Predatory Subscription Hunter".
   - Find waste, hidden fees, and cheaper alternatives.
   - Set "isActionable" to true.
   - Populated "detectedItems", "savingsEstimate", and "beforeAfterComparison".

2. If the input is a general question (e.g., "Hello", "How do I save for a car?", "What is inflation?"):
   - Act as a helpful financial advisor and general assistant.
   - Provide a high-quality conversational answer in the "summary" field.
   - Set "isActionable" to false.
   - Leave "detectedItems" as an empty array [].

Data/Query:
${input.documentText || "Visual source detected."}

Return a JSON object matching this schema:
{
  "title": string (A concise header for the response),
  "summary": string (Your main conversational answer or audit summary),
  "isActionable": boolean,
  "detectedItems": [],
  "savingsEstimate": number,
  "beforeAfterComparison": { "currentSituation": string, "optimizedSituation": string }
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are an elite AI assistant. Always output valid JSON. Be helpful, concise, and proactive.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'llama3-70b-8192',
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
  return AnalyzeFinancialDocumentOutputSchema.parse({
    ...result,
    detectedItems: result.detectedItems || [],
    savingsEstimate: result.savingsEstimate || 0,
  });
}
