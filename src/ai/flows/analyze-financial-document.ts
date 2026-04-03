
'use server';
/**
 * @fileOverview AI Life Operator analysis engine using Groq models directly.
 * Standard async function replacing Genkit flows with intelligent persona switching.
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
 * Analysoi syötteen Groq-mallilla käyttäen kontekstuaalista persoonallisuutta.
 */
export async function analyzeFinancialDocument(input: AnalyzeFinancialDocumentInput): Promise<AnalyzeFinancialDocumentOutput> {
  const hasImage = !!input.imageDataUri;
  const modelId = hasImage ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing from environment.");
  }

  const latestUserMessage = input.history?.slice(-1)[0]?.content || input.documentText || "Analysoi tilanne.";

  const systemPrompt = `Olet "AI Life Operator", älykäs ja mukautuva tekoälyavustaja.

KÄYTTÄYTYMISSÄÄNNÖT:
1. RAHA JA TALOUS: Jos käyttäjän viesti liittyy rahaan, säästöihin, tilauksiin tai kuluihin:
   - Ole "Elite Auditor": armoton mutta sivistynyt säästöarkkitehti.
   - Vastaa LYHYESTI, SELKEÄSTI ja KÄYTÄNNÖLLISESTI.
   - Etsi säästökohteita ja haasta kuluja.

2. MUUT AIHEET: Jos viesti ei liity rahaan tai talouteen:
   - Ole "Sivistynyt Avustaja": vastaa yleisemmin ja selitä asioita syvällisemmin.
   - ÄLÄ pakota rahateemaa tai säästöjä vastaukseen.
   - Ole keskusteleva ja avoin.

3. EPÄSELVÄ AIHE: Jos et ole varma mitä käyttäjä tarkoittaa:
   - Kysy YKSI tarkentava kysymys ennen kuin teet analyysia. Laita tämä kysymys "summary"-kenttään.

VASTAUKSEN MUOTO:
Palauta vastaus AINA tiukasti JSON-muodossa:
{
  "title": "Lyhyt otsikko aiheesta",
  "summary": "Päävastaus tai tarkentava kysymys suomeksi",
  "strategy": "Toimintasuunnitelma tai neuvon ydin",
  "mode": "advisor|alert|analyst|planner|executor",
  "detectedItems": [], // Täytä vain talousaiheissa
  "savingsEstimate": 0, // Täytä vain talousaiheissa
  "beforeAfterComparison": null,
  "isActionable": true,
  "memoryUpdates": {}
}

KAIKKI VASTAUKSET ON OLTAVA SUOMEKSI.`;

  const userContent: any[] = [];
  if (hasImage) {
    userContent.push({ type: 'text', text: 'Analysoi tämä kuva tarkasti.' });
    userContent.push({ type: 'image_url', image_url: { url: input.imageDataUri } });
  } else {
    userContent.push({ type: 'text', text: `KÄYTTÄJÄN VIESTI:\n${latestUserMessage}\n\nHISTORIA:\n${JSON.stringify(input.history || [])}` });
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
    const parsed = JSON.parse(rawContent);

    return {
      title: parsed.title || "Järjestelmän analyysi",
      summary: parsed.summary || "Vastaus valmistui.",
      strategy: parsed.strategy || "Jatka kommunikointia.",
      mode: parsed.mode || 'advisor',
      isActionable: !!(parsed.detectedItems && parsed.detectedItems.length > 0),
      detectedItems: parsed.detectedItems || [],
      savingsEstimate: parsed.savingsEstimate || 0,
      beforeAfterComparison: parsed.beforeAfterComparison || null,
      memoryUpdates: parsed.memoryUpdates || {}
    };
  } catch (error: any) {
    console.error('Groq Execution Error:', error);
    throw error;
  }
}
