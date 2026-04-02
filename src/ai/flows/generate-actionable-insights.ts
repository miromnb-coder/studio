'use server';
/**
 * @fileOverview A Genkit flow for generating actionable financial insights and copyable messages based on detected financial findings.
 *
 * - generateActionableInsights - A function that generates a prioritized list of recommended actions and messages.
 * - GenerateActionableInsightsInput - The input type for the generateActionableInsights function.
 * - GenerateActionableInsightsOutput - The return type for the generateActionableInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectedItemInputSchema = z.object({
  title: z.string().describe('A brief title for the detected financial item (e.g., "Subscription detected", "Duplicate charge").'),
  summary: z.string().describe('A detailed summary of the detected item, including relevant figures and dates.'),
  confidenceLevel: z.enum(['High', 'Medium', 'Low']).describe('The AI\'s confidence level in this finding.'),
  urgencyLevel: z.enum(['Urgent', 'High', 'Medium', 'Low']).describe('The urgency of addressing this finding.'),
  estimatedSavings: z.number().describe('The estimated monthly savings associated with resolving this item.'),
  type: z.enum(['Subscription', 'Duplicate Charge', 'Hidden Fee', 'Trial Ending', 'Price Increase', 'Unusual Spending', 'Other']).describe('The type of financial item detected.'),
  details: z.record(z.any()).optional().describe('Additional structured details about the detected item, e.g., { "serviceName": "Netflix", "amount": 15.99, "frequency": "monthly" }'),
});

const GenerateActionableInsightsInputSchema = z.object({
  detectedItems: z.array(DetectedItemInputSchema).describe('A list of financial items detected during the analysis.'),
  totalEstimatedMonthlySavings: z.number().describe('The aggregated total estimated monthly savings from all detected items.'),
});
export type GenerateActionableInsightsInput = z.infer<typeof GenerateActionableInsightsInputSchema>;

const RecommendedActionSchema = z.object({
  actionTitle: z.string().describe('A concise title for the recommended action (e.g., "Cancel duplicate Spotify Premium charge").'),
  actionDescription: z.string().describe('A detailed explanation of the steps required to take this action.'),
  urgencyLevel: z.enum(['Urgent', 'High', 'Medium', 'Low']).describe('The urgency of this recommended action.'),
  estimatedSavings: z.number().describe('The estimated monthly savings if this action is successfully taken.'),
  copyableMessage: z.string().optional().describe('An optional, pre-written, copyable message (e.g., cancellation email, negotiation script) for the user.'),
  category: z.string().describe('A categorization of the action (e.g., "Subscription Management", "Dispute Resolution", "Budget Review").'),
  relatedItemTitle: z.string().describe('The title of the detected item that this action addresses.'),
});

const GenerateActionableInsightsOutputSchema = z.object({
  prioritizedActions: z.array(RecommendedActionSchema).describe('A prioritized list of recommended actions, ordered by urgency and potential savings.'),
  overallActionSummary: z.string().describe('A concise summary highlighting the most important actions and total potential savings.'),
});
export type GenerateActionableInsightsOutput = z.infer<typeof GenerateActionableInsightsOutputSchema>;

export async function generateActionableInsights(input: GenerateActionableInsightsInput): Promise<GenerateActionableInsightsOutput> {
  return generateActionableInsightsFlow(input);
}

const generateActionableInsightsPrompt = ai.definePrompt({
  name: 'generateActionableInsightsPrompt',
  input: { schema: GenerateActionableInsightsInputSchema },
  output: { schema: GenerateActionableInsightsOutputSchema },
  prompt: `You are an "AI Life Operator", an intelligent, calm, trustworthy, and highly refined assistant focused on helping users save money and time by managing their finances proactively.
Your task is to analyze detected financial findings and generate a prioritized list of actionable recommendations for the user, along with any relevant copyable messages for cancellation or negotiation.

Here are the financial findings from the user's analysis:

Detected Items:
{{#each detectedItems}}
- Title: {{{title}}}
  Summary: {{{summary}}}
  Confidence: {{{confidenceLevel}}}
  Urgency: {{{urgencyLevel}}}
  Estimated Monthly Savings: ${{estimatedSavings}}
  Type: {{{type}}}
  Details: {{{json details}}}
{{/each}}

Total Estimated Monthly Savings from these findings: ${{totalEstimatedMonthlySavings}}

Based on these findings, generate a prioritized list of actionable recommendations for the user.
Each action should include a clear title, a detailed description of steps, an urgency level, estimated monthly savings, an optional copyable message (for cancellations, disputes, or negotiations), a category, and specify the title of the related detected item.
Prioritize actions that have high urgency and high estimated savings first.
Also, provide an overall summary of the generated actions.

Ensure the output strictly adheres to the JSON schema provided.`,
});

const generateActionableInsightsFlow = ai.defineFlow(
  {
    name: 'generateActionableInsightsFlow',
    inputSchema: GenerateActionableInsightsInputSchema,
    outputSchema: GenerateActionableInsightsOutputSchema,
  },
  async (input) => {
    const { output } = await generateActionableInsightsPrompt(input);
    return output!;
  }
);
