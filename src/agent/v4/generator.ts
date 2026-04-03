
import { groq } from '@/ai/groq';
import { AgentContext } from './types';

/**
 * @fileOverview Response Generator Agent: Produces the final structured answer.
 */

export async function generateResponse(context: AgentContext, attempt = 1): Promise<any> {
  const prompt = `
    User Input: ${context.input}
    Language: ${context.language}
    Intent: ${context.intent}
    Tool Outputs: ${JSON.stringify(context.toolResults)}
    Memory: ${JSON.stringify(context.memory || {})}
    Critic Feedback (Attempt ${attempt}): ${JSON.stringify(context.criticFeedback || {})}

    Objective: Provide a clear, actionable, and grounded response in ${context.language}.
    
    Return ONLY JSON:
    {
      "summary": "Main message",
      "strategy": "Plan/Advice",
      "title": "Header",
      "mode": "${context.intent}",
      "isActionable": true,
      "data": {}
    }
  `;

  const res = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are the AI Life Operator v4.1.' },
      ...context.history.slice(-5),
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.2,
  });

  return JSON.parse(res.choices[0]?.message?.content || '{}');
}
