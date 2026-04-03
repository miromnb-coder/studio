'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models.
 * Optimized for deep financial intelligence and actionable insights.
 */

import { ai } from '@/ai/genkit';
import { groq } from '@/ai/groq';
import { z } from 'genkit';

const DetectedItemSchema = z.object({
  title: z.string().describe('Palvelun tai kategorian nimi (esim. Netflix, Palvelumaksu).'),
  summary: z.string().describe('Analyysi siitä, miksi tämä on huomioitava löydös.'),
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
  estimatedSavings: z.number().describe('Arvioitu kuukausittainen säästö euroina.'),
  alternativeSuggestion: z.string().optional().describe('Ehdotus edullisemmasta vaihtoehdosta.'),
  urgencyLevel: z.enum(['low', 'medium', 'high', 'urgent']),
  copyableMessage: z.string().describe('Valmis viestipohja peruutukseen tai neuvotteluun.'),
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
    const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    
    if (!process.env.GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is missing.");
    }

    const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "Analysoi kuluja.";

    const systemPrompt = `Olet "AI Life Operator", huipputason talousälyagentti. 
Tehtäväsi on toimia käyttäjän henkilökohtaisena talousarkkitehtina ja etsiä jokainen mahdollinen säästökohde.

ANALYYSIPROTOKOLLA:
1. TUNNISTUS: Etsi tilausmaksuja, toistuvia kuluja, piilomaksuja ja hinnan korotuksia.
2. KRITIIKKI: Ole kriittinen. Jos näet kalliin palvelun, etsi sille halvempi vaihtoehto.
3. TOIMINTA: Luo jokaiselle löydökselle 'copyableMessage', joka on kohtelias mutta jämäkkä peruutus- tai neuvotteluviesti suomeksi.
4. VERTAILU: Täytä 'beforeAfterComparison' näyttääksesi, miten käyttäjän tilanne paranee suosituksillasi.
5. KIELI: Anna kaikki tekstivastaukset (title, summary, strategy) suomeksi.

LÖYDÖSTEN TYYPIT:
- 'subscription': Netflix, Spotify, kuntosali jne.
- 'hidden_fee': Pankkimaksut, käsittelykulut.
- 'savings_opportunity': Ehdota kilpailutusta (esim. sähkö, vakuutus).

PALAUTA AINA PUHDAS JSON-OBJEKTI AnalyzeFinancialDocumentOutput-SKEEMAN MUKAISESTI.

KÄYTTÄJÄN INTENTTI:
"${latestUserMessage}"

HISTORIA:
${JSON.stringify(input.history?.slice(-5) || [])}
`;

    const userContent: any[] = [];
    if (hasImage) {
      userContent.push({ type: 'text', text: 'Analysoi tämä kuva ja etsi taloudellisia mahdollisuuksia.' });
      userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
    } else {
      userContent.push({ type: 'text', text: latestUserMessage });
    }

    try {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      
      let jsonString = rawContent.trim();
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
      }

      const parsed = JSON.parse(jsonString);

      return {
        title: parsed.title || "Talousanalyysi",
        summary: parsed.summary || "Analyysi valmistui, mutta tarkempia löydöksiä ei tehty.",
        strategy: parsed.strategy || 'direct_answer',
        mode: parsed.mode || 'advisor',
        isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
        detectedItems: parsed.detectedItems || [],
        savingsEstimate: parsed.savingsEstimate || 0,
        beforeAfterComparison: parsed.beforeAfterComparison,
        memoryUpdates: parsed.memoryUpdates
      };
    } catch (error: any) {
      console.error('Groq Execution Error:', error);
      throw error;
    }
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
