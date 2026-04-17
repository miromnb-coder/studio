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
  status: 'Thinking...',
  visualState: 'thinking',
};

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getToolStatus(tool: string): ThinkingPresentation {
  const normalized = tool.trim().toLowerCase();

  if (!normalized) {
    return {
      visible: true,
      status: 'Building plan...',
      visualState: 'planning',
    };
  }

  if (normalized.includes('gmail') || normalized === 'email') {
    return {
      visible: true,
      status: 'Checking inbox…',
      visualState: 'gmail',
    };
  }

  if (normalized.includes('calendar') || normalized.includes('schedule')) {
    return {
      visible: true,
      status: 'Reading schedule...',
      visualState: 'calendar',
    };
  }

  if (normalized.includes('memory')) {
    return {
      visible: true,
      status: 'Searching memory...',
      visualState: 'memory',
    };
  }

  return {
    visible: true,
    status: `Analyzing ${toTitleCase(normalized)}…`,
    visualState: 'planning',
  };
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
      return {
        visible: true,
        status: 'Thinking...',
        visualState: 'thinking',
      };
    case 'memory_started':
      return {
        visible: true,
        status: 'Searching memory...',
        visualState: 'memory',
      };
    case 'tool_started':
      return getToolStatus('');
    case 'planning_started':
      return {
        visible: true,
        status: 'Building a plan…',
        visualState: 'planning',
      };
    case 'generator_started':
      return {
        visible: true,
        status: 'Writing response...',
        visualState: 'writing',
      };
    case 'final_started':
      return {
        visible: true,
        status: 'Finalizing...',
        visualState: 'finalizing',
      };
    default:
      return DEFAULT_THINKING_STATE;
  }
}

function inferThinkingEventFromStep(step?: AgentResponseStep): AgentThinkingEvent {
  if (!step) return 'generator_started';

  const action = String(step.action || '').toLowerCase();
  const tool = String(step.tool || '').toLowerCase();

  if (tool) {
    return `tool_started:${tool}`;
  }

  if (action.includes('router') || action.includes('analyz')) {
    return 'router_started';
  }

  if (action.includes('memory')) {
    return 'memory_started';
  }

  if (action.includes('plan')) {
    return 'planning_started';
  }

  if (action.includes('final')) {
    return 'final_started';
  }

  if (action.includes('tool')) {
    return 'tool_started';
  }

  return 'generator_started';
}

export function mapAgentStepsToThinkingState(args: {
  isStreaming: boolean;
  steps?: AgentResponseStep[];
}): ThinkingPresentation | null {
  if (!args.isStreaming) {
    return mapAgentEventToThinkingState('done');
  }

  const runningStep = [...(args.steps ?? [])]
    .reverse()
    .find((step) => step.status === 'running' || step.status === 'pending');

  const completedStepCount = (args.steps ?? []).filter(
    (step) => step.status === 'completed' || step.status === 'skipped',
  ).length;

  if (runningStep) {
    return mapAgentEventToThinkingState(inferThinkingEventFromStep(runningStep));
  }

  if (completedStepCount > 0) {
    return mapAgentEventToThinkingState('final_started');
  }

  return mapAgentEventToThinkingState('router_started');
}
