import type { AgentStep, ToolResult } from './v4/types';
import { executeTools as executeToolsV4 } from './v4/tools';

/**
 * @fileOverview Legacy compatibility wrapper for tool execution.
 * Canonical implementation lives in ./v4/tools.
 */

export type { AgentStep, ToolResult } from './v4/types';

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  return executeToolsV4(plan, input, imageUri);
}
