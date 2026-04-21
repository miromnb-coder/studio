import { KIVO_EXECUTION_PRESETS } from './presets';
import type {
  KivoExecutionInput,
  KivoExecutionPresentation,
  KivoExecutionStep,
  KivoExecutionStepState,
  KivoExecutionTool,
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

function buildSteps(input: KivoExecutionInput, presetSteps: KivoExecutionStep[]): KivoExecutionStep[] {
  return presetSteps.map((step) => ({
    ...step,
    state: resolveStepState(step.id, input.activeStepId, input.doneStepIds, input.errorStepIds),
  }));
}

function countActiveTools(tools: KivoExecutionTool[] | undefined, toolCount?: number): number {
  if (typeof toolCount === 'number' && Number.isFinite(toolCount)) {
    return Math.max(0, toolCount);
  }
  return tools?.length ?? 0;
}

function hasMeaningfulExecution(
  steps: KivoExecutionStep[],
  tools: KivoExecutionTool[] | undefined,
  toolCount?: number,
  forceMode?: KivoExecutionInput['forceMode'],
): boolean {
  if (forceMode === 'execution') return true;
  if (countActiveTools(tools, toolCount) > 0) return true;
  if (steps.some((step) => step.state === 'active' || step.state === 'done' || step.state === 'error')) {
    return true;
  }
  return false;
}

function resolveStatusText(
  input: KivoExecutionInput,
  steps: KivoExecutionStep[],
  fallbackTitle: string,
): string {
  if (input.statusText) return input.statusText;

  const errored = steps.find((step) => step.state === 'error');
  if (errored?.description) return errored.description;

  const active = steps.find((step) => step.state === 'active');
  if (active?.description) return active.description;

  const completedCount = steps.filter((step) => step.state === 'done').length;
  if (completedCount > 0 && completedCount === steps.length && steps.length > 0) {
    return 'Completed';
  }

  return fallbackTitle;
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
      intent,
    };
  }

  if (input.forceMode === 'thinking') {
    return {
      mode: 'thinking',
      introText: input.introText,
      intent,
      statusText: input.statusText ?? 'Thinking...',
    };
  }

  const steps = buildSteps(input, preset.steps);
  const tools = preset.tools;
  const statusText = resolveStatusText(input, steps, preset.title);
  const visibleExecution = hasMeaningfulExecution(steps, tools, input.toolCount, input.forceMode);

  if (!visibleExecution) {
    return {
      mode: 'status',
      intent,
      introText: input.introText,
      statusText,
      tools,
    };
  }

  return {
    mode: 'execution',
    intent,
    title: preset.title,
    introText: input.introText,
    statusText,
    tools,
    steps,
  };
}
