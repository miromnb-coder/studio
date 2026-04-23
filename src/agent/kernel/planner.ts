import type { KernelRequest } from './types';
import type { KernelToolName } from './tool-registry';

export type KernelExecutionPlan = {
  mode: 'fast' | 'agent';
  tools: KernelToolName[];
  reasoning: 'light' | 'structured';
  useBuiltInWebSearch: boolean;
};

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function needsFreshWebInfo(text: string): boolean {
  return includesAny(text, [
    'latest',
    'today news',
    'current',
    'currently',
    'news',
    'recent',
    'recently',
    '2025',
    '2026',
    'price',
    'prices',
    'best ',
    'compare',
    'comparison',
    'vs ',
    'versus',
    'release date',
    'what happened',
    'update',
    'updates',
    'stock',
    'stocks',
    'crypto',
    'weather',
    'near me',
  ]);
}

function needsCalendarTool(text: string) {
  return includesAny(text, [
    'calendar',
    'meeting',
    'event',
    'schedule',
    'today',
    'tomorrow',
    'free time',
    'availability',
    'appointment',
  ]);
}

function needsCalendarCreate(text: string) {
  return includesAny(text, [
    'create event',
    'create calendar event',
    'add event',
    'schedule meeting',
    'book meeting',
    'put on my calendar',
    'add to calendar',
  ]);
}

export function buildExecutionPlan(
  request: KernelRequest,
): KernelExecutionPlan {
  const text = request.message.toLowerCase();
  const mode = request.mode === 'agent' ? 'agent' : 'fast';

  const tools: KernelToolName[] = [];

  if (mode === 'agent') {
    tools.push('tasks.plan', 'productivity.next_action');
  }

  if (
    includesAny(text, [
      'remember',
      'previous',
      'before',
      'last time',
      'project',
      'context',
    ])
  ) {
    tools.push('memory.search');
  }

  if (
    includesAny(text, [
      'compare',
      'vs',
      'difference',
      'better',
      'best option',
      'which one',
    ])
  ) {
    tools.push('compare.smart');
  }

  if (
    includesAny(text, [
      'money',
      'budget',
      'save',
      'subscription',
      'finance',
      'cost',
      'price',
    ])
  ) {
    tools.push('finance.analyze');
  }

  if (needsCalendarTool(text)) {
    tools.push('calendar.status');

    if (needsCalendarCreate(text)) {
      tools.push('calendar.create_event');
    } else if (text.includes('today')) {
      tools.push('calendar.today');
    } else {
      tools.push('calendar.search');
    }
  }

  return {
    mode,
    tools: Array.from(new Set(tools)),
    reasoning: mode === 'agent' ? 'structured' : 'light',
    useBuiltInWebSearch: needsFreshWebInfo(text),
  };
}
