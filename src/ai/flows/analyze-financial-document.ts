
'use server';
/**
 * @fileOverview A "Predatory Subscription Hunter" AI agent.
 *
 * - analyzeFinancialDocument - Handles deep financial analysis via Groq Llama 3.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const DetectedItemSchema = z.object({
  title: z.string().describe('The name of the service (e.g., Netflix).'),
  summary: z.string().describe('Why this is a bad deal or where to get it cheaper.'),
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
  alternativeSuggestion: z.string().optional().describe('Direct name of a cheaper competitor.'),
  alternativeLink: z.string().optional().describe('A URL to the alternative or a search query link.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('A professional cancellation or negotiation script.'),
  actionLabel: z.string().describe('Label for the magic button (e.g., "Draft Cancellation").'),
});

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional(),
  documentText: z.string().optional(),
});

const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  detectedItems: z.array(DetectedItemSchema),
  savingsEstimate: z.number(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;

export async function analyzeFinancialDocument(input: z.infer<typeof AnalyzeFinancialDocumentInputSchema>): Promise<AnalyzeFinancialDocumentOutput> {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing. Please add it to your environment variables or .env file.');
  }

  const groq = new Groq({
    apiKey: apiKey,
  });

  const prompt = `You are a "Predatory Subscription Hunter". Your goal is to find EVERY cent of waste in the following data.
Be aggressive. If the input is a general request like "save me money", suggest common optimizations based on market data.
If a specific service is mentioned or overpriced compared to market rates, call it out. 
If there's a cheaper alternative (e.g., Free tiers, family plans, competitors), provide it.

Data:
${input.documentText || "Image detected."}

Return a JSON object:
{
  "title": "Monthly Waste Audit",
  "summary": "High-level summary of the bleed or potential optimizations.",
  "detectedItems": [
    {
      "title": string,
      "summary": "Specific predatory detail or optimization opportunity.",
      "type": "subscription" | "recurring_charge" | ...,
      "estimatedSavings": number,
      "alternativeSuggestion": "Switch to [Competitor]",
      "alternativeLink": "https://google.com/search?q=[Competitor]",
      "urgencyLevel": "urgent",
      "copyableMessage": "Draft a professional but firm cancellation or price-match email.",
      "actionLabel": "Generate Cancellation Email"
    }
  ],
  "savingsEstimate": number,
  "beforeAfterComparison": {
    "currentSituation": "Description of the current burn or behavior.",
    "optimizedSituation": "Description of the future state after protocol execution."
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a elite financial optimization AI. You excel at detecting waste and finding cheaper alternatives. Always output valid JSON.',
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
  return AnalyzeFinancialDocumentOutputSchema.parse(result);
}
