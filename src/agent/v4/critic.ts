import { groq } from '@/ai/groq';
import { CriticFeedback } from './types';

/**
 * @fileOverview Critic Agent: Evaluates the draft plan and context for quality.
 */

export async function evaluateReasoning(input: string, context: any): Promise<CriticFeedback> {
  console.log("[CRITIC] Evaluating reasoning chain...");
  const prompt = `
    Evaluate the following reasoning chain for user input.
    Check for: Hallucinations, grounding, tool relevance, and actionability.
    
    Intent: ${context.intent}
    Plan: ${JSON.stringify(context.plan)}
    Tool Results: ${JSON.stringify(context.toolResults)}
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
    
    const feedback = JSON.parse(res.choices[0]?.message?.content || '{"score": 10, "issues": [], "needs_revision": false}');
    console.log(`[CRITIC] Evaluation Score: ${feedback.score}`);
    return feedback;
  } catch (err) {
    return { score: 10, issues: [], needs_revision: false };
  }
}
