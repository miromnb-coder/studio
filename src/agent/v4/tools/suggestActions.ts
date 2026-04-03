import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1)
});

const outputSchema = z.object({
  actions: z.string()
});

export const suggestActionsTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'suggest_actions',
  description: 'Generate concrete, actionable next steps for the user.',
  inputSchema,
  outputSchema,
  execute: async ({ input }) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Generate concrete, actionable next steps.' },
        { role: 'user', content: input }
      ],
      temperature: 0.2
    });

    return { actions: res.choices[0]?.message?.content || '' };
  }
};
