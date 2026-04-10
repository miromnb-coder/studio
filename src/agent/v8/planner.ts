import { ExecutionPlanV8, PlanStepV8, RouteResultV8 } from './types';

function step(
  id: string,
  title: string,
  tool: PlanStepV8['tool'],
  description: string,
  input: Record<string, unknown>,
  required = true,
): PlanStepV8 {
  return { id, title, tool, description, input, required };
}

export function createPlanV8(route: RouteResultV8, message: string): ExecutionPlanV8 {
  if (route.intent === 'finance') {
    return {
      intent: route.intent,
      mode: route.mode,
      summary: 'Load finance memory, detect leaks, rank alternatives, draft next actions.',
      steps: [
        step('1', 'Review your finance context', 'retrieve_structured_memory', 'Review your latest finance context.', {}),
        step('2', 'Check Gmail connection', 'check_gmail_connection', 'Check whether Gmail analysis is available.', {}),
        step('3', 'Detect spend leaks', 'detect_leaks', 'Find recurring leakage and estimate monthly savings.', { text: message }),
        step('4', 'Find cheaper alternatives', 'find_alternatives', 'Rank lower-cost alternatives for leak categories.', {
          text: message,
        }),
        step('5', 'Build savings plan', 'create_savings_plan', 'Create a pragmatic step-by-step savings plan.', {
          horizonMonths: 3,
        }),
        step('6', 'Draft cancellation message', 'draft_cancellation', 'Generate cancellation draft for top leak.', {}),
        step('7', 'Refresh dashboard summary', 'build_dashboard_snapshot', 'Refresh your dashboard snapshot.', {}),
        step('8', 'Generate smart recommendations', 'generate_proactive_insights', 'Generate practical recommendations.', {}),
        step('9', 'Save key outcomes', 'persist_memory', 'Save key outcomes for next time.', { source: 'finance' }),
      ],
    };
  }

  if (route.intent === 'gmail') {
    return {
      intent: route.intent,
      mode: route.mode,
      summary: 'Review mailbox intent, check Gmail connection, and prepare a direct email-focused response.',
      steps: [
        step('1', 'Review mailbox context', 'retrieve_semantic_memory', 'Review recent mailbox context.', {}),
        step('2', 'Check Gmail connection', 'check_gmail_connection', 'Check whether Gmail tools are available.', {}),
        step('3', 'Save key notes', 'persist_memory', 'Save important Gmail intent for continuity.', {
          source: 'gmail',
        }),
      ],
    };
  }

  if (route.intent === 'productivity') {
    return {
      intent: route.intent,
      mode: route.mode,
      summary: 'Review recent context, generate practical task/planning suggestions, and save notes.',
      steps: [
        step('1', 'Review recent context', 'retrieve_semantic_memory', 'Review recent conversation context.', {}),
        step('2', 'Generate productivity insights', 'generate_proactive_insights', 'Generate practical planning suggestions.', {
          text: message,
        }),
        step('3', 'Save key notes', 'persist_memory', 'Save important planning details.', { source: 'productivity' }),
      ],
    };
  }

  return {
    intent: route.intent,
    mode: route.mode,
    summary: 'Default to direct assistant response with lightweight context only.',
    steps: [
      step('1', 'Review recent context', 'retrieve_semantic_memory', 'Review recent conversation context.', {}),
      step('2', 'Save key notes', 'persist_memory', 'Save important new facts.', { source: 'general' }),
    ],
  };
}
