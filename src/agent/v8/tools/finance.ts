import { AgentContextV8, ToolResultV8 } from '../types';

function normalizeFinanceEvents(events: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(events)) return [];
  return events.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object').slice(0, 12);
}

export async function financeReadTool(
  _input: Record<string, unknown>,
  context: AgentContextV8,
): Promise<ToolResultV8> {
  const financeProfile = context.memory.financeProfile || {};
  const financeEvents = normalizeFinanceEvents(context.memory.financeEvents);

  return {
    ok: true,
    tool: 'finance_read',
    output: {
      profile: financeProfile,
      events: financeEvents,
      hasFinanceProfile: Object.keys(financeProfile).length > 0,
      recurringSignals: financeEvents
        .filter((event) => String(event?.eventType || '').toLowerCase().includes('subscription'))
        .slice(0, 5),
    },
  };
}
