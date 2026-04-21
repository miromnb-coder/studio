import { KIVO_EXECUTION_PRESETS } from './presets';
import type {
  KivoExecutionInput,
  KivoExecutionPresentation,
  KivoExecutionStep,
  KivoExecutionStepState,
} from './types';

function resolveStepState(
  stepId: string,
  activeStepId?: string,
  doneStepIds?: string[],
  errorStepIds?: string[],
): KivoExecutionStepState {
  if (errorStepIds?.includes(stepId)) return 'error';
  if (doneStepIds?.includes(stepId)) return 'done';
  if (activeStepId === stepId) return 'active';
  return 'pending';
}

export function getExecutionPresentation(
  input?: KivoExecutionInput,
): KivoExecutionPresentation {
  if (!input) {
    return {
      mode: 'text_only',
    };
  }

  const intent = input.intent ?? 'general';
  const preset = KIVO_EXECUTION_PRESETS[intent];

  if (input.forceMode === 'text_only') {
    return {
      mode: 'text_only',
      introText: input.introText,
    };
  }

  if (input.forceMode === 'thinking') {
    return {
      mode: 'thinking',
      introText: input.introText,
      statusText: input.statusText ?? 'Thinking...',
    };
  }

  const steps: KivoExecutionStep[] = preset.steps.map((step) => ({
    ...step,
    state: resolveStepState(
      step.id,
      input.activeStepId,
      input.doneStepIds,
      input.errorStepIds,
    ),
  }));

  const hasVisibleExecution =
    (input.toolCount ?? preset.tools.length) > 0 ||
    steps.length > 1 ||
    input.forceMode === 'execution';

  if (!hasVisibleExecution) {
    return {
      mode: 'status',
      introText: input.introText,
      statusText: input.statusText ?? preset.title,
      tools: preset.tools,
    };
  }

  return {
    mode: input.forceMode ?? 'execution',
    title: preset.title,
    introText: input.introText,
    statusText:
      input.statusText ??
      steps.find((step) => step.state === 'active')?.description ??
      'Working on it...',
    tools: preset.tools,
    steps,
  };
}
