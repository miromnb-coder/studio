import type { KernelRequest } from './types';
import type { KernelToolName } from './tool-registry';

export type KernelExecutionPlan = {
  mode: 'fast' | 'agent';
  tools: KernelToolName[];
  reasoning: 'light' | 'structured';
  useBuiltInWebSearch: boolean;
  intent: KernelPlannerIntent;
  confidence: number;
  reasons: string[];
};

type KernelPlannerIntent =
  | 'plan_today'
  | 'calendar'
  | 'gmail'
  | 'finance'
  | 'memory'
  | 'kivo_build'
  | 'compare'
  | 'research'
  | 'task_planning'
  | 'general';

type IntentScore = {
  intent: KernelPlannerIntent;
  score: number;
  reasons: string[];
};

const includesAny = (text: string, needles: string[]) => needles.some((needle) => text.includes(needle));
const countMatches = (text: string, needles: string[]) => needles.reduce((count, needle) => count + (text.includes(needle) ? 1 : 0), 0);

const INTENT_KEYWORDS: Record<KernelPlannerIntent, string[]> = {
  plan_today: ['today', 'tänään', 'plan my day', 'päivän suunnitelma', 'what should i do', 'mitä minun pitäisi tehdä', 'focus today', 'next task'],
  calendar: ['calendar', 'kalenteri', 'meeting', 'event', 'schedule', 'availability', 'free time', 'appointment', 'tomorrow', 'this week'],
  gmail: ['gmail', 'email', 'sähköposti', 'inbox', 'mail', 'urgent email', 'messages', 'reply', 'digest'],
  finance: ['money', 'budget', 'save', 'subscription', 'finance', 'cost', 'price', 'receipt', 'invoice', 'charge', 'renewal', 'billed', 'raha', 'säästö'],
  memory: ['remember', 'memory', 'muista', 'previous', 'before', 'last time', 'context', 'prefer', 'goal', 'project context'],
  kivo_build: ['kivo', 'repo', 'github', 'next.js', 'typescript', 'component', 'build error', 'vercel', 'deploy', 'kernel', 'agent', 'orchestrator', 'tool layer'],
  compare: ['compare', 'vs', 'versus', 'difference', 'better', 'which one', 'kumpi', 'vertaa'],
  research: ['research', 'search web', 'latest', 'current', 'news', 'recent', 'selvitä', 'etsi tietoa'],
  task_planning: ['plan', 'steps', 'roadmap', 'todo', 'task', 'next step', 'suunnitelma', 'vaiheet', 'tee seuraavaksi'],
  general: [],
};

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function scoreIntent(text: string, intent: KernelPlannerIntent): IntentScore {
  const keywords = INTENT_KEYWORDS[intent];
  const matches = countMatches(text, keywords);
  const reasons: string[] = [];
  if (matches) reasons.push(`${intent}: ${matches} signal${matches === 1 ? '' : 's'}`);

  let score = matches;

  if (intent === 'plan_today' && (includesAny(text, ['today', 'tänään']) && includesAny(text, ['calendar', 'kalenteri', 'task', 'focus', 'tehdä']))) {
    score += 3;
    reasons.push('combined day-planning + schedule/task signal');
  }

  if (intent === 'finance' && includesAny(text, ['gmail', 'email', 'receipt', 'invoice', 'subscription', 'renewal'])) {
    score += 2;
    reasons.push('finance request likely needs email-derived signals');
  }

  if (intent === 'kivo_build' && includesAny(text, ['tee', 'korjaa', 'build', 'repo', 'suoraan', 'deploy'])) {
    score += 2;
    reasons.push('Kivo implementation/build workflow signal');
  }

  if (intent === 'memory' && includesAny(text, ['remember this', 'save this', 'note that', 'muista tämä'])) {
    score += 2;
    reasons.push('durable memory write signal');
  }

  return { intent, score, reasons };
}

