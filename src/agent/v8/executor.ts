import { ExecutionPlanV8, ExecutionResultV8, ExecutionStepResultV8, ToolNameV8, ToolResultV8, AgentContextV8 } from './types';
import { financeReadTool } from './tools/finance';
import { gmailFetchTool } from './tools/gmail';
import { generateRecommendationsTool } from './tools/recommendations';

type ToolHandler = (input: Record<string, unknown>, context: AgentContextV8) => Promise<ToolResultV8>;

const registry: Partial<Record<ToolNameV8, ToolHandler>> = {
  finance_read: financeReadTool,
  gmail_fetch: gmailFetchTool,
  generate_recommendations: generateRecommendationsTool,
};

export async function executePlanV8(plan: ExecutionPlanV8, context: AgentContextV8): Promise<ExecutionResultV8> {
  const steps: ExecutionStepResultV8[] = [];
  let structuredData: Record<string, unknown> = {};

  for (const planStep of plan.steps) {
    try {
      const handler = registry[planStep.tool];
      if (!handler) throw new Error(`Tool not registered: ${planStep.tool}`);
      const result = await handler(planStep.input, context);

      if (!result.ok && !planStep.required) {
        steps.push({
          stepId: planStep.id,
          title: planStep.title,
          tool: planStep.tool,
          status: 'skipped',
          summary: `${planStep.description} (optional step skipped)`,
          input: planStep.input,
          output: result.output,
          error: result.error,
        });
        continue;
      }

      steps.push({
        stepId: planStep.id,
        title: planStep.title,
        tool: planStep.tool,
        status: result.ok ? 'completed' : 'failed',
        summary: planStep.description,
        input: planStep.input,
        output: result.output,
        error: result.error,
      });

      structuredData = {
        ...structuredData,
        [planStep.tool]: result.output,
      };
    } catch (error) {
      steps.push({
        stepId: planStep.id,
        title: planStep.title,
        tool: planStep.tool,
        status: planStep.required ? 'failed' : 'skipped',
        summary: planStep.description,
        input: planStep.input,
        output: {},
        error: error instanceof Error ? error.message : 'Unknown tool execution error',
      });
    }
  }

  return { steps, structuredData };
}
