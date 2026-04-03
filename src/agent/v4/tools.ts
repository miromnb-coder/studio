import { groq } from '@/ai/groq';
import { AgentStep, ToolResult } from './types';
import { z } from 'zod';

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
        { role: 'system', content: 'Identify schedule friction and low-value tasks. Suggest removal, movement, or combination.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { timeAudit: res.choices[0]?.message?.content || '' };
  },

  generate_strategy: async (input: string) => {
    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Develop actionable business or personal growth strategies. Focus on revenue and efficiency.' },
        { role: 'user', content: input }
      ],
      temperature: 0.1
    });
    return { strategy: res.choices[0]?.message?.content || '' };
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

const toolOutputSchemas = {
  analyze: z.object({ insights: z.string() }),
  detect_leaks: z.object({
    leaks: z.array(z.any()),
    estimatedMonthlySavings: z.number()
  }),
  optimize_time: z.object({ timeAudit: z.string() }),
  generate_strategy: z.object({ strategy: z.string() }),
  technical_debug: z.object({ technicalAudit: z.string() }),
  suggest_actions: z.object({ actions: z.string() })
} satisfies Record<keyof typeof tools, z.ZodTypeAny>;

const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 350;

function classifyToolError(err: unknown, isValidationError = false): ToolResult['errorType'] {
  if (isValidationError) {
    return 'invalid_output';
  }
  const message = err instanceof Error ? err.message.toLowerCase() : '';
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('etimedout') ||
    message.includes('abort')
  ) {
    return 'timeout';
  }
  return 'execution_failed';
}

function backoffWait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log("[TOOLS] Executing tools...");
  const results: ToolResult[] = [];
  for (const step of plan) {
    const tool = tools[step.action as keyof typeof tools];
    if (!tool) {
      results.push({
        action: step.action,
        output: null,
        error: `Unknown action: ${step.action}`,
        errorType: 'unknown_action',
        retry: { attempts: 1, maxRetries: MAX_RETRIES, backoffMs: [] }
      });
      continue;
    }

    const schema = toolOutputSchemas[step.action as keyof typeof toolOutputSchemas];
    const backoffMs: number[] = [];
    let attempts = 0;
    let lastError = 'Execution failed.';
    let lastErrorType: ToolResult['errorType'] = 'execution_failed';

    while (attempts <= MAX_RETRIES) {
      attempts += 1;
      try {
        const rawResult = await tool(input, imageUri);
        const validatedResult = schema.safeParse(rawResult);
        if (!validatedResult.success) {
          throw new Error(`Schema validation failed: ${validatedResult.error.issues.map((i) => i.message).join('; ')}`);
        }
        results.push({
          action: step.action,
          output: validatedResult.data,
          retry: { attempts, maxRetries: MAX_RETRIES, backoffMs }
        });
        break;
      } catch (err) {
        const isValidationError = err instanceof Error && err.message.toLowerCase().includes('schema validation failed');
        lastErrorType = classifyToolError(err, isValidationError);
        lastError = err instanceof Error ? err.message : 'Execution failed.';

        if (attempts > MAX_RETRIES) {
          results.push({
            action: step.action,
            output: null,
            error: lastError,
            errorType: lastErrorType,
            retry: { attempts, maxRetries: MAX_RETRIES, backoffMs }
          });
          break;
        }

        const delay = BASE_BACKOFF_MS * Math.pow(2, attempts - 1);
        backoffMs.push(delay);
        await backoffWait(delay);
      }
    }
  }
  return results;
}
