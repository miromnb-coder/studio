import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1)
});

const outputSchema = z.object({
  technicalAudit: z.string()
});

export const technicalDebugTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'technical_debug',
  description: 'Audit technical logic and suggest precise implementation fixes.',
  inputSchema,
  outputSchema,
  execute: async ({ input }) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Audit technical logic and suggest precise implementation fixes.' },
        { role: 'user', content: input }
      ],
      temperature: 0
    });

    return { technicalAudit: res.choices[0]?.message?.content || '' };
  }
};
