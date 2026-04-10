import { AgentContextV8, ToolResultV8 } from '../types';

type Leak = {
  merchant: string;
  category: string;
  monthlyCost: number;
  confidence: number;
};

const leakCatalog: Array<{ token: string; merchant: string; category: string; monthlyCost: number }> = [
  { token: 'netflix', merchant: 'Netflix', category: 'Streaming', monthlyCost: 15.49 },
  { token: 'spotify', merchant: 'Spotify', category: 'Streaming', monthlyCost: 11.99 },
  { token: 'gym', merchant: 'Gym Membership', category: 'Fitness', monthlyCost: 49 },
  { token: 'icloud', merchant: 'iCloud+', category: 'Cloud', monthlyCost: 9.99 },
  { token: 'amazon prime', merchant: 'Amazon Prime', category: 'Shopping', monthlyCost: 14.99 },
];

function detectLeakCandidates(text: string): Leak[] {
  const lower = text.toLowerCase();
  return leakCatalog
    .filter((item) => lower.includes(item.token))
    .map((item) => ({ ...item, confidence: 0.82 }))
    .sort((a, b) => b.monthlyCost - a.monthlyCost);
}

export async function detectLeaksTool(input: Record<string, unknown>, context: AgentContextV8): Promise<ToolResultV8> {
  const text = String(input.text || context.user.message || '');
  const leaks = detectLeakCandidates(text);
  const estimatedMonthlySavings = leaks.reduce((sum, leak) => sum + leak.monthlyCost * 0.6, 0);

  return {
    ok: true,
    tool: 'detect_leaks',
    output: {
      leaks,
      estimatedMonthlySavings: Number(estimatedMonthlySavings.toFixed(2)),
      leakCount: leaks.length,
    },
  };
}

export async function createSavingsPlanTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const horizonMonths = Number(input.horizonMonths) > 0 ? Number(input.horizonMonths) : 3;
  const plan = [
    { week: 1, action: 'Cancel low-value recurring services.', expectedMonthlySavings: 35 },
    { week: 2, action: 'Replace highest-cost subscription with annual/cheaper option.', expectedMonthlySavings: 20 },
    { week: 3, action: 'Set category spend caps and alerts.', expectedMonthlySavings: 15 },
  ];

  return {
    ok: true,
    tool: 'create_savings_plan',
    output: {
      horizonMonths,
      monthlySavingsTarget: 70,
      projectedHorizonSavings: horizonMonths * 70,
      plan,
      basedOnSummary: context.memory.summary,
    },
  };
}

export async function findAlternativesTool(
  _input: Record<string, unknown>,
  _context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'find_alternatives',
    output: {
      alternatives: [
        { from: 'Netflix Premium', to: 'Netflix Standard', monthlyDelta: 8 },
        { from: 'Spotify Premium Individual', to: 'Spotify Duo/Family split', monthlyDelta: 5 },
        { from: 'Commercial gym', to: 'Community gym', monthlyDelta: 20 },
      ],
      totalPotentialDelta: 33,
    },
  };
}

export async function draftCancellationTool(
  _input: Record<string, unknown>,
  _context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'draft_cancellation',
    output: {
      channel: 'email',
      draft: {
        subject: 'Cancellation Request',
        body:
          'Hello, please cancel my subscription at the end of the current billing cycle and confirm by email. Thank you.',
      },
    },
  };
}
