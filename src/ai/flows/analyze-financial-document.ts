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
      console.error("CRITICAL: GROQ_API_KEY is missing from environment.");
      throw new Error("GROQ_API_KEY is missing.");
    }

    const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "Analysoi kuluja.";

    const systemPrompt = `Olet "AI Life Operator", maailmanluokan talousanalyytikko ja armoton säästöarkkitehti. 
Tehtäväsi on toimia käyttäjän edunvalvojana ja löytää jokainen sentti, joka valuu turhaan yritysten taskuihin.

PROSESSI:
1. RADIKAALI ANALYYSI: Älä vain listaa kuluja. Haasta ne. Onko käyttäjällä useita suoratoistopalveluita? Onko sähkösopimus kallis? Näkyykö piilokuluja?
2. MARKKINATIETO: Käytä sisäistä tietoasi yleisistä hinnoista (esim. Netflix, Spotify, kuntosalit, sähkönsiirto). Jos näet hinnan, joka on yli markkinatason, merkitse se 'savings_opportunity'.
3. STRATEGIA: Kirjoita 'strategy'-kenttään vähintään 3 lausetta pitkä, strateginen suunnitelma siitä, miten käyttäjä voi optimoida taloutensa seuraavan 3 kuukauden aikana.
4. TOIMINTA: Luo jokaiselle löydökselle 'copyableMessage', joka on niin vakuuttava, että yrityksen on pakko antaa alennusta tai hyväksyä peruutus.
5. VERTAILU: Maalaa visio 'beforeAfterComparison'-kentässä: näytä nykyinen "vuotava" tilanne vs. optimoitu "rahavirrat hallussa" -tilanne.

KIELI: Vastaa AINA suomeksi, mutta käytä ammattimaista ja jämäkkää termistöä.

PALAUTA AINA PUHDAS JSON-OBJEKTI AnalyzeFinancialDocumentOutput-SKEEMAN MUKAISESTI.

KÄYTTÄJÄN TILANNE JA TOIVE:
"${latestUserMessage}"

HISTORIA:
${JSON.stringify(input.history?.slice(-5) || [])}
`;

    const userContent: any[] = [];
    if (hasImage) {
      userContent.push({ type: 'text', text: 'Analysoi tämä kuva tarkasti. Etsi tilausmaksuja, toistuvia kuluja ja mahdollisia säästökohteita. Ole erittäin tarkka summien ja palveluiden nimien kanssa.' });
      userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
    } else {
      userContent.push({ type: 'text', text: latestUserMessage });
    }

    try {
      console.log(`Calling Groq with model ${modelId}...`);
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1, // Alhaisempi lämpötila takaa loogisemmat talousvastaukset
      });

      const rawContent = completion.choices[0]?.message?.content || '{}';
      console.log("Raw content received from Groq.");
      
      let jsonString = rawContent.trim();
      if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```json\s*|```$/g, '').trim();
      }

      const parsed = JSON.parse(jsonString);

      return {
        title: parsed.title || "Strateginen Talousanalyysi",
        summary: parsed.summary || "Analyysi suoritettu. Tarkista löydetyt säästömahdollisuudet alta.",
        strategy: parsed.strategy || "Suosittelen aloittamaan karsimalla päällekkäiset palvelut ja kilpailuttamalla säännölliset sopimukset välittömästi.",
        mode: parsed.mode || 'advisor',
        isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
        detectedItems: parsed.detectedItems || [],
        savingsEstimate: parsed.savingsEstimate || 0,
        beforeAfterComparison: parsed.beforeAfterComparison || {
          currentSituation: "Talous sisältää useita optimoimattomia kuluja ja päällekkäisiä sopimuksia.",
          optimizedSituation: "Kaikki turha on karsittu ja rahavirrat on ohjattu säästöön tai sijoituksiin."
        },
        memoryUpdates: parsed.memoryUpdates
      };
    } catch (error: any) {
      console.error('Groq Execution Error:', error.message);
      throw error;
    }
  }
);

export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  return analyzeFinancialDocumentFlow(input);
}
