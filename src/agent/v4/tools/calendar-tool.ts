import { groq } from '@/ai/groq';
import { ToolExecutionInput, ToolExecutionOutput, ToolModule } from '../types';

export const calendarTool: ToolModule = {
  id: 'calendar.analyze',
  async execute(payload: ToolExecutionInput): Promise<ToolExecutionOutput> {
    const startedAt = Date.now();

    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Extract calendar-relevant items from user text. Return strict JSON: {"events": [{"title": string, "date": string|null, "time": string|null, "durationMinutes": number|null}], "conflicts": string[], "recommendations": string[]}.'
          },
          { role: 'user', content: payload.input }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });

      const data = JSON.parse(
        res.choices[0]?.message?.content ||
          '{"events": [], "conflicts": [], "recommendations": []}'
      );

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
          code: 'CALENDAR_TOOL_ERROR',
          message: 'Calendar analysis failed.',
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
