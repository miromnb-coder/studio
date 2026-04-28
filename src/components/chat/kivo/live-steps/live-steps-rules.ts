import type { LiveStep, LiveStepContext } from './live-steps-types';

const SLOW_RESPONSE_MS = 1300;

function looksLikeSmallTalk(input?: string) {
  if (!input) return false;
  const text = input.trim().toLowerCase();
  if (!text) return false;

  return /^(hi|hello|hey|thanks|thank you|yo|good morning|good night|how are you|moi|hei|moikka|kiitos|okei|ok|joo)\b/.test(text);
}

export function shouldShowLiveSteps(steps: LiveStep[], context: LiveStepContext): boolean {
  if (!steps.length) return false;

  const smallTalk = looksLikeSmallTalk(context.latestUserContent);
  if (smallTalk) return false;

  const hasToolStep = steps.some((step) => step.kind === 'tool' || step.kind === 'search' || step.kind === 'calendar');
  const hasMemoryStep = context.memoryUsed || steps.some((step) => step.kind === 'memory');
  const isMultiStep = steps.length >= 3 || context.taskDepth === 'multi' || context.taskDepth === 'complex';
  const deepReasoning = ['deep', 'expert'].includes((context.reasoningDepth || '').toLowerCase());
  const slowResponse = (context.elapsedMs || 0) >= SLOW_RESPONSE_MS;
  const agentMode = ['agent', 'operator'].includes((context.mode || '').toLowerCase());

  const usefulSignal = hasToolStep || hasMemoryStep || isMultiStep || deepReasoning || slowResponse || agentMode;
  if (!usefulSignal) return false;

  const shortReply = (context.contentLength || 0) > 0 && (context.contentLength || 0) < 80 && !context.isStreaming;
  if (shortReply && !hasToolStep && !slowResponse) return false;

  return true;
}

export function getVisibleLiveSteps(steps: LiveStep[], maxVisible = 4): LiveStep[] {
  if (steps.length <= maxVisible) return steps;

  const runningOrError = steps.filter((step) => step.status === 'running' || step.status === 'queued' || step.status === 'error');
  const completed = steps.filter((step) => step.status === 'done');

  const keepTailCompleted = completed.slice(-Math.max(0, maxVisible - runningOrError.length));
  return [...runningOrError, ...keepTailCompleted].slice(-maxVisible);
}
