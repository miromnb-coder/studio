import { ExecutionPlan, ExecutionResult, ExecutionStepResult, ToolContext } from './types';
import { getTool } from './tools';

export async function executePlan(plan: ExecutionPlan, context: ToolContext): Promise<ExecutionResult> {
  const steps: ExecutionStepResult[] = [];
  let structuredData: Record<string, unknown> = {};

  for (const step of plan.steps) {
    try {
      const tool = getTool(step.tool);
      const result = await tool.run(step.input, context);

      const output = result.output || {};
      structuredData = { ...structuredData, [step.tool]: output };

      steps.push({
        stepId: step.id,
        tool: step.tool,
        status: result.ok ? 'success' : 'error',
        reason: step.reason,
        input: step.input,
        output,
        error: result.error,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown execution error.';
      steps.push({
        stepId: step.id,
        tool: step.tool,
        status: 'error',
        reason: step.reason,
        input: step.input,
        output: {},
        error: message,
      });
    }
  }

  return { steps, structuredData };
}
