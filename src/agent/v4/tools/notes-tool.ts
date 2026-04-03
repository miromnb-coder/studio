import { groq } from '@/ai/groq';
import { ToolExecutionInput, ToolExecutionOutput, ToolModule } from '../types';

export const notesTool: ToolModule = {
  id: 'notes.summarize',
  async execute(payload: ToolExecutionInput): Promise<ToolExecutionOutput> {
    const startedAt = Date.now();

    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Summarize notes into clean structure. Return strict JSON: {"summary": string, "keyPoints": string[], "actionItems": string[]}.'
          },
          { role: 'user', content: payload.input }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });

      const data = JSON.parse(
        res.choices[0]?.message?.content ||
          '{"summary": "", "keyPoints": [], "actionItems": []}'
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
          code: 'NOTES_TOOL_ERROR',
          message: 'Notes summarization failed.',
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
