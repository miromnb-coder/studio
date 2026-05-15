import type { AurenAgentInput, AurenIntent, AurenIntentResult } from '../core/types';

function hasAny(message: string, terms: string[]) {
  const value = message.toLowerCase();
  return terms.some((term) => value.includes(term));
}

function createIntentResult(
  intent: AurenIntent,
  confidence: number,
  reasons: string[],
  needsMemory = false,
  needsTools = false,
): AurenIntentResult {
  return {
    intent,
    confidence,
    reasons,
    needsMemory,
    needsTools,
  };
}

export function routeIntent(input: AurenAgentInput): AurenIntentResult {
  const message = input.message.trim();

  if (!message) {
    return createIntentResult('unknown', 0.2, ['Empty message.']);
  }

  const normalized = message.toLowerCase();

  if (hasAny(normalized, ['muista', 'remember', 'save this', 'tallenna'])) {
    return createIntentResult('save_memory', 0.82, ['User appears to be asking Auren to remember something.'], true);
  }

  if (hasAny(normalized, ['mitä muistat', 'what do you remember', 'memory', 'muisti'])) {
    return createIntentResult('recall_memory', 0.78, ['User appears to be asking about memory.'], true);
  }

  if (hasAny(normalized, ['study', 'opisk', 'exam', 'koe', 'quiz', 'testaa', 'läksy'])) {
    return createIntentResult('study_help', 0.76, ['Message looks related to studying or learning.'], true);
  }

  if (hasAny(normalized, ['today', 'tänään', 'päivä', 'schedule', 'kalenteri'])) {
    return createIntentResult('daily_planning', 0.72, ['Message looks related to the day or schedule.'], true, true);
  }

  if (hasAny(normalized, ['plan', 'suunnitel', 'roadmap', 'steps', 'vaiheet'])) {
    return createIntentResult('create_plan', 0.7, ['Message looks like a planning request.'], true);
  }

  if (hasAny(normalized, ['focus', 'keskity', 'pomodoro', 'session'])) {
    return createIntentResult('focus_help', 0.68, ['Message looks related to focus or work sessions.'], true);
  }

  if (hasAny(normalized, ['gmail', 'calendar', 'kalenteri', 'tasks', 'notes', 'finance', 'money', 'raha'])) {
    return createIntentResult('tool_request', 0.62, ['Message mentions a future tool area.'], true, true);
  }

  return createIntentResult('general_chat', 0.58, ['No specific route matched; using general chat.'], true);
}
