import type { KernelRequest } from './types';
import type { KernelToolContext, KernelToolName, KernelToolResult } from './tool-registry';
import { runKivoTool } from '../tools/runner';

type ToolExecutionPhase = 'start' | 'complete';

type ToolExecutionEvent = {
  phase: ToolExecutionPhase;
  tool: KernelToolName;
  attempt: number;
  result?: KernelToolResult;
};

export type KernelToolExecutionOptions = {
  toolBatches?: KernelToolName[][];
  retries?: number;
  timeoutMs?: number;
  onToolEvent?: (event: ToolExecutionEvent) => void | Promise<void>;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_RETRIES = 1;

function isTransientError(summary: string): boolean {
  const text = summary.toLowerCase();
  return text.includes('timeout') || text.includes('network') || text.includes('failed') || text.includes('503') || text.includes('429');
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

async function runSingleTool(
  tool: KernelToolName,
  request: KernelRequest,
  context: KernelToolContext,
  options: Required<Pick<KernelToolExecutionOptions, 'retries' | 'timeoutMs'>>,
  onToolEvent?: KernelToolExecutionOptions['onToolEvent'],
): Promise<KernelToolResult> {
  let attempt = 0;
  let lastResult: KernelToolResult | null = null;

  while (attempt <= options.retries) {
    attempt += 1;
    await onToolEvent?.({ phase: 'start', tool, attempt });
    try {
      const result = await withTimeout(
        runKivoTool(tool as any, { message: request.message, metadata: request.metadata }, context as any),
        options.timeoutMs,
        tool,
      );
      const normalized: KernelToolResult = { tool: tool as any, ok: result.ok, summary: result.summary, data: result.data };
      await onToolEvent?.({ phase: 'complete', tool, attempt, result: normalized });
      if (normalized.ok || !isTransientError(normalized.summary) || attempt > options.retries) return normalized;
      lastResult = normalized;
    } catch (error) {
      const failed: KernelToolResult = {
        tool,
        ok: false,
        summary: error instanceof Error ? error.message : 'Tool execution failed.',
      };
      await onToolEvent?.({ phase: 'complete', tool, attempt, result: failed });
      if (attempt > options.retries || !isTransientError(failed.summary)) return failed;
      lastResult = failed;
    }
  }

  return (
    lastResult ?? {
      tool,
      ok: false,
      summary: 'Tool execution failed after retries.',
    }
  );
}

export async function executeKernelTools(
  tools: KernelToolName[],
  request: KernelRequest,
  context: KernelToolContext,
  options: KernelToolExecutionOptions = {},
): Promise<KernelToolResult[]> {
  const retries = typeof options.retries === 'number' ? Math.max(0, options.retries) : DEFAULT_RETRIES;
  const timeoutMs = typeof options.timeoutMs === 'number' ? Math.max(2_000, options.timeoutMs) : DEFAULT_TIMEOUT_MS;
  const runOptions = { retries, timeoutMs };

  const batches = options.toolBatches?.filter((batch) => batch.length > 0) ?? (tools.length ? [tools] : []);
  const results: KernelToolResult[] = [];

  for (const batch of batches) {
    const settled = await Promise.all(batch.map((tool) => runSingleTool(tool, request, context, runOptions, options.onToolEvent)));
    results.push(...settled);
  }

  return results;
}
