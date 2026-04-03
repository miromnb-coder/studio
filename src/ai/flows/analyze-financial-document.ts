'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models.
 * Optimized for deep financial intelligence and actionable insights from various sources.
 */

import { ai } from '@/ai/genkit';
import { groq } from '@/ai/groq';
import { z } from 'genkit';

const DetectedItemSchema = z.object({
  title: z.string().describe('Palvelun tai kategorian nimi (esim. Netflix, Palvelumaksu).'),
  summary: z.string().describe('Syvällinen analyysi siitä, miksi tämä on huomioitava löydös ja mitä sille pitäisi tehdä.'),
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
  estimatedSavings: z.number().describe('Arvioitu kuukausittainen säästö euroina, jos suositus toteutetaan.'),
  alternativeSuggestion: z.string().optional().describe('Konkreettinen ehdotus edullisemmasta tai paremmasta vaihtoehdosta.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Valmis, ammattimainen ja jämäkkä viestipohja suomeksi peruutukseen tai neuvotteluun.'),
});

const AnalyzeFinancialDocumentInputSchema = z.object({
  imageDataUri: z.string().optional(),
  documentText: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  userMemory: z.any().optional(),
  source: z.string().optional(),
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
    const isEmailAudit = input.documentText?.includes('Subject:') || input.source === 'email';
    const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing.");
    }

    const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "Analysoi kuluja.";

    const systemPrompt = `Olet "AI Life Operator", armoton mutta sivistynyt säästöarkkitehti ja talousvisionääri.
ÄLÄ KOSKAAN vastaa geneerisesti. Sinun on annettava syvällinen, analyyttinen ja jopa provosoiva katsaus käyttäjän talouteen.

LÄHDE: ${isEmailAudit ? 'SÄHKÖPOSTIAUDITOINTI (Inbox Sync)' : 'MANUAALINEN SYÖTE'}

TEHTÄVÄSI:
1. RADIKAALI AUDITOINTI: Haasta jokainen euro. Jos kyseessä on sähköpostitieto, etsi tilausvahvistuksia, uusiutumisilmoituksia ja piilomaksuja.
2. BRIEFING (Summary): Kirjoita älykäs ja tiivistetty katsaus havaintoihisi. Käytä ammattimaista termistöä (esim. "likviditeetin vuoto", "pääoman optimointi").
3. STRATEGIA: Kirjoita konkreettinen suunnitelma. Jos kyseessä on sähköpostiauditointi, huomioi erityisesti toistuvat laskutusjaksot.
4. MARKKINATIETO: Vertaa hintoja Suomen markkinatasoon (liittymät, suoratoisto, sähkö).

KÄYTTÄJÄN HISTORIA JA MUISTI:
${JSON.stringify(input.userMemory || {})}

PALAUTA AINA AnalyzeFinancialDocumentOutput-SKEEMAN MUKAINEN JSON.
KAIKKI VASTAUKSET ON OLTAVA SUOMEKSI.`;

    const userContent: any[] = [];
    if (hasImage) {
      userContent.push({ type: 'text', text: 'Analysoi tämä kuva tarkasti ja haasta kaikki siinä näkyvät kulut.' });
      userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
    } else {
      userContent.push({ type: 'text', text: isEmailAudit ? `Analysoi seuraavat sähköpostitiedot ja etsi säästökohteita:\n\n${input.documentText}` : latestUserMessage });
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
      let jsonString = rawContent.trim();
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
      }

      const parsed = JSON.parse(jsonString);

      return {
        title: parsed.title || (isEmailAudit ? "Sähköpostien Älykäs Auditointi" : "Strateginen Operatiivinen Katsaus"),
        summary: parsed.summary || "Analyysi valmistui, mutta malli ei tuottanut yhteenvetoa.",
        strategy: parsed.strategy || "Suosittelen välitöntä kulukartoitusta ja karsintaa.",
        mode: parsed.mode || 'advisor',
        isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
        detectedItems: parsed.detectedItems || [],
        savingsEstimate: parsed.savingsEstimate || 0,
        beforeAfterComparison: parsed.beforeAfterComparison || {
          currentSituation: "Talous sisältää hallitsemattomia kulueriä.",
          optimizedSituation: "Likviditeetti on maksimoitu ja turhat kulut eliminoitu."
        },
        memoryUpdates: parsed.memoryUpdates
      };
    } catch (error: any) {
      console.error('Groq Error:', error);
      throw error;
    }
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
