import { AgentContextV8, ToolResultV8 } from '../types';

export async function buildDashboardSnapshotTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  return {
    ok: true,
    tool: 'build_dashboard_snapshot',
    output: {
      plan: context.environment.productState.plan,
      usage: context.environment.productState.usage,
      cards: ['savings_opportunity', 'recurring_costs', 'next_actions'],
    },
  };
}

export async function generateProactiveInsightsTool(
  input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const text = String(input.text || context.user.message || '').toLowerCase();
  const insights: string[] = [];

  if (text.includes('save') || text.includes('budget') || context.memory.summaryType === 'finance') {
    insights.push('Shift one non-essential recurring charge to an annual plan to reduce monthly burn.');
  }

  if (context.environment.productState.plan === 'FREE') {
    insights.push('Premium unlocks advanced finance actions like one-tap cancellation drafting.');
  }

  if (context.environment.productState.gmailConnected) {
    insights.push('Gmail is connected, so invoice import is available when finance import is triggered.');
  }

  if (!insights.length) {
    insights.push('No immediate risk found; continue with weekly review cadence.');
  }

  return {
    ok: true,
    tool: 'generate_proactive_insights',
    output: { insights },
  };
}
