'use server';
/**
 * @fileOverview "AI Life Operator" analyysimoottori, joka käyttää Groq-malleja.
 * Toteuttaa dynaamisen mallin valinnan (Vision vs. Text) ja robustin JSON-paukkauksen.
 */

import { ai } from '@/ai/genkit';
import { groq } from '@/ai/groq';
import { z } from 'genkit';

const DetectedItemSchema = z.object({
  title: z.string().describe('Palvelun tai kategorian nimi.'),
  summary: z.string().describe('Miksi tämä on säästömahdollisuus.'),
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
  estimatedSavings: z.number().describe('Arvioitu kuukausittainen säästö dollareina/euroina.'),
  alternativeSuggestion: z.string().optional(),
  alternativeLink: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Valmis viestipohja peruutukseen tai neuvotteluun.'),
  actionLabel: z.string().describe('Toimintopainikkeen teksti.'),
});

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional().describe("Dokumentin kuva data-urina."),
  documentText: z.string().optional().describe("Dokumentin tekstisisältö."),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  userMemory: z.any().optional(),
});

const AnalyzeFinancialDocumentOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  strategy: z.enum([
    'direct_answer',
    'guided_analysis',
    'proactive_alert',
    'concise_summary',
    'follow_up',
    'action_recommendation',
    'clarification',
    'checklist'
  ]),
  mode: z.enum(['alert', 'advisor', 'analyst', 'planner', 'executor', 'reminder']),
  detectedItems: z.array(DetectedItemSchema).optional(),
  savingsEstimate: z.number().optional(),
  beforeAfterComparison: z.object({
    currentSituation: z.string(),
    optimizedSituation: z.string(),
  }).optional(),
  followUpQuestion: z.string().optional(),
  isActionable: z.boolean(),
  memoryUpdates: z.object({
    newGoals: z.array(z.string()).optional(),
    newPreferences: z.array(z.string()).optional(),
    newSubscriptions: z.array(z.string()).optional(),
    behaviorSummaryUpdate: z.string().optional(),
  }).optional(),
});

export type AnalyzeFinancialDocumentOutput = z.infer<typeof AnalyzeFinancialDocumentOutputSchema>;
export type AnalyzeFinancialDocumentInput = z.infer<typeof AnalyzeFinancialDocumentInputSchema>;

/**
 * Pääasiallinen Genkit Flow, joka kutsuu Groq-malleja.
 */
export const analyzeFinancialDocumentFlow = ai.defineFlow(
  {
    name: 'analyzeFinancialDocumentFlow',
    inputSchema: AnalyzeFinancialDocumentInputSchema,
    outputSchema: AnalyzeFinancialDocumentOutputSchema,
  },
  async (input) => {
    const hasImage = !!input.imageDataUri;
    const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    
    const messages: any[] = [
      {
        role: 'system',
        content: `Olet "AI Life Operator" - huippuälykäs ja analyyttinen talousassistentti.
Tavoitteesi on löytää käyttäjän kuluista säästöjä, turhia tilauksia ja piilokuluja.

OHJEET:
1. Analysoi käyttäjän syöte (teksti tai kuva).
2. Jos havaitset tilausmaksuja tai toistuvia kuluja, listaa ne 'detectedItems' kenttään.
3. Valitse tilanteeseen sopivin 'strategy' ja 'mode'.
4. Palauta vastaus AINA pelkkänä JSON-objektina, joka noudattaa annettua skeemaa.

SYÖTE:
${input.documentText || 'Analysoi oheinen kuva.'}

HISTORIA:
${JSON.stringify(input.history || [])}

MUISTI:
${JSON.stringify(input.userMemory || {})}
`
      }
    ];

    if (hasImage) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: 'Analysoi tämä taloudellinen dokumentti.' },
          { type: 'image_url', image_url: { url: input.imageDataUri } }
        ]
      });
    } else {
      messages.push({
        role: 'user',
        content: input.documentText || 'Tee taloudellinen auditointi.'
      });
    }

    try {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages,
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawContent);

      return {
        title: parsed.title || "Talousraportti",
        summary: parsed.summary || "Analyysi valmistui.",
        strategy: parsed.strategy || 'direct_answer',
        mode: parsed.mode || 'advisor',
        isActionable: !!parsed.detectedItems?.length,
        detectedItems: parsed.detectedItems || [],
        savingsEstimate: parsed.savingsEstimate || 0,
        beforeAfterComparison: parsed.beforeAfterComparison,
        followUpQuestion: parsed.followUpQuestion,
        memoryUpdates: parsed.memoryUpdates
      };
    } catch (error) {
      console.error('Groq Analysis Error:', error);
      return {
        title: "Huomio",
        summary: "Analyysimoottori kohtasi pienen häiriön, mutta olen edelleen tavoitettavissa. Voitko kokeilla lähettää tiedot uudelleen?",
        strategy: 'direct_answer',
        mode: 'advisor',
        isActionable: false,
        detectedItems: [],
        savingsEstimate: 0
      };
    }
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
