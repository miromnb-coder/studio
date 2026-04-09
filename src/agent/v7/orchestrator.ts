import { groq } from '@/ai/groq';
import { executePlan } from './executor';
import { readUserContext } from './memory';
import { createPlan } from './planner';
import { routeIntent } from './router';
import { AgentMessage, AgentRunResultV7 } from './types';

function sanitizeHistory(history: unknown[]): AgentMessage[] {
  return (history || [])
    .filter((m): m is Record<string, unknown> => !!m && typeof m === 'object')
    .map((m) => {
      const role: AgentMessage['role'] = m.role === 'assistant' || m.role === 'system' ? m.role : 'user';
      return {
        role,
        content: typeof m.content === 'string' ? m.content.trim() : '',
      };
    })
    .filter((m) => m.content.length > 0);
}

export async function runAgentV7(
  input: string,
  userId: string,
  history: unknown[] = [],
  imageUri?: string,
  memory?: Record<string, unknown> | null,
): Promise<AgentRunResultV7> {
  const safeInput = typeof input === 'string' && input.trim().length > 0 ? input.trim() : 'Continue.';
  const safeHistory = sanitizeHistory(history);

  try {
    console.info('AGENT_V7_ROUTE_START', { inputLength: safeInput.length, historyCount: safeHistory.length });
    const userContext = readUserContext({
      userId,
      memory: memory ?? null,
      history: safeHistory,
    });

    const route = await routeIntent(safeInput, safeHistory).catch((error) => {
      console.error('AGENT_V7_ROUTE_ERROR:', error);
      return { intent: 'general' as const, confidence: 0.3, reason: 'Fallback after route failure.' };
    });
    console.info('AGENT_V7_ROUTE_DONE', { intent: route.intent, reason: route.reason });

    console.info('AGENT_V7_PLANNER_START', { intent: route.intent });
    const plan = createPlan(route.intent, safeInput);
    console.info('AGENT_V7_PLANNER_DONE', { stepCount: plan.steps.length, summary: plan.summary });

    console.info('AGENT_V7_EXECUTOR_START', { stepCount: plan.steps.length });
    const execution = await executePlan(plan, {
      userId: userContext.userId,
      input: safeInput,
      history: safeHistory,
      imageUri,
      memory: userContext,
    });
    console.info('AGENT_V7_EXECUTOR_DONE', {
      stepCount: execution.steps.length,
      errorSteps: execution.steps.filter((step) => step.status === 'error').length,
    });

    console.info('AGENT_V7_FINAL_RESPONSE_START');
    const stream = await groq.chat.completions
      .create({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.2,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              'You are the final response synthesizer. Use tool outputs and relevant memory to provide a concise answer with actionable next steps.',
          },
          ...safeHistory.slice(-3),
          {
            role: 'user',
            content: `User input: ${safeInput}\n\nIntent: ${route.intent}\nMemory type: ${userContext.summaryType || 'general'}\nMemory summary: ${userContext.summary || 'none'}\nPlan: ${plan.summary}\nTool results: ${JSON.stringify(execution.steps)}`,
          },
        ],
      })
      .catch((error: unknown) => {
        console.error('AGENT_V7_FINAL_RESPONSE_ERROR:', error);
        return null;
      });
    console.info('AGENT_V7_FINAL_RESPONSE_DONE', { hasStream: Boolean(stream) });

    const fallbackFinalText =
      execution.steps
        .map((step) => {
          const outputText = Object.values(step.output || {})
            .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
            .join(' ')
            .trim();
          return outputText || null;
        })
        .filter((v): v is string => Boolean(v))
        .join('\n\n') || 'I ran into an issue, but here’s what I could analyze so far.';

    return {
      ...(stream ? { stream } : { finalText: fallbackFinalText }),
      metadata: {
        version: 'v7',
        intent: route.intent,
        planSummary: plan.summary,
        memoryUsed: userContext.summary !== 'No prior context available.',
        debug: {
          routeReason: route.reason,
          stepCount: execution.steps.length,
        },
      },
      steps: execution.steps,
      structuredData: execution.structuredData,
    };
  } catch (error) {
    console.error('AGENT_V7_ORCHESTRATOR_ERROR:', error);
    return {
      finalText: 'I ran into an issue, but here’s what I could analyze so far.',
      metadata: {
        version: 'v7',
        intent: 'general',
        planSummary: 'Partial fallback',
        memoryUsed: false,
        debug: {
          routeReason: 'Fallback after orchestrator error.',
          stepCount: 0,
        },
      },
      steps: [],
      structuredData: {},
    };
  }
}
