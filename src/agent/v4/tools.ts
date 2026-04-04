import { groq } from '@/ai/groq';
import { runCalendarTool } from '@/agent/integrations/calendar';
import { runTodoTool } from '@/agent/integrations/todo';
import { runNotesTool } from '@/agent/integrations/notes';
import { runWebSearchTool } from '@/agent/integrations/web-search';
import { runFileAnalyzerTool } from '@/agent/integrations/file-analyzer';
import { AgentStep, ToolEnvelope, ToolResult } from './types';
import { mapToolError } from '@/agent/integrations/common';

/**
 * @fileOverview Tool Execution Agent: Runs specialized logic modules.
 */

type LegacyToolHandler = (input: string, imageUri?: string) => Promise<ToolEnvelope<unknown>>;

const legacyTools: Record<string, LegacyToolHandler> = {
  analyze: async (input: string, imageUri?: string) => {
    try {
      const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
      const res = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Extract key structural details and objective insights.' },
          {
            role: 'user',
            content: imageUri
              ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }]
              : input,
          },
        ],
        temperature: 0,
      });
      return { ok: true, data: { insights: res.choices[0]?.message?.content || '' }, error: null };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Analyze execution failed.') };
    }
  },

  detect_leaks: async (input: string) => {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Scan for subscriptions, hidden fees, and trial expiration patterns. Return JSON: {"leaks": [], "estimatedMonthlySavings": 0}',
          },
          { role: 'user', content: input },
        ],
        response_format: { type: 'json_object' },
        temperature: 0,
      });
      return {
        ok: true,
        data: JSON.parse(res.choices[0]?.message?.content || '{"leaks": [], "estimatedMonthlySavings": 0}'),
        error: null,
      };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Leak detection execution failed.') };
    }
  },

  optimize_time: async (input: string) => {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest removal, movement, or combination.' },
          { role: 'user', content: input },
        ],
        temperature: 0.1,
      });
      return { ok: true, data: { timeAudit: res.choices[0]?.message?.content || '' }, error: null };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Time optimization execution failed.') };
    }
  },

  generate_strategy: async (input: string) => {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Develop actionable business or personal growth strategies. Focus on revenue and efficiency.',
          },
          { role: 'user', content: input },
        ],
        temperature: 0.1,
      });
      return { ok: true, data: { strategy: res.choices[0]?.message?.content || '' }, error: null };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Strategy generation execution failed.') };
    }
  },

  technical_debug: async (input: string) => {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Audit technical logic and suggest precise implementation fixes.' },
          { role: 'user', content: input },
        ],
        temperature: 0,
      });
      return { ok: true, data: { technicalAudit: res.choices[0]?.message?.content || '' }, error: null };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Technical debug execution failed.') };
    }
  },

  suggest_actions: async (input: string) => {
    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Generate concrete, actionable next steps.' },
          { role: 'user', content: input },
        ],
        temperature: 0.2,
      });
      return { ok: true, data: { actions: res.choices[0]?.message?.content || '' }, error: null };
    } catch (error) {
      return { ok: false, data: null, error: mapToolError(error, 'Action suggestion execution failed.') };
    }
  },
};

async function dispatchTool(step: AgentStep, input: string, imageUri?: string): Promise<ToolEnvelope<unknown>> {
  switch (step.action) {
    case 'calendar':
      return runCalendarTool({ instruction: input });
    case 'todo':
      return runTodoTool({ instruction: input });
    case 'notes':
      return runNotesTool({ instruction: input });
    case 'web-search':
      return runWebSearchTool({ query: input, maxResults: 5 });
    case 'file-analyzer':
      return runFileAnalyzerTool({ instruction: input });
    default: {
      const tool = legacyTools[step.action];
      if (!tool) {
        return {
          ok: false,
          data: null,
          error: {
            code: 'NOT_FOUND',
            message: `No tool registered for action: ${step.action}`,
            retriable: false,
          },
        };
      }
      return tool(input, imageUri);
    }
  }
}

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log('[TOOLS] Executing tools...');

  const results: ToolResult[] = [];
  for (const step of plan) {
    const output = await dispatchTool(step, input, imageUri);
    results.push({ action: step.action, output, error: output.error?.message });
  }

  return results;
}
