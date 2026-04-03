import { groq } from '@/ai/groq';
import { ToolExecutionInput, ToolExecutionOutput, ToolModule } from '../types';

export const webSearchTool: ToolModule = {
  id: 'web.search',
  async execute(payload: ToolExecutionInput): Promise<ToolExecutionOutput> {
    const startedAt = Date.now();

    try {
      const res = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Provide a web-style research summary from general knowledge. Return strict JSON: {"query": string, "highlights": string[], "caveats": string[]}.'
          },
          { role: 'user', content: payload.input }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });

      const data = JSON.parse(
        res.choices[0]?.message?.content ||
          '{"query": "", "highlights": [], "caveats": ["Live web retrieval unavailable"]}'
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
          code: 'WEB_SEARCH_TOOL_ERROR',
          message: 'Web search synthesis failed.',
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
