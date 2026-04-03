import { AgentStep, ToolResult } from './types';
import { executeTool } from './tool-registry';

/**
 * @fileOverview Tool Execution Agent: Runs specialized logic modules.
 */

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log('[TOOLS] Executing tools...');

  const results: ToolResult[] = [];
  for (const step of plan) {
    const result = await executeTool({
      action: step.action,
      input,
      imageUri,
    });
    results.push(result);
  }

  return results;
}
