import { groq } from '@/ai/groq';
import { AgentStep, MonetizationReport, TimeOptimizationReport, ToolResult } from './types';

/**
 * @fileOverview Tool Execution Agent: Runs specialized logic modules.
 */

const tools = {
  analyze: async (input: string, imageUri?: string) => {
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
  },

  detect_leaks: async (input: string) => {
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
  },

  optimize_time: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Identify schedule friction and low-value tasks. Return JSON: {"remove":[],"optimize":[],"automate":[],"estimatedTimeSavings":"0h/week"}'
        },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });
    const fallback: TimeOptimizationReport = {
      remove: [],
      optimize: [],
      automate: [],
      estimatedTimeSavings: '0h/week'
    };
    return parseJSON<TimeOptimizationReport>(res.choices[0]?.message?.content, fallback);
  },

  generate_strategy: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Develop monetization strategy. Return JSON: {"revenueOpportunities":[],"inefficiencies":[],"actionPlan":[],"expectedImpact":""}'
        },
        { role: 'user', content: input }
      ],
      response_format: { type: 'json_object' },
      temperature: 0
    });
    const fallback: MonetizationReport = {
      revenueOpportunities: [],
      inefficiencies: [],
      actionPlan: [],
      expectedImpact: ''
    };
    return parseJSON<MonetizationReport>(res.choices[0]?.message?.content, fallback);
  },

  technical_debug: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Audit technical logic and suggest precise implementation fixes.' },
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
        { role: 'system', content: 'Generate concrete, actionable next steps.' },
        { role: 'user', content: input }
      ],
      temperature: 0.2
    });
    return { actions: res.choices[0]?.message?.content || '' };
  }
};

function parseJSON<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log("[TOOLS] Executing tools...");
  const results: ToolResult[] = [];
  for (const step of plan) {
    const tool = tools[step.action as keyof typeof tools];
    if (tool) {
      try {
        const result = await tool(input, imageUri);
        results.push({ action: step.action, output: result });
      } catch (err) {
        results.push({ action: step.action, output: null, error: "Execution failed." });
      }
    }
  }
  return results;
}
