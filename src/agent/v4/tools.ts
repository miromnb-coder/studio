import {
  AgentStep,
  ToolExecutionInputSchema,
  ToolExecutionOutputSchema,
  ToolModule,
  ToolResult
} from './types';
import { calendarTool } from './tools/calendar-tool';
import { todoTool } from './tools/todo-tool';
import { notesTool } from './tools/notes-tool';
import { webSearchTool } from './tools/web-search-tool';
import { fileAnalyzerTool } from './tools/file-analyzer-tool';

/**
 * @fileOverview Tool Execution Agent: Registry + dispatcher for v4 tool modules.
 */

const toolRegistry: Record<string, ToolModule> = {
  [calendarTool.id]: calendarTool,
  [todoTool.id]: todoTool,
  [notesTool.id]: notesTool,
  [webSearchTool.id]: webSearchTool,
  [fileAnalyzerTool.id]: fileAnalyzerTool
};

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log('[TOOLS] Executing tools via registry dispatcher...');
  const results: ToolResult[] = [];

  for (const step of plan) {
    const module = toolRegistry[step.action];

    if (!module) {
      results.push({
        action: step.action,
        output: {
          success: false,
          data: null,
          error: {
            code: 'UNKNOWN_TOOL_ACTION',
            message: `Unknown tool action: ${step.action}`,
            details: { action: step.action }
          },
          metadata: {
            latencyMs: 0,
            source: 'dispatcher',
            timestamp: new Date().toISOString()
          }
        },
        error: 'Unknown tool action.'
      });
      continue;
    }

    const payload = ToolExecutionInputSchema.parse({
      action: step.action,
      input,
      imageUri
    });

    const output = ToolExecutionOutputSchema.parse(await module.execute(payload));

    results.push({
      action: step.action,
      output,
      error: output.error?.message
    });
  }

  return results;
}
