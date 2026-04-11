import { ExecutionPlanV8, ExecutionResultV8, ExecutionStepResultV8, ToolNameV8, ToolResultV8, AgentContextV8 } from './types';
import { financeReadTool } from './tools/finance';
import { gmailFetchTool } from './tools/gmail';
import { generateRecommendationsTool } from './tools/recommendations';
import {
  cashflowSummaryTool,
  financeCompareOptionsTool,
  priceChangeDetectorTool,
  savingsPlanGeneratorTool,
  subscriptionCancelDraftTool,
} from './tools/finance-operator';

type ToolHandler = (input: Record<string, unknown>, context: AgentContextV8) => Promise<ToolResultV8>;

const registry: Partial<Record<ToolNameV8, ToolHandler>> = {
  finance_read: financeReadTool,
  gmail_fetch: gmailFetchTool,
  generate_recommendations: generateRecommendationsTool,
  finance_compare_options: financeCompareOptionsTool,
  savings_plan_generator: savingsPlanGeneratorTool,
  subscription_cancel_draft: subscriptionCancelDraftTool,
  cashflow_summary: cashflowSummaryTool,
  price_change_detector: priceChangeDetectorTool,
};
const TOOL_TIMEOUT_MS = 8000;
const MAX_RETRIES = 1;

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function mergeStepInput(
  tool: ToolNameV8,
  input: Record<string, unknown>,
  context: AgentContextV8,
  structuredData: Record<string, unknown>,
): Record<string, unknown> {
  if (tool === 'finance_compare_options') {
    const currentOptions = Array.isArray(input.options) ? input.options : [];
    if (currentOptions.length >= 2) return input;

    const message = context.user.message;
    const pairs = message.match(/([^?.,\n]+?)\s+(?:vs|versus)\s+([^?.,\n]+)/i);
    if (!pairs) return input;
    const options = [pairs[1], pairs[2]].map((segment, index) => ({
      id: `option_${index + 1}`,
      label: segment.replace(/\$?\s?\d[\d,.]*/g, '').trim() || `Option ${index + 1}`,
      monthlyCost: asNumber((segment.match(/(\d[\d,.]*)\s*(?:\/?\s?(?:month|mo|monthly))/i) || [])[1]),
      annualCost: asNumber((segment.match(/(\d[\d,.]*)\s*(?:\/?\s?(?:year|yr|annual|yearly))/i) || [])[1]),
      switchingCost: 0,
      valueScore: 5,
    }));
    return { ...input, options };
  }

  if (tool === 'savings_plan_generator') {
    const financeRead = asRecord(structuredData.finance_read);
    const profile = asRecord(financeRead.profile);
    const monthlyIncome = asNumber(input.monthlyIncome ?? profile.monthly_income);
    const monthlyExpenses = asNumber(input.monthlyExpenses ?? profile.monthly_expenses ?? profile.total_monthly_cost);
    return {
      ...input,
      monthlyIncome,
      monthlyExpenses,
      targetAmount: asNumber(input.targetAmount),
      deadlineMonths: asNumber(input.deadlineMonths),
      desiredMonthlySavings: asNumber(input.desiredMonthlySavings),
    };
  }

  if (tool === 'subscription_cancel_draft') {
    const financeRead = asRecord(structuredData.finance_read);
    const profile = asRecord(financeRead.profile);
    const subscriptions = Array.isArray(profile.subscriptions) ? profile.subscriptions : [];
    const fallbackService = subscriptions
      .map((item) => asRecord(item))
      .map((item) => String(item.name || item.service || '').trim())
      .find(Boolean);
    const currentService = String(input.service || '').trim();
    return {
      ...input,
      service: currentService && !/recent recurring charges/i.test(currentService) ? currentService : (fallbackService || currentService),
      recurringCandidates: subscriptions.slice(0, 5),
      gmailSummary: context.intelligence.gmailFinanceSummary,
    };
  }

  return input;
}

export async function executePlanV8(plan: ExecutionPlanV8, context: AgentContextV8): Promise<ExecutionResultV8> {
  const steps: ExecutionStepResultV8[] = [];
  let structuredData: Record<string, unknown> = {};
  let completedRequired = 0;
  let totalRequired = 0;

  for (const planStep of plan.steps) {
    if (planStep.required) totalRequired += 1;
    try {
      const handler = registry[planStep.tool];
      if (!handler) throw new Error(`Tool not registered: ${planStep.tool}`);
      const resolvedInput = mergeStepInput(planStep.tool, planStep.input, context, structuredData);
      let result: ToolResultV8 | null = null;
      let lastError = '';

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          const timedResult = await Promise.race([
            handler(resolvedInput, context),
            new Promise<ToolResultV8>((_, reject) => {
              setTimeout(() => reject(new Error(`Timed out after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS);
            }),
          ]);
          result = timedResult;
          if (timedResult.ok || planStep.required || attempt === MAX_RETRIES) break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown execution error';
          if (attempt === MAX_RETRIES) break;
        }
      }

      if (!result) {
        throw new Error(lastError || 'Tool returned no result');
      }

      if (!result.ok && !planStep.required) {
        steps.push({
          stepId: planStep.id,
          title: planStep.title,
          tool: planStep.tool,
          status: 'skipped',
          summary: `${planStep.description} (optional step skipped)`,
          input: resolvedInput,
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
        input: resolvedInput,
        output: result.output,
        error: result.error,
      });

      structuredData = {
        ...structuredData,
        [planStep.tool]: result.output,
      };
      if (planStep.required && result.ok) completedRequired += 1;
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

  return {
    steps,
    structuredData,
    partialSuccess: totalRequired > 0 ? completedRequired < totalRequired : steps.some((item) => item.status !== 'failed'),
  };
}
