import { ExecutionPlanV8, ExecutionResultV8, ExecutionStepResultV8, ToolNameV8, ToolResultV8, AgentContextV8, PlanStepV8 } from './types';
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
  detect_leaks: async (input, context) => {
    const result = await generateRecommendationsTool({ ...input, subtype: 'subscriptions', leakAudit: true, limit: 5 }, context);
    return { ...result, tool: 'detect_leaks' };
  },
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
  return Number.isFinite(parsed) ? parsed : null;
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
    return {
      ...input,
      monthlyIncome: asNumber(input.monthlyIncome ?? profile.monthly_income),
      monthlyExpenses: asNumber(input.monthlyExpenses ?? profile.monthly_expenses ?? profile.total_monthly_cost),
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
      service: currentService && !/highest ranked service|recent recurring charges/i.test(currentService) ? currentService : (fallbackService || currentService),
      recurringCandidates: subscriptions.slice(0, 5),
      gmailSummary: context.intelligence.gmailFinanceSummary,
    };
  }

  return input;
}

function summarizeToolGain(tool: ToolNameV8, output: Record<string, unknown>): string {
  if (tool === 'finance_read') {
    const profile = asRecord(output.profile);
    const total = asNumber(profile.total_monthly_cost);
    return total && total > 0 ? `Baseline monthly cost identified (${total}).` : 'Finance baseline loaded but still sparse.';
  }
  if (tool === 'gmail_fetch') {
    const analyzed = asNumber(output.emailsAnalyzed) || 0;
    const recurring = asNumber(output.recurringPaymentsFound) || 0;
    return analyzed > 0 ? `Scanned ${analyzed} emails; found ${recurring} recurring payment signals.` : 'No meaningful email signal found.';
  }
  if (tool === 'generate_recommendations') {
    const count = Array.isArray(output.recommendations) ? output.recommendations.length : 0;
    return count > 0 ? `Generated ${count} ranked recommendations.` : 'No ranked recommendations generated.';
  }
  if (tool === 'price_change_detector') {
    const suspicious = asNumber(output.suspiciousCount) || 0;
    return suspicious > 0 ? `Detected ${suspicious} suspicious price changes.` : 'No suspicious price change detected.';
  }
  if (tool === 'savings_plan_generator') {
    const monthly = asNumber(output.recommendedMonthlySavings);
    return monthly && monthly > 0 ? `Estimated automatable monthly savings of ${monthly}.` : 'Savings plan generated without numeric target.';
  }
  return Object.keys(output).length > 0 ? 'Tool returned usable structured data.' : 'Tool returned limited value.';
}

function estimateExecutionConfidence(structuredData: Record<string, unknown>): number {
  const financeRead = asRecord(structuredData.finance_read);
  const profile = asRecord(financeRead.profile);
  const recs = asRecord(structuredData.generate_recommendations);
  const savings = asRecord(structuredData.savings_plan_generator);
  const compare = asRecord(structuredData.finance_compare_options);

  const confidenceSignals = [
    Number(profile.total_monthly_cost || 0) > 0 ? 0.3 : 0,
    Number(profile.monthly_income || 0) > 0 ? 0.15 : 0,
    Array.isArray(recs.recommendations) && recs.recommendations.length > 0 ? 0.2 : 0,
    Number(savings.recommendedMonthlySavings || 0) > 0 ? 0.15 : 0,
    Boolean(compare.recommendation || compare.summary) ? 0.15 : 0,
    asRecord(structuredData.gmail_fetch).emailsAnalyzed ? 0.05 : 0,
  ].reduce((acc, part) => acc + part, 0);

  return Math.max(0, Math.min(1, confidenceSignals));
}

function shouldSkipStep(step: PlanStepV8, confidence: number, structuredData: Record<string, unknown>, context: AgentContextV8): { skip: boolean; reason?: string } {
  if (step.required) return { skip: false };

  const utility = (step.expectedValue || 0.45) + (step.confidenceDelta || 0.08) - (step.costEstimate || 0.35);
  const speedMode = context.decisionContext.outcomeLearning.speedFirst;

  if (step.stopIfConfidenceAbove && confidence >= step.stopIfConfidenceAbove) {
    return { skip: true, reason: `Confidence ${confidence.toFixed(2)} exceeded ${step.stopIfConfidenceAbove.toFixed(2)}.` };
  }

  if (speedMode && utility < 0.2 && step.toolNecessity !== 'high_value') {
    return { skip: true, reason: 'Speed-first preference: low expected gain versus tool cost.' };
  }

  if (step.tool === 'gmail_fetch') {
    const baseline = asRecord(structuredData.finance_read);
    const monthly = Number(asRecord(baseline.profile).total_monthly_cost || 0);
    if (monthly > 0 && confidence > 0.72 && step.toolNecessity !== 'required') {
      return { skip: true, reason: 'Baseline already strong; Gmail would have low incremental value.' };
    }
  }

  return { skip: false };
}

