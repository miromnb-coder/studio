import type { KernelRequest } from './types';
import type { KernelToolContext, KernelToolName, KernelToolResult } from './tool-registry';
import { runKivoTool } from '../tools/runner';

export async function executeKernelTools(tools: KernelToolName[], request: KernelRequest, context: KernelToolContext): Promise<KernelToolResult[]> {
 const results: KernelToolResult[] = [];
 for (const tool of tools) {
   const result = await runKivoTool(tool as any, { message: request.message, metadata: request.metadata }, context as any);
   results.push({ tool: tool as any, ok: result.ok, summary: result.summary, data: result.data });
 }
 return results;
}
