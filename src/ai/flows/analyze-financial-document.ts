
'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models directly.
 * Standard async function replacing Genkit flows.
 */

import { groq } from '@/ai/groq';

export interface AnalyzeFinancialDocumentInput {
  imageDataUri?: string;
  documentText?: string;
  history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userMemory?: any;
  source?: string;
}

export interface AnalyzeFinancialDocumentOutput {
  title: string;
  summary: string;
  strategy: string;
  mode: 'alert' | 'advisor' | 'analyst' | 'planner' | 'executor' | 'reminder';
  detectedItems?: Array<{
    title: string;
    summary: string;
    type: 'subscription' | 'recurring_charge' | 'hidden_fee' | 'trial_ending' | 'price_increase' | 'unusual_spending' | 'savings_opportunity' | 'duplicate_charge';
    estimatedSavings: number;
    alternativeSuggestion?: string;
    urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
    copyableMessage: string;
  }>;
  savingsEstimate?: number;
  beforeAfterComparison?: {
    currentSituation: string;
    optimizedSituation: string;
  };
  isActionable: boolean;
  memoryUpdates?: any;
}

/**
 * Analysoi taloudellisen dokumentin tai viestin Groq-mallilla.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
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
1. RADIKAALI AUDITOINTI: Haasta jokainen euro. Etsi kalliita tilauksia, piilomaksuja ja säästökohteita.
2. BRIEFING (Summary): Kirjoita älykäs katsaus havaintoihisi.
3. STRATEGIA: Kirjoita konkreettinen suunnitelma (esim. "Irtisano X", "Vaihda Y").
4. DETECTED ITEMS: Listaa jokainen havaittu kulu tai säästökohde tarkasti.

PALAUTA VASTAUS TIUKASTI JSON-MUODOSSA, JOKA NOUDATTAA TÄTÄ RAKENNETTA:
{
  "title": "Analyysin otsikko",
  "summary": "Syvällinen yhteenveto suomeksi",
  "strategy": "Konkreettinen toimintasuunnitelma",
  "mode": "advisor|alert|analyst|planner|executor",
  "detectedItems": [
    {
      "title": "Kohteen nimi",
      "summary": "Miksi tämä on kallis/turha",
      "type": "subscription|recurring_charge|...",
      "estimatedSavings": 12.50,
      "urgencyLevel": "low|medium|high|urgent",
      "copyableMessage": "Peruutusviesti/neuvotteluviesti suomeksi",
      "alternativeSuggestion": "Halvempi vaihtoehto"
    }
  ],
  "savingsEstimate": 45.00,
  "beforeAfterComparison": {
    "currentSituation": "Nykyinen kallis tila",
    "optimizedSituation": "Säästetty ja optimoitu tila"
  },
  "isActionable": true,
  "memoryUpdates": {}
}

KAIKKI VASTAUKSET ON OLTAVA SUOMEKSI.`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ type: 'text', text: 'Analysoi tämä kuva tarkasti ja haasta kaikki siinä näkyvät kulut.' });
    userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
  } else {
    userContent.push({ type: 'text', text: `KÄYTTÄJÄN VIESTI/DATA:\n${latestUserMessage}\n\nUSER MEMORY:\n${JSON.stringify(input.userMemory || {})}` });
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
      title: parsed.title || "Strateginen Operatiivinen Katsaus",
      summary: parsed.summary || "Analyysi valmistui, mutta malli ei tuottanut yhteenvetoa.",
      strategy: parsed.strategy || "Suosittelen välitöntä kulukartoitusta.",
      mode: parsed.mode || 'advisor',
      isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || {
        currentSituation: "Talous sisältää optimoimattomia kulueriä.",
        optimizedSituation: "Likviditeetti on maksimoitu."
      },
      memoryUpdates: parsed.memoryUpdates
    };
  } catch (error: any) {
    console.error('Groq Analysis Error:', error);
    throw error;
  }
}