function inferIntent(text: string): IntentScore {
  const candidates = (Object.keys(INTENT_KEYWORDS) as KernelPlannerIntent[])
    .filter((intent) => intent !== 'general')
    .map((intent) => scoreIntent(text, intent))
    .sort((a, b) => b.score - a.score);

  const top = candidates[0];
  if (!top || top.score <= 0) return { intent: 'general', score: 0.35, reasons: ['no strong specialized tool intent'] };

  const confidence = Math.min(0.95, Math.max(0.45, top.score / 6));
  return { intent: top.intent, score: confidence, reasons: top.reasons };
}

function shouldUseWeb(text: string, intent: KernelPlannerIntent) {
  if (intent === 'research') return true;
  if (intent === 'compare' && includesAny(text, ['latest', 'current', 'price', '2025', '2026', 'best'])) return true;
  if (intent === 'kivo_build') return false;
  return includesAny(text, ['latest', 'current', 'news', 'recent', 'price today', 'weather', 'near me', '2025', '2026']);
}

function add(tools: KernelToolName[], ...next: KernelToolName[]) {
  for (const tool of next) if (!tools.includes(tool)) tools.push(tool);
}

function buildToolsForIntent(intent: KernelPlannerIntent, text: string, mode: 'fast' | 'agent'): KernelToolName[] {
  const tools: KernelToolName[] = [];

  if (mode === 'agent') add(tools, 'tasks.plan', 'productivity.next_action');

  switch (intent) {
    case 'plan_today':
      add(tools, 'calendar.status', 'calendar.today', 'calendar.plan_day', 'memory.search', 'productivity.next_action');
      if (includesAny(text, ['email', 'gmail', 'inbox', 'sähköposti', 'urgent'])) add(tools, 'gmail.status', 'gmail.inbox_summary');
      break;
    case 'calendar':
      add(tools, 'calendar.status');
      if (includesAny(text, ['today', 'tänään', 'plan', 'focus'])) add(tools, 'calendar.today', 'calendar.plan_day');
      else add(tools, 'calendar.search');
      break;
    case 'gmail':
      add(tools, 'gmail.status', 'gmail.inbox_summary', 'productivity.next_action');
      break;
    case 'finance':
      add(tools, 'finance.analyze');
      if (includesAny(text, ['gmail', 'email', 'receipt', 'invoice', 'subscription', 'renewal', 'charge'])) add(tools, 'gmail.status', 'gmail.finance_scan');
      break;
    case 'memory':
      add(tools, 'memory.search');
      if (includesAny(text, ['remember this', 'save this', 'note that', 'muista tämä', 'for future'])) add(tools, 'memory.write');
      break;
    case 'kivo_build':
      add(tools, 'memory.search', 'tasks.plan', 'productivity.next_action');
      break;
    case 'compare':
      add(tools, 'compare.smart');
      if (includesAny(text, ['price', 'cost', 'money', 'budget'])) add(tools, 'finance.analyze');
      break;
    case 'research':
      add(tools, 'tasks.plan');
      break;
    case 'task_planning':
      add(tools, 'tasks.plan', 'productivity.next_action', 'memory.search');
      break;
    case 'general':
      if (mode === 'agent') add(tools, 'productivity.next_action');
      break;
  }

  return tools;
}

export function buildExecutionPlan(request: KernelRequest): KernelExecutionPlan {
  const text = normalize(request.message);
  const mode = request.mode === 'agent' ? 'agent' : 'fast';
  const inferred = inferIntent(text);
  const tools = buildToolsForIntent(inferred.intent, text, mode);
  const useBuiltInWebSearch = shouldUseWeb(text, inferred.intent);

  return {
    mode,
    tools,
    reasoning: mode === 'agent' || tools.length > 1 ? 'structured' : 'light',
    useBuiltInWebSearch,
    intent: inferred.intent,
    confidence: inferred.score,
    reasons: inferred.reasons,
  };
}
