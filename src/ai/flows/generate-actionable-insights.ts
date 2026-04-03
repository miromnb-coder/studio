'use server';
/**
 * @fileOverview Genkit flow, joka luo suositeltuja toimenpiteitä Groqin avulla.
 */

import { ai } from '@/ai/genkit';
import { groq } from '@/ai/groq';
import { z } from 'genkit';

const RecommendedActionSchema = z.object({
  actionTitle: z.string(),
  actionDescription: z.string(),
  urgencyLevel: z.enum(['Urgent', 'High', 'Medium', 'Low']),
  estimatedSavings: z.number(),
  copyableMessage: z.string().optional(),
  category: z.string(),
  relatedItemTitle: z.string(),
});

const GenerateActionableInsightsInputSchema = z.object({
  detectedItems: z.array(z.any()),
  totalEstimatedMonthlySavings: z.number(),
});

const GenerateActionableInsightsOutputSchema = z.object({
  prioritizedActions: z.array(RecommendedActionSchema),
  overallActionSummary: z.string(),
});

export type GenerateActionableInsightsInput = z.infer<typeof GenerateActionableInsightsInputSchema>;
export type GenerateActionableInsightsOutput = z.infer<typeof GenerateActionableInsightsOutputSchema>;

const generateActionableInsightsFlow = ai.defineFlow(
  {
    name: 'generateActionableInsightsFlow',
    inputSchema: GenerateActionableInsightsInputSchema,
    outputSchema: GenerateActionableInsightsOutputSchema,
  },
  async (input) => {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Olet AI Life Operator. Luo priorisoitu lista toimenpiteistä havaittujen taloudellisten löydösten perusteella. Palauta vastaus JSON-muodossa.'
          },
          {
            role: 'user',
            content: JSON.stringify(input)
          }
        ],
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return {
        prioritizedActions: parsed.prioritizedActions || [],
        overallActionSummary: parsed.overallActionSummary || "Toimenpidesuunnitelma luotu."
      };
    } catch (error) {
      console.error('Groq Insights Error:', error);
      return {
        prioritizedActions: [],
        overallActionSummary: "Insight-moottori on hetkellisesti pois käytöstä."
      };
    }
  }
);

export async function generateActionableInsights(input: GenerateActionableInsightsInput): Promise<GenerateActionableInsightsOutput> {
  return generateActionableInsightsFlow(input);
}
