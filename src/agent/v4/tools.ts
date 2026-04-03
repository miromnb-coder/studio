import { groq } from '@/ai/groq';
import { AgentStep, ToolExecutionError, ToolResult } from './types';

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

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 2,
  initialDelayMs: 300,
  backoffMultiplier: 2,
  maxDelayMs: 3000
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorCode(error: unknown): string {
  const status = (error as any)?.status;
  const code = (error as any)?.code;
  if (code) return String(code).toUpperCase();
  if (status) return `HTTP_${status}`;
  return 'TOOL_EXECUTION_FAILED';
}

function isTransientFailure(error: unknown): boolean {
  const status = Number((error as any)?.status);
  const code = String((error as any)?.code || '').toLowerCase();
  const message = String((error as any)?.message || '').toLowerCase();

  if ([408, 409, 425, 429, 500, 502, 503, 504].includes(status)) return true;
  if (['rate_limit_exceeded', 'timeout', 'etimedout', 'econnreset', 'temporarily_unavailable'].includes(code)) return true;
  return message.includes('rate limit') || message.includes('timeout') || message.includes('temporar');
}

function toToolExecutionError(
  error: unknown,
  action: string,
  attempts: number,
  retryable: boolean
): ToolExecutionError {
  const err = error as any;
  return {
    phase: 'tools',
    tool: action,
    attempts,
    code: getErrorCode(error),
    message: err?.message || 'Tool execution failed.',
    retryable,
    context: {
      status: err?.status,
      type: err?.type,
      rawCode: err?.code
    }
  };
}

async function executeWithRetry(
  action: string,
  tool: (input: string, imageUri?: string) => Promise<any>,
  input: string,
  imageUri: string | undefined,
  retryConfig: RetryConfig
) {
  let attempt = 0;
  let delayMs = retryConfig.initialDelayMs;

  while (true) {
    attempt += 1;
    try {
      const result = await tool(input, imageUri);
      return { result, attempts: attempt };
    } catch (error) {
      const retryable = isTransientFailure(error);
      const hasRemainingRetries = attempt <= retryConfig.maxRetries;

      if (!retryable || !hasRemainingRetries) {
        throw toToolExecutionError(error, action, attempt, retryable);
      }

      await delay(delayMs);
      delayMs = Math.min(Math.round(delayMs * retryConfig.backoffMultiplier), retryConfig.maxDelayMs);
    }
  }
}

export async function executeTools(
  plan: AgentStep[],
  input: string,
  imageUri?: string,
  options?: { retry?: Partial<RetryConfig>; correlationId?: string }
): Promise<ToolResult[]> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...(options?.retry ?? {}) };
  console.log(
    JSON.stringify({
      phase: 'tools',
      event: 'execute_start',
      correlationId: options?.correlationId,
      steps: plan.length
    })
  );
  const results: ToolResult[] = [];
  for (const step of plan) {
    const tool = tools[step.action as keyof typeof tools];
    if (tool) {
      try {
        const { result } = await executeWithRetry(step.action, tool, input, imageUri, retryConfig);
        results.push({ action: step.action, output: result });
      } catch (err) {
        const error = err as ToolExecutionError;
        results.push({
          action: step.action,
          output: null,
          error,
          safeErrorSummary: `The ${step.action} tool is temporarily unavailable.`
        });
        console.error(
          JSON.stringify({
            phase: 'tools',
            event: 'execute_failed',
            correlationId: options?.correlationId,
            action: step.action,
            error
          })
        );
      }
    }
  }
  return results;
}
