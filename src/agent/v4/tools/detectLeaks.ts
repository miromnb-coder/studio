import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1)
});

const outputSchema = z.object({
  leaks: z.array(z.any()),
  estimatedMonthlySavings: z.number()
});

export const detectLeaksTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'detect_leaks',
  description: 'Scan user data for subscriptions, hidden fees, and trial expiration patterns.',
  inputSchema,
  outputSchema,
  execute: async ({ input }) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Scan for subscriptions, hidden fees, and trial expiration patterns. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}' },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });

    return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}');
  }
};
