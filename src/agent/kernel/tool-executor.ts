import type { KernelRequest } from './types';
import type {
  KernelToolContext,
  KernelToolName,
  KernelToolResult,
} from './tool-registry';
import { runKernelTool } from './tools';

export async function executeKernelTools(
  tools: KernelToolName[],
  request: KernelRequest,
  context: KernelToolContext,
): Promise<KernelToolResult[]> {
  const results: KernelToolResult[] = [];

  for (const tool of tools) {
    const result = await runKernelTool(tool, request, context);
    results.push(result);
  }

  return results;
}
