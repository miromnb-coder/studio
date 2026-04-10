import { ExecutionPlanV8, ExecutionResultV8, ExecutionStepResultV8, ToolNameV8, ToolResultV8, AgentContextV8 } from './types';
import { buildDashboardSnapshotTool, generateProactiveInsightsTool } from './tools/dashboard';
import { createSavingsPlanTool, detectLeaksTool, draftCancellationTool, findAlternativesTool } from './tools/finance';
import { checkGmailConnectionTool, importGmailFinanceTool } from './tools/gmail';
import { persistMemoryTool, retrieveSemanticMemoryTool, retrieveStructuredMemoryTool } from './tools/memory';
import { analyzeErrorTool, suggestFixTool } from './tools/technical';

type ToolHandler = (input: Record<string, unknown>, context: AgentContextV8) => Promise<ToolResultV8>;

const registry: Record<ToolNameV8, ToolHandler> = {
  detect_leaks: detectLeaksTool,
  create_savings_plan: createSavingsPlanTool,
  find_alternatives: findAlternativesTool,
  draft_cancellation: draftCancellationTool,
  retrieve_structured_memory: retrieveStructuredMemoryTool,
  retrieve_semantic_memory: retrieveSemanticMemoryTool,
  persist_memory: persistMemoryTool,
  check_gmail_connection: checkGmailConnectionTool,
  import_gmail_finance: importGmailFinanceTool,
  build_dashboard_snapshot: buildDashboardSnapshotTool,
  generate_proactive_insights: generateProactiveInsightsTool,
  analyze_error: analyzeErrorTool,
  suggest_fix: suggestFixTool,
};

export async function executePlanV8(plan: ExecutionPlanV8, context: AgentContextV8): Promise<ExecutionResultV8> {
  const steps: ExecutionStepResultV8[] = [];
  let structuredData: Record<string, unknown> = {};

  for (const planStep of plan.steps) {
    try {
      const handler = registry[planStep.tool];
      if (!handler) throw new Error(`Tool not registered: ${planStep.tool}`);

      const result = await handler(planStep.input, context);

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
        status: 'failed',
        summary: planStep.description,
        input: planStep.input,
        output: {},
        error: error instanceof Error ? error.message : 'Unknown tool execution error',
      });
    }
  }

  return { steps, structuredData };
}
