import { TodoToolInput, TodoToolOutput, ToolEnvelope } from '@/agent/v4/types';
import { mapToolError } from './common';

export async function runTodoTool(input: TodoToolInput): Promise<ToolEnvelope<TodoToolOutput>> {
  try {
    const instruction = input.instruction?.trim();
    if (!instruction) {
      throw new Error('validation: todo instruction is required');
    }

    const segments = instruction.split(/[,\n]/).map((item) => item.trim()).filter(Boolean);
    const tasks = (segments.length ? segments : [instruction]).slice(0, 6).map((title) => ({
      title,
      priority: 'medium' as const,
      done: false,
    }));

    return {
      ok: true,
      data: {
        summary: `Prepared ${tasks.length} todo items.`,
        tasks,
      },
      error: null,
    };
  } catch (error) {
    return { ok: false, data: null, error: mapToolError(error, 'Todo tool failed.') };
  }
}
