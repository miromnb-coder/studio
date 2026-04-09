import { AgentIntent, ExecutionPlan, PlanStep } from './types';

function makeStep(id: string, tool: PlanStep['tool'], reason: string, input: Record<string, unknown>): PlanStep {
  return { id, tool, reason, input };
}

export function createPlan(intent: AgentIntent, input: string): ExecutionPlan {
  switch (intent) {
    case 'finance':
      return {
        intent,
        summary: 'Run leak detection first, then produce a concise financial analysis.',
        steps: [
          makeStep('step-1', 'detect_leaks', 'Identify obvious recurring spend leaks first.', { text: input }),
          makeStep('step-2', 'analyze', 'Summarize key financial patterns and risk areas.', { text: input }),
        ],
      };

    case 'technical':
      return {
        intent,
        summary: 'Inspect technical context then provide implementation-focused reasoning.',
        steps: [
          makeStep('step-1', 'analyze', 'Extract architecture and error signals.', { text: input }),
          makeStep('step-2', 'general_reason', 'Provide pragmatic fix strategy.', { text: input }),
        ],
      };

    case 'analysis':
      return {
        intent,
        summary: 'Perform structured analysis and then synthesize direct recommendations.',
        steps: [
          makeStep('step-1', 'analyze', 'Generate structured insights.', { text: input }),
          makeStep('step-2', 'general_reason', 'Turn insights into recommendations.', { text: input }),
        ],
      };

    case 'general':
    default:
      return {
        intent: 'general',
        summary: 'Use general reasoning with optional deep analysis when helpful.',
        steps: [
          makeStep('step-1', 'general_reason', 'Handle broad requests reliably.', { text: input }),
        ],
      };
  }
}
