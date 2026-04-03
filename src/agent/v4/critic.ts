
import { groq } from '@/ai/groq';
import { CriticFeedback } from './types';

/**
 * @fileOverview Critic Agent: Evaluates the draft response for grounding and quality.
 */

export async function evaluateResponse(input: string, response: any): Promise<CriticFeedback> {
  const prompt = `
    Evaluate the following AI response against user input.
    Check for: Hallucinations, grounding, conciseness, and actionability.
    
    Response: ${JSON.stringify(response)}
    Input: ${input}

    Return ONLY JSON: {"score": 0-10, "issues": [], "needs_revision": boolean}
  `;

  try {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
    });
    
    return JSON.parse(res.choices[0]?.message?.content || '{"score": 10, "issues": [], "needs_revision": false}');
  } catch (err) {
    return { score: 10, issues: [], needs_revision: false };
  }
}
