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
        step('1', 'Load structured memory', 'retrieve_structured_memory', 'Load relevant user finance memory.', {}),
        step('2', 'Check Gmail integration', 'check_gmail_connection', 'Detect whether finance import from Gmail is available.', {}),
        step('3', 'Detect spend leaks', 'detect_leaks', 'Find recurring leakage and estimate monthly savings.', { text: message }),
        step('4', 'Find cheaper alternatives', 'find_alternatives', 'Rank lower-cost alternatives for leak categories.', {
          text: message,
        }),
        step('5', 'Build savings plan', 'create_savings_plan', 'Create a pragmatic step-by-step savings plan.', {
          horizonMonths: 3,
        }),
        step('6', 'Draft cancellation message', 'draft_cancellation', 'Generate cancellation draft for top leak.', {}),
        step('7', 'Build dashboard snapshot', 'build_dashboard_snapshot', 'Create a finance-card ready snapshot.', {}),
        step('8', 'Generate proactive insights', 'generate_proactive_insights', 'Generate proactive next insights.', {}),
        step('9', 'Persist important memory', 'persist_memory', 'Persist only high-value decisions.', { source: 'finance' }),
      ],
    };
  }

  if (route.intent === 'technical') {
    return {
      intent: route.intent,
      mode: route.mode,
      summary: 'Load technical memory, analyze error, suggest fix, and persist key findings.',
      steps: [
        step('1', 'Load semantic memory', 'retrieve_semantic_memory', 'Load recent technical context.', {}),
        step('2', 'Analyze error', 'analyze_error', 'Extract probable root causes.', { text: message }),
        step('3', 'Suggest fix', 'suggest_fix', 'Return fix strategy and patch plan.', { text: message }),
        step('4', 'Persist important memory', 'persist_memory', 'Persist only durable technical preferences.', {
          source: 'technical',
        }),
      ],
    };
  }

  return {
    intent: route.intent,
    mode: route.mode,
    summary: 'Retrieve memory, generate insights, and keep response actionable.',
    steps: [
      step('1', 'Load semantic memory', 'retrieve_semantic_memory', 'Load relevant conversation memory.', {}),
      step('2', 'Generate proactive insights', 'generate_proactive_insights', 'Generate high-signal insights.', {
        text: message,
      }),
      step('3', 'Persist important memory', 'persist_memory', 'Persist only important new facts.', { source: 'general' }),
    ],
  };
}
