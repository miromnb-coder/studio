import type {
  OperatorAction,
  OperatorActionBehavior,
  OperatorActionKind,
} from '@/types/operator-response';

export type OperatorActionExecutionContext = {
  answer?: string;
  nextStep?: string;
  userInput?: string;
  intent?: string;
};

export type ExecuteOperatorActionArgs = {
  action: OperatorAction;
  context?: OperatorActionExecutionContext;
  enqueuePrompt: (prompt: string) => void;
  navigate: (route: string) => void;
  openFlow?: (flowId: string, payload?: Record<string, unknown>) => void;
};

function clean(value?: string): string {
  return typeof value === 'string' ? value.trim() : '';
}

function inferRouteByKind(kind: OperatorActionKind): string | undefined {
  if (kind === 'planning' || kind === 'prioritization') return '/actions?type=planner';
  if (kind === 'finance' || kind === 'comparison') return '/money';
  if (kind === 'decision') return '/actions?type=compare';
  return undefined;
}

function buildContinuationPrompt(
  action: OperatorAction,
  context?: OperatorActionExecutionContext,
): string {
  const explicitPrompt = clean(action.prompt);
  if (explicitPrompt) return explicitPrompt;

  const userInput = clean(context?.userInput);
  const nextStep = clean(context?.nextStep);
  const answer = clean(context?.answer).slice(0, 280);
  const continuationContext = [nextStep, answer].filter(Boolean).join(' ');

  if (continuationContext) {
    return `Continue from your last recommendation "${continuationContext}". Execute this now: ${action.label}.`;
  }

  if (userInput) {
    return `Continue helping with "${userInput}". Execute this now: ${action.label}.`;
  }

  return `Continue and execute this next step: ${action.label}.`;
}

export function normalizeOperatorAction(
  action: OperatorAction,
  context?: OperatorActionExecutionContext,
): OperatorAction {
  const behavior: OperatorActionBehavior =
    action.behavior ||
    (action.route ? 'navigate' : action.kind === 'premium' ? 'navigate' : 'enqueue_prompt');
  const route =
    action.route ||
    (behavior === 'navigate'
      ? inferRouteByKind(action.kind) || '/actions'
      : undefined);

  return {
    ...action,
    behavior,
    route,
    prompt: buildContinuationPrompt(action, context),
  };
}

export function executeOperatorAction(args: ExecuteOperatorActionArgs) {
  const normalized = normalizeOperatorAction(args.action, args.context);

  if (normalized.behavior === 'navigate' && normalized.route) {
    args.navigate(normalized.route);
    return normalized;
  }

  if (normalized.behavior === 'open_flow') {
    const flowId =
      clean((normalized.payload?.flowId as string | undefined)) || normalized.id;
    args.openFlow?.(flowId, normalized.payload);
    return normalized;
  }

  if (normalized.prompt) {
    args.enqueuePrompt(normalized.prompt);
  }

  return normalized;
}
