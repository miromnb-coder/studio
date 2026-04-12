'use server';
/**
 * @fileOverview Standard async function to generate actionable insights using Genkit and Groq.
 */

import { ai } from '@/ai/genkit';
import { resolveGenkitModel } from '@/lib/ai/config';

export interface GenerateActionableInsightsInput {
  detectedItems: any[];
  totalEstimatedMonthlySavings: number;
}

export interface GenerateActionableInsightsOutput {
  prioritizedActions: Array<{
    actionTitle: string;
    actionDescription: string;
    urgencyLevel: 'Urgent' | 'High' | 'Medium' | 'Low';
    estimatedSavings: number;
    copyableMessage?: string;
    category: string;
    relatedItemTitle: string;
  }>;
  overallActionSummary: string;
}

/**
 * Luo priorisoidun toimenpidesuunnitelman havaittujen löydösten perusteella.
 */
export async function generateActionableInsights(input: GenerateActionableInsightsInput): Promise<GenerateActionableInsightsOutput> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing.");
  }

  try {
    const response = await ai.generate({
      model: resolveGenkitModel(),
      system: 'Olet AI Life Operator. Luo priorisoitu lista toimenpiteistä havaittujen taloudellisten löydösten perusteella suomeksi. Palauta vastaus tiukasti JSON-muodossa.',
      prompt: JSON.stringify(input),
      config: {
        temperature: 0.2,
      }
    });

    const rawContent = response.text;
    let jsonString = rawContent.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
    }
    
    const parsed = JSON.parse(jsonString);
    
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
