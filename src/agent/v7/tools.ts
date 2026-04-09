import { groq } from '@/ai/groq';
import { ToolContext, ToolName, ToolResult } from './types';

type ToolHandler = (input: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>;

export interface ToolDefinitionV7 {
  name: ToolName;
  description: string;
  run: ToolHandler;
}

function safeJsonParse(raw: string | null | undefined, fallback: Record<string, unknown>): Record<string, unknown> {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch {
    return fallback;
  }
}

const analyzeTool: ToolDefinitionV7 = {
  name: 'analyze',
  description: 'Extract objective insights from user input (and image when provided).',
  run: async (input, context) => {
    const text = String(input.text || context.input || 'Analyze this input.');
    const model = context.imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';

    const response = await groq.chat.completions.create({
      model,
      temperature: 0,
      messages: [
        { role: 'system', content: 'Provide concise, structured analysis with key findings and risks.' },
        {
          role: 'user',
          content: context.imageUri
            ? [
                { type: 'text', text },
                { type: 'image_url', image_url: { url: context.imageUri } },
              ]
            : text,
        },
      ],
    });

    return {
      ok: true,
      tool: 'analyze',
      output: {
        insights: response.choices[0]?.message?.content || 'No analysis output generated.',
      },
    };
  },
};

const detectLeaksTool: ToolDefinitionV7 = {
  name: 'detect_leaks',
  description: 'Find likely financial waste patterns from text.',
  run: async (input, context) => {
    const text = String(input.text || context.input || '');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Find recurring charges, hidden costs, and trial traps. Return JSON: {"leaks":[],"estimatedMonthlySavings":0,"notes":"..."}.',
        },
        { role: 'user', content: text },
      ],
    });

    return {
      ok: true,
      tool: 'detect_leaks',
      output: safeJsonParse(response.choices[0]?.message?.content, {
        leaks: [],
        estimatedMonthlySavings: 0,
        notes: 'No leak data returned.',
      }),
    };
  },
};

const generalReasonTool: ToolDefinitionV7 = {
  name: 'general_reason',
  description: 'Generate a pragmatic, user-facing response for broad requests.',
  run: async (input, context) => {
    const text = String(input.text || context.input || '');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'Provide clear, direct guidance. Prefer practical steps over abstract theory.',
        },
        { role: 'user', content: text },
      ],
    });

    return {
      ok: true,
      tool: 'general_reason',
      output: {
        response: response.choices[0]?.message?.content || 'No response generated.',
      },
    };
  },
};

export const toolRegistry: Record<ToolName, ToolDefinitionV7> = {
  analyze: analyzeTool,
  detect_leaks: detectLeaksTool,
  general_reason: generalReasonTool,
};

export function getTool(name: ToolName): ToolDefinitionV7 {
  return toolRegistry[name];
}

export function listTools(): ToolDefinitionV7[] {
  return Object.values(toolRegistry);
}
