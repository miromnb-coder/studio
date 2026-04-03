import { groq } from '@/ai/groq';
import { Intent } from './types';

/**
 * @fileOverview Intent Router Agent: Classifies intent and detects language.
 */

export async function routeIntent(input: string, history: any[]): Promise<{ intent: Intent; language: string }> {
  console.log("[ROUTER] Analyzing intent...");
  const prompt = `
    Analyze user input and history.
    1. Detect language (e.g., Finnish, English).
    2. Classify intent: finance, time_optimizer, monetization, technical, analysis, general.
    
    Return ONLY JSON: {"intent": "...", "language": "..."}
  `;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt },
        ...history.slice(-3),
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    
    const content = JSON.parse(res.choices[0]?.message?.content || '{}');
    const intent = (content.intent as Intent) || 'general';
    const language = content.language || 'English';
    console.log(`[ROUTER] Detected Intent: ${intent}, Language: ${language}`);
    return { intent, language };
  } catch (err) {
    return { intent: 'general', language: 'English' };
  }
}
