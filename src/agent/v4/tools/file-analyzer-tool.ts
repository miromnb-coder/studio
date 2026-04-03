import { groq } from '@/ai/groq';
import { ToolExecutionInput, ToolExecutionOutput, ToolModule } from '../types';

export const fileAnalyzerTool: ToolModule = {
  id: 'file.analyze',
  async execute(payload: ToolExecutionInput): Promise<ToolExecutionOutput> {
    const startedAt = Date.now();

    try {
      const model = payload.imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
      const content: any = payload.imageUri
        ? [
            { type: 'text', text: payload.input },
            { type: 'image_url', image_url: { url: payload.imageUri } }
          ]
        : payload.input;

      const res = await groq.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content:
              'Analyze the supplied file or content. Return strict JSON: {"overview": string, "entities": string[], "risks": string[], "recommendedNextSteps": string[]}.'
          },
          { role: 'user', content }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      });

      const data = JSON.parse(
        res.choices[0]?.message?.content ||
          '{"overview": "", "entities": [], "risks": [], "recommendedNextSteps": []}'
      );

      return {
        success: true,
        data,
        error: null,
        metadata: {
          latencyMs: Date.now() - startedAt,
          source: `groq:${model}`,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error: {
          code: 'FILE_ANALYZER_TOOL_ERROR',
          message: 'File analysis failed.',
          details: {
            reason: error instanceof Error ? error.message : 'Unknown error'
          }
        },
        metadata: {
          latencyMs: Date.now() - startedAt,
          source: 'groq:file-analyzer',
          timestamp: new Date().toISOString()
        }
      };
    }
  }
};
