import type {
  AgentResponseMetadata,
  AgentResponseStep,
} from '@/types/agent-response';
import type {
  AgentStep,
  AgentStepLike,
  ChatStreamEvent,
} from '../app-store-types';

export const STREAM_STEP_EVENT_TYPES = new Set<ChatStreamEvent['type']>([
  'router_started',
  'router_completed',
  'planning_started',
  'planning_completed',
  'memory_started',
  'memory_completed',
  'tool_started',
  'tool_completed',
]);

export function eventStatusToStepStatus(
  type: ChatStreamEvent['type'],
  explicitStatus?: string,
): 'running' | 'completed' | 'failed' {
  if (explicitStatus === 'failed') return 'failed';
  if (type.endsWith('_completed')) return 'completed';
  return 'running';
}

export function normalizeStepStatus(
  status: unknown,
): 'running' | 'completed' | 'failed' {
  if (status === 'failed') return 'failed';
  if (status === 'running' || status === 'pending') return 'running';
  return 'completed';
}

export function asStepArray(value: unknown): AgentStepLike[] {
  return Array.isArray(value)
    ? value.filter((item): item is AgentStepLike => Boolean(item && typeof item === 'object'))
    : [];
}

export function mergeAgentMetadata(
  incoming?: AgentResponseMetadata,
  fallbackSteps?: Array<{ action: string; status: string; summary?: string }>,
): AgentResponseMetadata {
  const steps =
    Array.isArray(incoming?.steps) && incoming.steps.length > 0
      ? incoming.steps
      : fallbackSteps ?? [];

  const structuredData =
    incoming?.structuredData && typeof incoming.structuredData === 'object'
      ? incoming.structuredData
      : {};

  return {
    intent: incoming?.intent ?? 'general',
    plan: incoming?.plan ?? 'No plan provided.',
    steps,
    structuredData,
    suggestedActions: Array.isArray(incoming?.suggestedActions)
      ? incoming.suggestedActions
      : [],
    operatorModules: Array.isArray(incoming?.operatorModules)
      ? incoming.operatorModules
      : [],
    memoryUsed: incoming?.memoryUsed,
    iterationCount: incoming?.iterationCount,
    verificationPassed: incoming?.verificationPassed,
  };
}

export function deriveActiveStepsFromMetadata(
  metadata?: AgentResponseMetadata,
  fallback: AgentStep[] = [],
): AgentStep[] {
  const rawSteps = asStepArray(metadata?.steps);

  if (rawSteps.length > 0) {
    return rawSteps.map((step, index) => ({
      id: step.id || `${step.action || step.label || 'step'}-${index}`.toLowerCase().replace(/\s+/g, '-'),
      label: step.action || step.label || `Step ${index + 1}`,
      status: normalizeStepStatus(step.status),
    }));
  }

  return fallback.map((step) => ({
    ...step,
    status: normalizeStepStatus(step.status),
  }));
}

export function upsertLiveStep(
  steps: AgentResponseStep[],
  event: Extract<ChatStreamEvent, { stepId?: string; label?: string }>,
): AgentResponseStep[] {
  const label = String(event.label || '').trim();
  if (!label) return steps;

  const stepId = String(event.stepId || '').trim();
  const status = eventStatusToStepStatus(event.type, event.status);

  const findIndex = steps.findIndex((step) => {
    const existingId =
      typeof (step as AgentStepLike).id === 'string'
        ? (step as AgentStepLike).id
        : '';

    if (stepId && existingId === stepId) return true;

    const action = String(step.action || '').trim().toLowerCase();
    const tool = String(step.tool || '').trim().toLowerCase();

    return (
      action === label.toLowerCase() &&
      tool === String(event.tool || '').trim().toLowerCase()
    );
  });

  const nextStep: AgentResponseStep = {
    id: stepId || undefined,
    action: label,
    status,
    summary: event.summary,
    tool: event.tool,
    error: event.error,
  };

  if (findIndex === -1) {
    return [...steps, nextStep];
  }

  return steps.map((step, index) => {
    if (index !== findIndex) return step;

    const existingStatus = normalizeStepStatus(step.status);
    const mergedStatus =
      status === 'failed' || existingStatus === 'failed'
        ? 'failed'
        : status === 'completed' || existingStatus === 'completed'
          ? 'completed'
          : 'running';

    return {
      ...step,
      ...nextStep,
      id: stepId || (step as AgentStepLike).id,
      action: label,
      status: mergedStatus,
      summary: nextStep.summary || step.summary,
      tool: nextStep.tool || step.tool,
      error: nextStep.error || step.error,
    };
  });
}
