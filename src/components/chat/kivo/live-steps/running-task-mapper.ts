import type { LiveStepContext, LiveStepStreamEvent } from './live-steps-types';
import type { RunningTask, RunningTaskPreviewType, RunningTaskStatus } from './running-task-types';

const MIN_VISIBLE_MS = 1300;

function normalizeText(value?: string): string {
  return (value || '').trim();
}

function isToolSignal(type: string): boolean {
  return ['tool_started', 'tool_completed', 'tool_failed'].includes(type);
}

function getPreviewType(tool?: string): RunningTaskPreviewType {
  const name = (tool || '').toLowerCase();
  if (name.includes('calendar')) return 'calendar';
  if (name.includes('memory')) return 'memory';
  if (name.includes('search') || name.includes('web') || name.includes('research')) return 'research';
  if (name) return 'tool';
  return 'generic';
}

function getTitle(previewType: RunningTaskPreviewType, toolName?: string): string {
  if (previewType === 'calendar') return 'Checking calendar';
  if (previewType === 'research') return 'Researching sources';
  if (previewType === 'memory') return 'Using saved context';
  if (toolName) return 'Working on task';
  return 'Preparing response';
}

function looksLikeSmallTalk(input?: string): boolean {
  if (!input) return false;
  return /^(hi|hello|hey|thanks|thank you|yo|good morning|good night|how are you|moi|hei|moikka|kiitos|okei|ok|joo)\b/i.test(input.trim());
}

export function mapRunningTask(
  events: LiveStepStreamEvent[],
  context: LiveStepContext,
): RunningTask | null {
  if (!events.length || looksLikeSmallTalk(context.latestUserContent)) return null;

  const startedAt = events.find((event) => isToolSignal(event.type))?.at;
  const toolEvents = events.filter((event) => isToolSignal(event.type));
  const toolStartedCount = toolEvents.filter((event) => event.type === 'tool_started').length;
  const hasActiveTools = toolEvents.some((event) => event.type === 'tool_started') && !events.some((event) => event.type === 'answer_completed');

  if (!toolStartedCount) return null;

  const isMultiStep = toolStartedCount >= 2 || context.taskDepth === 'multi' || context.taskDepth === 'complex';
  const isSlow = (context.elapsedMs || 0) >= MIN_VISIBLE_MS || Boolean(context.isStreaming);
  if (!isMultiStep || !isSlow) return null;

  const lastToolEvent = [...toolEvents].reverse().find((event) => !!event.tool);
  const previewType = getPreviewType(lastToolEvent?.tool || context.toolsUsed?.[0]);
  const runningEvent = [...events].reverse().find((event) => event.type === 'tool_started' || event.type === 'answer_delta');
  const currentStep = normalizeText(runningEvent?.label) || (runningEvent?.type === 'answer_delta' ? 'Writing summary' : 'Working...');

  const nextToolEvent = toolEvents.find((event) => event.type === 'tool_started' && event.at && runningEvent?.at && event.at > runningEvent.at);
  const nextStep = normalizeText(nextToolEvent?.label) || undefined;

  const completedTools = toolEvents.filter((event) => event.type === 'tool_completed').length;
  const failedTools = toolEvents.filter((event) => event.type === 'tool_failed').length;
  const progressTotal = Math.max(toolStartedCount, completedTools + (hasActiveTools ? 1 : 0));
  const progressCurrent = Math.min(progressTotal, Math.max(completedTools + (hasActiveTools ? 1 : 0), 1));

  const status: RunningTaskStatus = failedTools > 0 ? 'failed' : hasActiveTools ? 'running' : 'completed';
  const elapsedSeconds = Math.max(0, Math.floor((context.elapsedMs || (startedAt ? Date.now() - startedAt : 0)) / 1000));

  return {
    title: getTitle(previewType, lastToolEvent?.tool),
    status,
    elapsedSeconds,
    currentStep,
    nextStep,
    progressCurrent,
    progressTotal,
    toolName: lastToolEvent?.tool,
    previewType,
  };
}
