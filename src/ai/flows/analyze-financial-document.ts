'use server';
/**
 * @fileOverview An AI agent that analyzes financial documents using Groq Llama 3.
 *
 * - analyzeFinancialDocument - A function that handles the financial document analysis process via Groq.
 * - AnalyzeFinancialDocumentInput - The input type for the analyzeFinancialDocument function.
 * - AnalyzeFinancialDocumentOutput - The return type for the analyzeFinancialDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const DetectedItemSchema = z.object({
  title: z.string().describe('A concise title for the detected item.'),
  summary: z.string().describe('A brief summary of the detected item.'),
  type: z.enum([
    'subscription',
    'recurring_charge',
    'hidden_fee',
    'trial_ending',
    'price_increase',
    'unusual_spending',
    'savings_opportunity',
    'duplicate_charge'
  ]).describe('The type of financial finding.'),
  estimatedSavings: z.number().optional().describe('Estimated monthly savings in USD for this item, if applicable.'),
  alternativeSuggestion: z.string().optional().describe('A cheaper alternative or a note if the service is known to be overpriced.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).describe('How urgent this finding is.'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level of the detection.'),
  recommendedAction: z.string().describe('A recommended action for the user.'),
  copyableMessage: z.string().optional().describe('A copyable message related to the action, e.g., cancellation or price-match email text.'),
  nextSteps: z.array(z.string()).describe('A list of concrete next steps.'),
});

const BeforeAfterComparisonSchema = z.object({
  currentSituation: z.string().describe('Description of the current financial situation related to the analysis.'),
  optimizedSituation: z.string().describe('Description of the optimized financial situation after taking recommended actions.'),
  estimatedMonthlySavingsDifference: z.number().describe('The overall estimated monthly savings difference in USD.'),
});

export const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z
    .string()
    .optional()
    .describe(
      "Optional: A screenshot or image of a bill/statement."
    ),
  documentText: z
    .string()
    .optional()
    .describe('Optional: Pasted text from a bill, statement, or manual notes.'),
}).refine(
  (data) => data.imageDataUri || data.documentText,
  "Either imageDataUri or documentText must be provided."
);
export type AnalyzeFinancialDocumentInput = z.infer<typeof AnalyzeFinancialDocumentInputSchema>;

export const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string().describe('A title for the overall analysis report.'),
  summary: z.string().describe('A high-level summary of all findings.'),
  detectedItems: z.array(DetectedItemSchema).describe('A list of individual financial findings.'),
  savingsEstimate: z.number().describe('Total estimated monthly savings in USD across all findings.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).describe('Overall urgency level of the analysis.'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Overall confidence level of the analysis.'),
  recommendedActions: z.array(z.string()).describe('Overall recommended actions for the user.'),
  copyableMessages: z.array(z.string()).optional().describe('Overall copyable messages, if any, for the user.'),
  nextSteps: z.array(z.string()).describe('Overall concrete next steps for the user.'),
  beforeAfterComparison: BeforeAfterComparisonSchema.describe('Comparison of the financial situation before and after recommended actions.'),
});
export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;

/**
 * analyzeFinancialDocument logic powered by Groq Llama 3.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const prompt = `You are an expert financial "Agentic Money Saver". Analyze the following financial data.
Your goal is to:
1. Identify recurring subscriptions and charges.
2. Suggest cheaper alternatives or identify if a service is overpriced compared to market rates.
3. Draft professional 'Cancellation' or 'Price Match' emails for the user to copy.

Data:
${input.documentText || "No text provided. (Image input detected, please extract text if possible)"}

Return your findings in a strict JSON format matching this schema:
{
  "title": string,
  "summary": string,
  "detectedItems": [
    {
      "title": string,
      "summary": string,
      "type": "subscription" | "recurring_charge" | "hidden_fee" | "trial_ending" | "price_increase" | "unusual_spending" | "savings_opportunity" | "duplicate_charge",
      "estimatedSavings": number,
      "alternativeSuggestion": string (e.g. "Switch to Hulu for $7.99" or "Use free Tier"),
      "urgencyLevel": "low" | "medium" | "high" | "urgent",
      "confidence": "low" | "medium" | "high",
      "recommendedAction": string,
      "copyableMessage": string (Draft a professional email for cancellation or negotiation),
      "nextSteps": [string]
    }
  ],
  "savingsEstimate": number,
  "urgencyLevel": "low" | "medium" | "high" | "urgent",
  "confidence": "low" | "medium" | "high",
  "recommendedActions": [string],
  "copyableMessages": [string],
  "nextSteps": [string],
  "beforeAfterComparison": {
    "currentSituation": string,
    "optimizedSituation": string,
    "estimatedMonthlySavingsDifference": number
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a financial optimization AI specializing in detecting waste and finding cheaper alternatives. Always output valid JSON.',
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
