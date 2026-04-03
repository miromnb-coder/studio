import { groq } from '@/ai/groq';

export const V4_TOOL_NAMES = ['calendar', 'todo', 'notes', 'webSearch', 'fileAnalyzer'] as const;

export type V4ToolName = (typeof V4_TOOL_NAMES)[number];

export interface ToolInvocation {
  action: string;
  input: string;
  imageUri?: string;
}

export interface ToolExecutionError {
  code: 'UNKNOWN_TOOL' | 'TOOL_EXECUTION_FAILED';
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolExecutionResult {
  action: string;
  output: unknown;
  error?: ToolExecutionError;
}

type ToolAdapter = (input: string, imageUri?: string) => Promise<unknown>;

const summarizeWithModel = async (system: string, input: string, imageUri?: string) => {
  const model = imageUri ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: imageUri
          ? [{ type: 'text', text: input }, { type: 'image_url', image_url: { url: imageUri } }]
          : input,
      },
    ],
    temperature: 0.1,
  });

  return {
    summary: response.choices[0]?.message?.content || '',
  };
};

const toolRegistry: Record<V4ToolName, ToolAdapter> = {
  calendar: async (input) =>
    summarizeWithModel(
      'You are a calendar assistant. Extract time-bound commitments, conflicts, and propose scheduling adjustments.',
      input,
    ),
  todo: async (input) =>
    summarizeWithModel(
      'You are a task assistant. Convert the input into clear TODO items grouped by priority and dependency.',
      input,
    ),
  notes: async (input, imageUri) =>
    summarizeWithModel(
      'You are a notes assistant. Produce structured notes with headings, bullets, and key takeaways.',
      input,
      imageUri,
    ),
  webSearch: async (input) =>
    summarizeWithModel(
      'You are a research assistant. Identify what should be searched and provide a concise evidence-seeking checklist.',
      input,
    ),
  fileAnalyzer: async (input, imageUri) =>
    summarizeWithModel(
      'You are a file analyzer. Extract structural insights, risks, and actionable findings from the provided file content.',
      input,
      imageUri,
    ),
};

export function isSupportedTool(action: string): action is V4ToolName {
  return (V4_TOOL_NAMES as readonly string[]).includes(action);
}

export async function executeTool({ action, input, imageUri }: ToolInvocation): Promise<ToolExecutionResult> {
  if (!isSupportedTool(action)) {
    return {
      action,
      output: null,
      error: {
        code: 'UNKNOWN_TOOL',
        message: `Tool \"${action}\" is not supported by Agent v4 registry.`,
        details: {
          allowedTools: [...V4_TOOL_NAMES],
          receivedAction: action,
        },
      },
    };
  }

  try {
    const output = await toolRegistry[action](input, imageUri);
    return { action, output };
  } catch (error) {
    return {
      action,
      output: null,
      error: {
        code: 'TOOL_EXECUTION_FAILED',
        message: `Tool \"${action}\" execution failed.`,
        details: {
          reason: error instanceof Error ? error.message : 'unknown_error',
        },
      },
    };
  }
}
