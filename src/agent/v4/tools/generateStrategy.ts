import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1)
});

const outputSchema = z.object({
  strategy: z.string()
});

export const generateStrategyTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'generate_strategy',
  description: 'Develop actionable business or personal growth strategies.',
  inputSchema,
  outputSchema,
  execute: async ({ input }) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Develop actionable business or personal growth strategies. Focus on revenue and efficiency.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });

    return { strategy: res.choices[0]?.message?.content || '' };
  }
};
