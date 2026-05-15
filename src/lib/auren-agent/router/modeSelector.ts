import type { AurenAgentInput, AurenIntentResult, AurenMode } from '../core/types';

const intentModeMap: Record<string, AurenMode> = {
  study_help: 'study',
  daily_planning: 'today',
  save_memory: 'memory',
  recall_memory: 'memory',
  focus_help: 'focus',
  tool_request: 'general',
  create_plan: 'general',
  general_chat: 'general',
  unknown: 'general',
};

export function selectMode(input: AurenAgentInput, intent: AurenIntentResult): AurenMode {
  if (input.mode) {
    return input.mode;
  }

  return intentModeMap[intent.intent] ?? 'general';
}
