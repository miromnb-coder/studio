import { groq } from '@/ai/groq';
import { ToolExecutionInput, ToolExecutionOutput, ToolModule } from '../types';

export const todoTool: ToolModule = {
  id: 'todo.plan',
  async execute(payload: ToolExecutionInput): Promise<ToolExecutionOutput> {
    const startedAt = Date.now();

    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Create a todo plan from the input. Return strict JSON: {"tasks": [{"task": string, "priority": "high"|"medium"|"low", "estimateMinutes": number|null}], "nextAction": string}.'
          },
          { role: 'user', content: payload.input }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });

      const data = JSON.parse(res.choices[0]?.message?.content || '{"tasks": [], "nextAction": ""}');

      return {
        success: true,
        data,
        error: null,
        metadata: {
          latencyMs: Date.now() - startedAt,
          source: 'groq:llama-3.3-70b-versatile',
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'TODO_TOOL_ERROR',
          message: 'Todo planning failed.',
          details: {
            reason: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          latencyMs: Date.now() - startedAt,
          source: 'groq:llama-3.3-70b-versatile',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
