import { z } from 'zod';
import { groq } from '@/ai/groq';
import { ToolDefinition } from '../types';

const inputSchema = z.object({
  input: z.string().min(1),
  imageUri: z.string().url().optional()
});

const outputSchema = z.object({
  insights: z.string()
});

export const analyzeTool: ToolDefinition<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>> = {
  name: 'analyze',
  description: 'Extract key structural details and objective insights from text and optional images.',
  inputSchema,
  outputSchema,
  execute: async ({ input, imageUri }) => {
    const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    const res = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Extract key structural details and objective insights.' },
        { role: 'user', content: imageUri ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }] : input }
      ],
      temperature: 0
    });

    return { insights: res.choices[0]?.message?.content || '' };
  }
};
