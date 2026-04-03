import { groq } from '@/ai/groq';
import { AgentContext, ToolCallPayload } from './types';

/**
 * @fileOverview Streaming Response Generator Agent v4.2.
 * Strictly produces the final answer based on context and tools.
 */

const isValidToolCall = (value: any): value is ToolCallPayload => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof value.tool === 'string' &&
    typeof value.action === 'string' &&
    typeof value.input === 'string'
  );
};

export async function generateToolCallResponse(context: AgentContext): Promise<ToolCallPayload> {
  const systemPrompt = `
    You are Agent v4.2 within the Operator system.

    MODE: tool_call
    Return ONLY a valid JSON object (no markdown, no prose) in this exact shape:
    {"tool":"...","action":"...","input":"..."}

    RULES:
    - Respond in ${context.language}.
    - Keep values concise and actionable.
    - Base your output ONLY on the provided context.
    - Never include extra keys or text.

    CONTEXT:
    Intent: ${context.intent}
    Memory: ${JSON.stringify(context.memory || {})}
    Plan: ${JSON.stringify(context.plan)}
  `;

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...context.history.slice(-10),
      { role: 'user', content: context.input }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
  });

  const raw = response.choices[0]?.message?.content || '{}';
  const parsed = JSON.parse(raw);

  if (!isValidToolCall(parsed)) {
    throw new Error('Invalid tool_call response format from generator.');
  }

  return parsed;
}

export async function generateStreamResponse(context: AgentContext) {
  const systemPrompt = `
    You are Agent v4.2 within the Operator system.

    MODE: final_answer
    
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
