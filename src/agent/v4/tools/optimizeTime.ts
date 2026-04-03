import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1)
});

const outputSchema = z.object({
  timeAudit: z.string()
});

export const optimizeTimeTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'optimize_time',
  description: 'Identify schedule friction and low-value tasks for optimization.',
  inputSchema,
  outputSchema,
  execute: async ({ input }) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest removal, movement, or combination.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });

    return { timeAudit: res.choices[0]?.message?.content || '' };
  }
};
