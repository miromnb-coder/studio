import type {
  AgentEvaluationResult,
  AgentFinalAnswer,
  AgentPlan,
  AgentToolResult,
} from './types';

type EvaluateExecutionParams = {
  plan: AgentPlan;
  toolResults: AgentToolResult[];
  answer: AgentFinalAnswer;
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function getRequiredToolSteps(plan: AgentPlan) {
  return plan.steps.filter((step) => step.requiredTool);
}

function getFailedRequiredToolSteps(
  plan: AgentPlan,
  toolResults: AgentToolResult[],
) {
  const resultsByStep = new Map(toolResults.map((result) => [result.stepId, result]));

  return getRequiredToolSteps(plan).filter((step) => {
    const result = resultsByStep.get(step.id);
    return !result || !result.ok;
  });
}

function getSuccessfulToolResults(toolResults: AgentToolResult[]) {
  return toolResults.filter((result) => result.ok);
}

function getFailedToolResults(toolResults: AgentToolResult[]) {
  return toolResults.filter((result) => !result.ok);
}

function hasUsefulAnswer(answer: AgentFinalAnswer): boolean {
  const text = normalizeText(answer.text);
  return text.length >= 24;
}

function hasActionability(answer: AgentFinalAnswer): boolean {
  const text = normalizeText(answer.text).toLowerCase();

  return (
    text.includes('next step') ||
    text.includes('recommended') ||
    text.includes('you can') ||
    text.includes('should') ||
    text.includes('open') ||
    text.includes('review') ||
    text.includes('start')
  );
}

function hasStructuredOutput(answer: AgentFinalAnswer): boolean {
  const text = normalizeText(answer.text);
  return text.includes('\n') || text.includes('- ') || text.includes('1.');
}

function hasFollowUps(answer: AgentFinalAnswer): boolean {
  return Array.isArray(answer.followUps) && answer.followUps.length > 0;
}

function confidencePenalty(answer: AgentFinalAnswer): number {
  const confidence =
    typeof answer.confidence === 'number' ? answer.confidence : 0.5;

  if (confidence >= 0.8) return 0;
  if (confidence >= 0.65) return 0.03;
  if (confidence >= 0.5) return 0.08;
  return 0.14;
}

function buildSuggestedActions(params: {
  issues: string[];
  failedToolCount: number;
  answerWeak: boolean;
  missingActionability: boolean;
}): string[] {
  const suggestions: string[] = [];

  if (params.failedToolCount > 0) {
    suggestions.push('Retry failed tool-backed steps with fallbacks enabled.');
  }

  if (params.answerWeak) {
    suggestions.push('Regenerate the final answer with stronger synthesis.');
  }

  if (params.missingActionability) {
    suggestions.push('Add a clearer next-step recommendation for the user.');
  }

  if (params.issues.length === 0) {
    suggestions.push('Execution quality is acceptable.');
  } else if (!suggestions.length) {
    suggestions.push('Request missing context from the user.');
  }

  return suggestions;
}

export function evaluateExecution(
  params: EvaluateExecutionParams,
): AgentEvaluationResult {
  const issues: string[] = [];

  const answerText = normalizeText(params.answer.text);
  const requiredToolSteps = getRequiredToolSteps(params.plan);
  const failedRequiredToolSteps = getFailedRequiredToolSteps(
    params.plan,
    params.toolResults,
  );
  const successfulToolResults = getSuccessfulToolResults(params.toolResults);
  const failedToolResults = getFailedToolResults(params.toolResults);

  const answerWeak = !hasUsefulAnswer(params.answer);
  const missingActionability = !hasActionability(params.answer);
  const missingStructure = !hasStructuredOutput(params.answer);
  const missingFollowUps = !hasFollowUps(params.answer);

  if (answerWeak) {
    issues.push('Final answer is too short or empty.');
  }

  if (failedRequiredToolSteps.length > 0) {
    issues.push(
      `Some required tool-backed steps did not succeed (${failedRequiredToolSteps.length}).`,
    );
  }

  if (
    requiredToolSteps.length > 0 &&
    successfulToolResults.length === 0
  ) {
    issues.push('No required tools completed successfully.');
  }

  if (!missingActionability) {
    // good
  } else {
    issues.push('Final answer does not clearly guide the next action.');
  }

  if (missingStructure) {
    issues.push('Final answer structure is weak.');
  }

  if (missingFollowUps) {
    issues.push('No follow-up suggestions were provided.');
  }

  let score = 1;

  if (answerWeak) score -= 0.28;
  if (failedRequiredToolSteps.length > 0) score -= 0.22;
  if (
    requiredToolSteps.length > 0 &&
    successfulToolResults.length === 0
  ) {
    score -= 0.18;
  }
  if (missingActionability) score -= 0.14;
  if (missingStructure) score -= 0.08;
  if (missingFollowUps) score -= 0.05;
  if (failedToolResults.length > 0 && failedRequiredToolSteps.length === 0) {
    score -= 0.04;
  }

  score -= confidencePenalty(params.answer);
  score = clampScore(score);

  const suggestedActions = buildSuggestedActions({
    issues,
    failedToolCount: failedRequiredToolSteps.length,
    answerWeak,
    missingActionability,
  });

  return {
    passed: score >= 0.7 && issues.length <= 2,
    score,
    issues,
    suggestedActions,
    metadata: {
      requiredToolStepCount: requiredToolSteps.length,
      failedRequiredToolStepCount: failedRequiredToolSteps.length,
      successfulToolCount: successfulToolResults.length,
      failedToolCount: failedToolResults.length,
      answerLength: answerText.length,
      followUpCount: params.answer.followUps?.length ?? 0,
      confidence: params.answer.confidence,
    },
  };
}
