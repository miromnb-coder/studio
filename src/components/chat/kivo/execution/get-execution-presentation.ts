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

function buildSteps(
  input: KivoExecutionInput,
  presetSteps: KivoExecutionStep[],
): KivoExecutionStep[] {
  return presetSteps.map((step) => ({
    ...step,
    state: resolveStepState(
      step.id,
      input.activeStepId,
      input.doneStepIds,
      input.errorStepIds,
    ),
  }));
}

function countActiveTools(
  tools: KivoExecutionTool[] | undefined,
  toolCount?: number,
): number {
  if (typeof toolCount === 'number' && Number.isFinite(toolCount)) {
    return Math.max(0, toolCount);
  }
  return tools?.length ?? 0;
}

function countVisibleProgress(steps: KivoExecutionStep[]): number {
  return steps.filter(
    (step) =>
      step.state === 'active' ||
      step.state === 'done' ||
      step.state === 'error',
  ).length;
}

function resolveStatusText(
  input: KivoExecutionInput,
  steps: KivoExecutionStep[],
  fallbackTitle: string,
): string {
  if (typeof input.statusText === 'string' && input.statusText.trim().length > 0) {
    return input.statusText.trim();
  }

  const errored = steps.find((step) => step.state === 'error');
  if (errored?.description) return errored.description;

  const active = steps.find((step) => step.state === 'active');
  if (active?.description) return active.description;

  const doneCount = steps.filter((step) => step.state === 'done').length;
  if (doneCount > 0 && doneCount === steps.length && steps.length > 0) {
    return 'Completed';
  }

  return fallbackTitle;
}

function resolveIntroText(
  input: KivoExecutionInput,
  fallbackTitle: string,
): string | undefined {
  if (typeof input.introText === 'string' && input.introText.trim().length > 0) {
    return input.introText.trim();
  }

  switch (input.intent) {
    case 'email':
      return 'Okay — I’ll check this and put together the right response.';
    case 'calendar':
      return 'Okay — I’ll review this and organize the next step.';
    case 'browser':
      return 'Okay — I’ll look into this and prepare the best answer.';
    case 'memory':
      return 'Okay — I’ll pull the relevant context and use it here.';
    case 'files':
      return 'Okay — I’ll review the material and summarize what matters.';
    default:
      return fallbackTitle ? undefined : 'Okay — I’ll think this through.';
  }
}

function shouldShowThinking(params: {
  input: KivoExecutionInput;
  progressCount: number;
  toolCount: number;
}): boolean {
  const { input, progressCount, toolCount } = params;

  if (input.forceMode === 'thinking') return true;
  if (input.forceMode === 'status') return false;
  if (input.forceMode === 'execution') return false;

  if (toolCount > 0) return false;
  if (input.activeStepId) return true;
  if (progressCount > 0) return true;

  return true;
}

function shouldShowExecution(params: {
  input: KivoExecutionInput;
  progressCount: number;
  toolCount: number;
  hasErrors: boolean;
}): boolean {
  const { input, progressCount, toolCount, hasErrors } = params;

  if (input.forceMode === 'execution') return true;
  if (input.forceMode === 'thinking') return false;
  if (input.forceMode === 'text_only') return false;

  if (hasErrors) return true;
  if (toolCount > 0) return true;
  if (progressCount >= 2) return true;

  return false;
}

function filterVisibleSteps(steps: KivoExecutionStep[]): KivoExecutionStep[] {
  const visible = steps.filter(
    (step) =>
      step.state === 'active' ||
      step.state === 'done' ||
      step.state === 'error',
  );

  return visible.length > 0 ? visible : steps.slice(0, 3);
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
      introText: resolveIntroText(input, preset.title),
      intent,
    };
  }

  const allSteps = buildSteps(input, preset.steps);
  const visibleSteps = filterVisibleSteps(allSteps);
  const toolCount = countActiveTools(preset.tools, input.toolCount);
  const progressCount = countVisibleProgress(allSteps);
  const hasErrors = allSteps.some((step) => step.state === 'error');
  const statusText = resolveStatusText(input, allSteps, preset.title);
  const introText = resolveIntroText(input, preset.title);

  if (
    shouldShowThinking({
      input,
      progressCount,
      toolCount,
    })
  ) {
    return {
      mode: 'thinking',
      intent,
      introText,
      statusText,
      tools: toolCount > 0 ? preset.tools : undefined,
    };
  }

  if (
    shouldShowExecution({
      input,
      progressCount,
      toolCount,
      hasErrors,
    })
  ) {
    return {
      mode: 'execution',
      intent,
      title: preset.title,
      introText,
      statusText,
      tools: toolCount > 0 ? preset.tools : undefined,
      steps: visibleSteps,
    };
  }

  return {
    mode: 'status',
    intent,
    introText,
    statusText,
    tools: toolCount > 0 ? preset.tools : undefined,
  };
}
