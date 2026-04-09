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
    const userContext = readUserContext({
      userId,
      memory: memory ?? null,
      history: safeHistory,
    });

    const route = await routeIntent(safeInput, safeHistory);
    const plan = createPlan(route.intent, safeInput);

    const execution = await executePlan(plan, {
      userId: userContext.userId,
      input: safeInput,
      history: safeHistory,
      imageUri,
      memory: userContext,
    });

    const stream = await groq.chat.completions.create({
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
    });

    return {
      stream,
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
