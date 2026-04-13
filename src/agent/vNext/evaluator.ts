import type { AgentEvaluationResult, AgentFinalAnswer, AgentPlan, AgentToolResult } from './types';

export function evaluateExecution(params: {
  plan: AgentPlan;
  toolResults: AgentToolResult[];
  answer: AgentFinalAnswer;
}): AgentEvaluationResult {
  const issues: string[] = [];

  if (!params.answer.text.trim()) {
    issues.push('Final answer is empty.');
  }

  const failedRequiredTools = params.plan.steps
    .filter((step) => step.requiredTool)
    .filter((step) => !params.toolResults.find((result) => result.stepId === step.id && result.ok));

  if (failedRequiredTools.length) {
    issues.push(`Some required tool-backed steps did not succeed (${failedRequiredTools.length}).`);
  }

  const score = Math.max(0, Math.min(1, 1 - issues.length * 0.25));

  return {
    passed: issues.length === 0,
    score,
    issues,
    suggestedActions: issues.length
      ? ['Retry with fallback tools', 'Request missing context from user', 'Escalate to deeper planning mode']
      : ['Execution quality is acceptable.'],
    // TODO: Add model-based critic pass for factuality and actionability.
  };
}
