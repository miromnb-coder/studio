import { groq } from '@/ai/groq';
import { AgentContext } from './types';

/**
 * @fileOverview Streaming Response Generator Agent v4.2.
 * Strictly produces the final answer based on context and tools.
 */

export async function generateStreamResponse(context: AgentContext) {
  const systemPrompt = `
    You are Agent v4.2 within the Operator system.
    
    RULES:
    - Respond in ${context.language}.
    - Be concise and precise.
    - Base your response ONLY on the provided context, tool results, and memory.
    - Do NOT include internal reasoning or plan details.
    - Do NOT hallucinate.
    - If tools failed, state clearly that information is unavailable.

    CONTEXT:
    Intent: ${context.intent}
    Memory: ${JSON.stringify(context.memory || {})}
    Tool Outputs: ${JSON.stringify(context.toolResults)}
    Critic Evaluation: ${JSON.stringify(context.criticFeedback || {})}
  `;

  return groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...context.history.slice(-10),
      { role: 'user', content: context.input }
    ],
    temperature: 0.1, // Low temperature for high precision
    stream: true,
  });
}
