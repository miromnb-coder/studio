import { AgentIntentV8, ExecutionResultV8 } from './types';

type VerificationResult = {
  passed: boolean;
  correctedStructuredData: Record<string, unknown>;
  notes: string[];
};

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function verifyExecutionV8(intent: AgentIntentV8, execution: ExecutionResultV8): VerificationResult {
  const notes: string[] = [];
  const corrected: Record<string, unknown> = { ...execution.structuredData };

  if (!isObject(execution.structuredData) || Object.keys(execution.structuredData).length === 0) {
    notes.push('Structured data was empty; injected fallback envelope.');
    corrected.fallback = { reason: 'No structured data available.' };
  }

  if (intent === 'finance') {
    const leaks = (corrected.detect_leaks as Record<string, unknown> | undefined) || {};
    const leakCount = typeof leaks.leakCount === 'number' ? leaks.leakCount : 0;
    const estimatedMonthlySavings =
      typeof leaks.estimatedMonthlySavings === 'number' ? leaks.estimatedMonthlySavings : 0;

    if (estimatedMonthlySavings < 0) {
      notes.push('Estimated monthly savings was negative; corrected to 0.');
      leaks.estimatedMonthlySavings = 0;
      corrected.detect_leaks = leaks;
    }

    if (leakCount > 0 && estimatedMonthlySavings === 0) {
      notes.push('Leak count/savings mismatch; inferred conservative savings.');
      leaks.estimatedMonthlySavings = Number((leakCount * 5).toFixed(2));
      corrected.detect_leaks = leaks;
    }
  }

  const hasActions = Object.keys(corrected).some((key) => key.includes('plan') || key.includes('suggest') || key.includes('insights'));
  if (!hasActions) {
    notes.push('No action-oriented artifacts found; added default next actions.');
    corrected.default_actions = [
      'Review top findings and pick one action to complete today.',
      'Confirm constraints (budget, deadline, risk tolerance).',
    ];
  }

  return {
    passed: notes.length === 0,
    correctedStructuredData: corrected,
    notes,
  };
}
