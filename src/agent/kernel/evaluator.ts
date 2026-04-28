import type { KernelExecutionPlan } from './planner';

export type KernelAnswerQuality = {
  score: number;
  issues: string[];
  shouldRepair: boolean;
};

export function assessAnswerQuality(
  answer: string,
  plan: KernelExecutionPlan,
  toolFailures: number,
): KernelAnswerQuality {
  const issues: string[] = [];
  const trimmed = answer.trim();

  if (trimmed.length < 80 && plan.taskDepth !== 'quick') issues.push('Answer is too short for requested depth.');
  if (!/[\n\-•]|\d+\./.test(trimmed) && (plan.taskDepth === 'deep' || plan.reasoningDepth === 'expert')) {
    issues.push('Answer lacks structured action format.');
  }
  if (!/next action|next step|first step|first action/i.test(trimmed)) issues.push('No clear next action stated.');
  if (toolFailures > 0 && !/missing|unavailable|disconnected|fallback/i.test(trimmed)) {
    issues.push('Missing context limitations were not clearly acknowledged.');
  }
  if (plan.reasoningDepth === 'expert' && !/risk|trade-?off|assumption/i.test(trimmed)) {
    issues.push('Expert-mode response should include tradeoffs or risks.');
  }

  const score = Math.max(0, 1 - issues.length * 0.2);
  return { score, issues, shouldRepair: issues.length >= 2 };
}
