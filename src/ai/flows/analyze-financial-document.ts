'use server';
/**
 * @fileOverview An AI agent that analyzes financial documents (screenshots or text) to detect subscriptions, charges, fees, and savings opportunities.
 *
 * - analyzeFinancialDocument - A function that handles the financial document analysis process.
 * - AnalyzeFinancialDocumentInput - The input type for the analyzeFinancialDocument function.
 * - AnalyzeFinancialDocumentOutput - The return type for the analyzeFinancialDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']).describe('How urgent this finding is.'),
  confidence: z.enum(['low', 'medium', 'high']).describe('Confidence level of the detection.'),
  recommendedAction: z.string().describe('A recommended action for the user.'),
  copyableMessage: z.string().optional().describe('A copyable message related to the action, e.g., cancellation email text.'),
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
      "Optional: A screenshot or image of a bill/statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
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

const analyzeFinancialDocumentPrompt = ai.definePrompt({
  name: 'analyzeFinancialDocumentPrompt',
  input: {schema: AnalyzeFinancialDocumentInputSchema},
  output: {schema: AnalyzeFinancialDocumentOutputSchema},
  prompt: `You are an expert financial assistant, specializing in identifying financial patterns and optimizing personal spending. Your task is to analyze the provided financial document (screenshot or text) and identify subscriptions, recurring charges, hidden fees, trial endings, price increases, unusual spending, duplicate charges, and potential savings opportunities.

Based on your analysis, provide a structured summary of your findings, including estimated savings, urgency levels, confidence, and actionable recommendations.

Here is the financial document for analysis:

{{#if imageDataUri}}
Photo of financial document: {{media url=imageDataUri}}
{{/if}}

{{#if documentText}}
Text from financial document:
```
{{{documentText}}}
```
{{/if}}

Carefully review the provided content. If both an image and text are provided, use the image as the primary source of information and use the text to clarify or supplement.
If only text is provided, analyze the text thoroughly. If only an image is provided, extract all relevant text and visual cues from the image.

Your output MUST be a JSON object conforming to the following structure:
```json
{{jsonSchema AnalyzeFinancialDocumentOutputSchema}}
```
`,
});

const analyzeFinancialDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialDocumentFlow',
    inputSchema: AnalyzeFinancialDocumentInputSchema,
    outputSchema: AnalyzeFinancialDocumentOutputSchema,
  },
  async (input) => {
    const {output} = await analyzeFinancialDocumentPrompt(input);
    return output!;
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
