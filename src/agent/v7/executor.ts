import { ExecutionPlan, ExecutionResult, ExecutionStepResult, ToolContext } from './types';
import { getTool } from './tools';

export async function executePlan(plan: ExecutionPlan, context: ToolContext): Promise<ExecutionResult> {
  console.info('AGENT_V7_EXECUTE_PLAN_START', { intent: plan.intent, stepCount: plan.steps.length });
  const steps: ExecutionStepResult[] = [];
  let structuredData: Record<string, unknown> = {};

  for (const step of plan.steps) {
    try {
      console.info('AGENT_V7_TOOL_START', { stepId: step.id, tool: step.tool });
      const tool = getTool(step.tool);
      if (!tool) {
        throw new Error(`Tool not found in registry: ${step.tool}`);
      }
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
      console.info('AGENT_V7_TOOL_DONE', {
        stepId: step.id,
        tool: step.tool,
        ok: result.ok,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown execution error.';
      console.error('AGENT_V7_TOOL_ERROR', { stepId: step.id, tool: step.tool, message });
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

  console.info('AGENT_V7_EXECUTE_PLAN_DONE', { stepCount: steps.length });
  return { steps, structuredData };
}
