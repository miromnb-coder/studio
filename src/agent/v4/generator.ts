import { groq } from '@/ai/groq';
import { AgentContext } from './types';

/**
 * @fileOverview Streaming Response Generator Agent.
 */

export async function generateStreamResponse(context: AgentContext) {
  console.log("[GENERATOR] Initializing stream...");
  const prompt = `
    User Input: ${context.input}
    Language: ${context.language}
    Intent: ${context.intent}
    Tool Outputs: ${JSON.stringify(context.toolResults)}
    Memory: ${JSON.stringify(context.memory || {})}
    Critic Feedback: ${JSON.stringify(context.criticFeedback || {})}

    Objective: Provide a clear, actionable, and grounded response in ${context.language}.
    
    Structure your response naturally. If the intent is finance, include estimated savings. 
    If the intent is technical, provide implementation steps.
    
    NEVER explain that you are an AI or using tools. Be the Operator.
  `;

  return groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: 'You are the AI Life Operator v4.2. Speak directly and efficiently.' },
      ...context.history.slice(-5),
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    stream: true,
  });
}
