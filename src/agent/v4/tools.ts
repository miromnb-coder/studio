import { AgentStep, ToolResult } from './types';
import { getTool, listTools } from './tools/registry';
import './tools/register';

/**
 * @fileOverview Tool Execution Agent: Runs specialized logic modules.
 */

function getStepPayload(step: AgentStep, input: string, imageUri?: string): unknown {
  if (!step.payload || typeof step.payload !== 'object' || Array.isArray(step.payload)) {
    return { input, imageUri };
  }

  return {
    input,
    imageUri,
    ...step.payload
  };
}

export async function executeTools(plan: AgentStep[], input: string, imageUri?: string): Promise<ToolResult[]> {
  console.log('[TOOLS] Executing tools...');

  const results: ToolResult[] = [];

  for (const step of plan) {
    const tool = getTool(step.action);

    if (!tool) {
      results.push({
        action: step.action,
        output: null,
        error: {
          code: 'UNKNOWN_TOOL',
          message: `Tool "${step.action}" is not registered.`,
          details: { availableTools: listTools() }
        }
      });
      continue;
    }

    const payloadValidation = tool.inputSchema.safeParse(getStepPayload(step, input, imageUri));
    if (!payloadValidation.success) {
      results.push({
        action: step.action,
        output: null,
        error: {
          code: 'INVALID_TOOL_INPUT',
          message: `Planner payload for tool "${step.action}" failed schema validation.`,
          details: payloadValidation.error.flatten()
        }
      });
      continue;
    }

    try {
      const output = await tool.execute(payloadValidation.data);
      const outputValidation = tool.outputSchema.safeParse(output);

      if (!outputValidation.success) {
        results.push({
          action: step.action,
          output: null,
          error: {
            code: 'INVALID_TOOL_OUTPUT',
            message: `Tool "${step.action}" returned output that does not match schema.`,
            details: outputValidation.error.flatten()
          }
        });
        continue;
      }

      results.push({
        action: step.action,
        output: outputValidation.data
      });
    } catch (err) {
      results.push({
        action: step.action,
        output: null,
        error: {
          code: 'TOOL_EXECUTION_FAILED',
          message: `Execution failed for tool "${step.action}".`,
          details: err instanceof Error ? err.message : 'Unknown execution error'
        }
      });
    }
  }

  return results;
}
