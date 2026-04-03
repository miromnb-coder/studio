import { groq } from '@/ai/groq';
import { AgentStep } from './v4/types';

/**
 * @fileOverview Modular Tools for the AI Agent v3.
 * Tools perform specialized extraction and reasoning.
 */

export const tools = {
  analyze: async (input: string, imageUri?: string) => {
    const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    const res = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: 'Extract key insights and structural details from the input.' },
        { role: 'user', content: imageUri ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }] : input }
      ],
      temperature: 0
    });
    return { insights: res.choices[0]?.message?.content || '' };
  },

  detect_leaks: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Scan for subscriptions, recurring payments, hidden fees, and trial expiration patterns. Return JSON: {"leaks": [], "totalSavings": 0}' },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });
    return JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "totalSavings": 0}');
  },

  optimize_time: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest what to remove, combine, or automate.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { timeAudit: res.choices[0]?.message?.content || '' };
  },

  monetization_audit: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Analyze revenue expansion, pricing strategies, and offer creation opportunities.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { monetizationStrategy: res.choices[0]?.message?.content || '' };
  },

  technical_debug: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Perform implementation audit. Identify logic errors and suggest precise code fixes.' },
        { role: 'user', content: input }
      ],
      temperature: 0
    });
    return { technicalAudit: res.choices[0]?.message?.content || '' };
  },

  suggest_actions: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Provide concrete, copyable next steps for the user.' },
        { role: 'user', content: input }
      ],
      temperature: 0.2
    });
    return { actions: res.choices[0]?.message?.content || '' };
  }
};

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string) {
  const results: Array<{ action: string; output?: any; error?: string }> = [];
  for (const step of plan) {
    const tool = tools[step.action as keyof typeof tools];
    if (tool) {
      try {
        const result = await tool(input, imageUri);
        results.push({ action: step.action, output: result });
      } catch (err) {
        console.error(`Tool Execution Error (${step.action}):`, err);
        results.push({ action: step.action, error: "Tool execution failed." });
      }
    }
  }
  return results;
}
