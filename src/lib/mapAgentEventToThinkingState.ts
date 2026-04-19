import type { AgentResponseStep } from '@/types/agent-response';
import type { KivoThinkingVisualState } from '@/components/chat/KivoThinkingState';

type AgentEventType =
  | 'router_started'
  | 'memory_started'
  | 'tool_started'
  | 'planning_started'
  | 'generator_started'
  | 'final_started'
  | 'done'
  | 'error';

export type AgentThinkingEvent = AgentEventType | `tool_started:${string}`;

export type ThinkingPresentation = {
  visible: boolean;
  status: string;
  visualState: KivoThinkingVisualState;
};

const DEFAULT_THINKING_STATE: ThinkingPresentation = {
  visible: true,
  status: 'Analyzing your request',
  visualState: 'thinking',
};

function normalize(value?: string): string {
  return (value ?? '').trim().toLowerCase();
}

function clean(value?: string): string {
  return (value ?? '').trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function fromVisualState(
  visualState: KivoThinkingVisualState,
  status: string,
): ThinkingPresentation {
  return {
    visible: true,
    status,
    visualState,
  };
}

function getToolStatus(tool: string): ThinkingPresentation {
  const normalized = normalize(tool);

  if (!normalized) {
    return fromVisualState('planning', 'Planning the response');
  }

  if (normalized.includes('gmail') || normalized.includes('email')) {
    return fromVisualState('gmail', 'Checking inbox context');
  }

  if (normalized.includes('calendar') || normalized.includes('schedule')) {
    return fromVisualState('calendar', 'Reviewing schedule context');
  }

  if (normalized.includes('memory')) {
    return fromVisualState('memory', 'Checking memory');
  }

  if (
    normalized.includes('browser') ||
    normalized.includes('search') ||
    normalized.includes('web') ||
    normalized.includes('compare')
  ) {
    return fromVisualState('planning', 'Checking sources');
  }

  if (
    normalized.includes('write') ||
    normalized.includes('generate') ||
    normalized.includes('response')
  ) {
    return fromVisualState('writing', 'Writing the answer');
  }

  return fromVisualState(
    'planning',
    `Working with ${toTitleCase(normalized)}`,
  );
}

export function mapAgentEventToThinkingState(
  event: AgentThinkingEvent,
): ThinkingPresentation | null {
  if (event === 'done' || event === 'error') return null;

  if (event.startsWith('tool_started:')) {
    return getToolStatus(event.replace('tool_started:', ''));
  }

  switch (event) {
    case 'router_started':
      return fromVisualState('thinking', 'Analyzing your request');
    case 'memory_started':
      return fromVisualState('memory', 'Checking memory');
    case 'tool_started':
      return fromVisualState('planning', 'Checking sources');
    case 'planning_started':
      return fromVisualState('planning', 'Planning the response');
    case 'generator_started':
      return fromVisualState('writing', 'Writing the answer');
    case 'final_started':
      return fromVisualState('finalizing', 'Finalizing response');
    default:
      return DEFAULT_THINKING_STATE;
  }
}

function inferThinkingEventFromStep(step?: AgentResponseStep): AgentThinkingEvent {
  if (!step) return 'generator_started';

  const action = normalize(step.action);
  const tool = normalize(step.tool);
  const summary = normalize(step.summary);

  if (tool) {
    return `tool_started:${tool}`;
  }

  if (
    action.includes('router') ||
    action.includes('analyz') ||
    summary.includes('analyz') ||
    summary.includes('intent')
  ) {
    return 'router_started';
  }

  if (action.includes('memory') || summary.includes('memory')) {
    return 'memory_started';
  }

  if (
    action.includes('plan') ||
    summary.includes('plan') ||
    summary.includes('next step')
  ) {
    return 'planning_started';
  }

  if (
    action.includes('final') ||
    summary.includes('final') ||
    summary.includes('polish')
  ) {
    return 'final_started';
  }

  if (
    action.includes('write') ||
    action.includes('generat') ||
    action.includes('respond') ||
    summary.includes('writing') ||
    summary.includes('response')
  ) {
    return 'generator_started';
  }

  if (action.includes('tool')) {
    return 'tool_started';
  }

  return 'generator_started';
}

function stepPriority(step: AgentResponseStep): number {
  const status = normalize(step.status);

  if (status === 'running') return 4;
  if (status === 'pending') return 3;
  if (status === 'completed') return 2;
  if (status === 'skipped') return 1;
  return 0;
}

export function mapAgentStepsToThinkingState(args: {
  isStreaming: boolean;
  steps?: AgentResponseStep[];
}): ThinkingPresentation | null {
  if (!args.isStreaming) {
    return null;
  }

  const steps = args.steps ?? [];

  const activeStep = [...steps]
    .reverse()
    .sort((a, b) => stepPriority(b) - stepPriority(a))
    .find((step) => {
      const status = normalize(step.status);
      return status === 'running' || status === 'pending';
    });

  if (activeStep) {
    const inferred = inferThinkingEventFromStep(activeStep);
    const mapped = mapAgentEventToThinkingState(inferred);

    if (!mapped) return DEFAULT_THINKING_STATE;

    const directSummary = clean(activeStep.summary);
    if (
      directSummary &&
      directSummary.length <= 80 &&
      !directSummary.toLowerCase().startsWith('using ')
    ) {
      return {
        ...mapped,
        status: directSummary,
      };
    }

    return mapped;
  }

  const completedStepCount = steps.filter((step) => {
    const status = normalize(step.status);
    return status === 'completed' || status === 'skipped';
  }).length;

  if (completedStepCount > 0) {
    return mapAgentEventToThinkingState('final_started');
  }

  return mapAgentEventToThinkingState('router_started');
}