function maybeReplan(step: PlanStepV8, result: ToolResultV8, queue: PlanStepV8[], decisionLog: string[]): number {
  let replans = 0;

  if (step.tool === 'gmail_fetch' && result.ok) {
    const analyzed = Number(result.output.emailsAnalyzed || 0);
    const recurring = Number(result.output.recurringPaymentsFound || 0) + Number(result.output.subscriptionsFound || 0);

    if (analyzed > 0 && recurring === 0) {
      const before = queue.length;
      const filtered = queue.filter((item) => item.tool !== 'subscription_cancel_draft');
      if (filtered.length !== before) {
        queue.splice(0, queue.length, ...filtered);
        decisionLog.push('Replan: removed cancellation drafting because Gmail found no recurring subscription evidence.');
        replans += 1;
      }
    }
  }

  if (step.tool === 'finance_compare_options' && result.ok) {
    const summary = String(result.output.summary || '').toLowerCase();
    if (summary.includes('insufficient') || summary.includes('missing')) {
      queue.unshift({
        id: `replan_${Date.now()}`,
        title: 'Fallback recommendation synthesis',
        tool: 'generate_recommendations',
        description: 'Comparison lacked sufficient signal; switch to baseline-driven recommendation mode.',
        input: { limit: 4, includeRoadmap: false, modeHints: ['recommend'] },
        required: false,
        toolNecessity: 'fallback',
        expectedValue: 0.62,
        costEstimate: 0.21,
        confidenceDelta: 0.14,
      });
      decisionLog.push('Replan: compare output was weak; inserted fallback recommendation synthesis.');
      replans += 1;
    }
  }

  return replans;
}

export async function executePlanV8(plan: ExecutionPlanV8, context: AgentContextV8): Promise<ExecutionResultV8> {
  const steps: ExecutionStepResultV8[] = [];
  let structuredData: Record<string, unknown> = {};
  let completedRequired = 0;
  let totalRequired = 0;
  let replans = 0;
  const decisionLog: string[] = [];
  let earlyStopped = false;

  const queue = [...plan.steps];

  while (queue.length) {
    const planStep = queue.shift() as PlanStepV8;
    if (planStep.required) totalRequired += 1;

    const confidenceBefore = estimateExecutionConfidence(structuredData);
    const skipDecision = shouldSkipStep(planStep, confidenceBefore, structuredData, context);

    if (skipDecision.skip) {
      steps.push({
        stepId: planStep.id,
        title: planStep.title,
        tool: planStep.tool,
        status: 'skipped',
        summary: `${planStep.description} (skipped: ${skipDecision.reason})`,
        input: planStep.input,
        output: {},
      });
      decisionLog.push(`Skipped ${planStep.tool}: ${skipDecision.reason}`);
      continue;
    }

    try {
      const handler = registry[planStep.tool];
      if (!handler) throw new Error(`Tool not registered: ${planStep.tool}`);

      const resolvedInput = mergeStepInput(planStep.tool, planStep.input, context, structuredData);
      let result: ToolResultV8 | null = null;
      let lastError = '';

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          result = await Promise.race([
            handler(resolvedInput, context),
            new Promise<ToolResultV8>((_, reject) => {
              setTimeout(() => reject(new Error(`Timed out after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS);
            }),
          ]);
          if (result.ok || planStep.required || attempt === MAX_RETRIES) break;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'Unknown execution error';
          if (attempt === MAX_RETRIES) break;
        }
      }

      if (!result) throw new Error(lastError || 'Tool returned no result');

      const gainSummary = summarizeToolGain(planStep.tool, result.output || {});
      if (!result.ok && !planStep.required) {
        steps.push({
          stepId: planStep.id,
          title: planStep.title,
          tool: planStep.tool,
          status: 'skipped',
          summary: `${planStep.description} (optional step degraded gracefully). ${gainSummary}`,
          input: resolvedInput,
          output: result.output,
          error: result.error,
        });
        decisionLog.push(`Optional step failed gracefully: ${planStep.tool}`);
        continue;
      }

      steps.push({
        stepId: planStep.id,
        title: planStep.title,
        tool: planStep.tool,
        status: result.ok ? 'completed' : 'failed',
        summary: `${planStep.description} ${gainSummary}`,
        input: resolvedInput,
        output: result.output,
        error: result.error,
      });

      const toolInsights = asRecord(structuredData._toolInsights);
      structuredData = {
        ...structuredData,
        [planStep.tool]: result.output,
        _toolInsights: {
          ...toolInsights,
          [planStep.tool]: {
            gained: gainSummary,
            ok: result.ok,
            utility: (planStep.expectedValue || 0.5) - (planStep.costEstimate || 0.3),
          },
        },
      };

      if (planStep.required && result.ok) completedRequired += 1;
      replans += maybeReplan(planStep, result, queue, decisionLog);

      const confidenceAfter = estimateExecutionConfidence(structuredData);
      if ((plan.planningProfile === 'fast_path' || context.decisionContext.outcomeLearning.speedFirst) && confidenceAfter >= 0.82) {
        earlyStopped = true;
        decisionLog.push(`Early stop: confidence ${confidenceAfter.toFixed(2)} reached fast-path threshold.`);
        break;
      }
    } catch (error) {
      steps.push({
        stepId: planStep.id,
        title: planStep.title,
        tool: planStep.tool,
        status: planStep.required ? 'failed' : 'skipped',
        summary: `${planStep.description} (execution failed before value assessment).`,
        input: planStep.input,
        output: {},
        error: error instanceof Error ? error.message : 'Unknown tool execution error',
      });

      decisionLog.push(`Tool failure (${planStep.tool}): ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }

  const confidence = estimateExecutionConfidence(structuredData);

  return {
    steps,
    structuredData,
    partialSuccess: totalRequired > 0 ? completedRequired < totalRequired : steps.some((item) => item.status !== 'failed'),
    confidence,
    earlyStopped,
    replans,
    decisionLog,
  };
}
