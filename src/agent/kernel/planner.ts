import type { KernelRequest } from './types';
import type { KernelToolName } from './tool-registry';

export type KernelPlannerIntent =
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

export type KernelExecutionPlan = {
  mode: 'fast' | 'agent';
  tools: KernelToolName[];
  toolBatches: KernelToolName[][];
  reasoning: 'light' | 'structured';
  taskDepth: 'quick' | 'standard' | 'deep';
  useBuiltInWebSearch: boolean;
  intent: KernelPlannerIntent;
  confidence: number;
  reasons: string[];
  assumptions: string[];
  priorities: string[];
  shouldAskClarifyingQuestion: boolean;
  clarifyingQuestion?: string;
  nextBestActionHint: string;
  evaluationChecks: string[];
};

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

const DEEP_TASK_SIGNALS = ['comprehensive', 'deep', 'full plan', 'architecture', 'production', 'step by step', 'multi-step', 'end-to-end'];
const QUICK_TASK_SIGNALS = ['quick', 'brief', 'short', 'tl;dr', 'one line', 'fast'];
const CLARIFY_SIGNALS = ['this', 'that', 'it', 'fix this', 'do it', 'help me', 'what now'];

function normalize(text: string) {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function inferTaskDepth(text: string, mode: 'fast' | 'agent', tools: KernelToolName[]): KernelExecutionPlan['taskDepth'] {
  if (includesAny(text, QUICK_TASK_SIGNALS)) return 'quick';
  if (includesAny(text, DEEP_TASK_SIGNALS) || mode === 'agent' || tools.length >= 4) return 'deep';
  return 'standard';
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
  const runnerUp = candidates[1];
  if (!top || top.score <= 0) return { intent: 'general', score: 0.34, reasons: ['no strong specialized tool intent'] };

  let confidence = Math.min(0.96, Math.max(0.42, top.score / 6));
  if (runnerUp && Math.abs(top.score - runnerUp.score) <= 1) confidence = Math.max(0.35, confidence - 0.18);
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

function buildToolBatches(tools: KernelToolName[]): KernelToolName[][] {
  const statusTools: KernelToolName[] = tools.filter((tool) => tool.endsWith('.status'));
  const memoryTools: KernelToolName[] = tools.filter((tool) => tool.startsWith('memory.'));
  const planningTools: KernelToolName[] = tools.filter((tool) => tool === 'tasks.plan' || tool === 'productivity.next_action');
  const dataTools: KernelToolName[] = tools.filter((tool) => !statusTools.includes(tool) && !memoryTools.includes(tool) && !planningTools.includes(tool));

  const batches: KernelToolName[][] = [];
  if (statusTools.length) batches.push(statusTools);
  if (memoryTools.length) batches.push(memoryTools);
  if (dataTools.length) batches.push(dataTools);
  if (planningTools.length) batches.push(planningTools);
  if (!batches.length && tools.length) batches.push([...tools]);
  return batches;
}

function buildAssumptions(text: string, intent: KernelPlannerIntent, confidence: number): string[] {
  const assumptions: string[] = [];
  if (intent === 'plan_today') assumptions.push('User wants immediate prioritization for today.');
  if (intent === 'kivo_build') assumptions.push('User prefers implementation-ready guidance over brainstorming.');
  if (intent === 'research' || includesAny(text, ['latest', 'today', 'current'])) assumptions.push('Fresh external information may be required.');
  if (confidence < 0.5) assumptions.push('Intent may be ambiguous; answer should include a compact confidence note.');
  return assumptions;
}

function buildPriorities(intent: KernelPlannerIntent, taskDepth: KernelExecutionPlan['taskDepth']): string[] {
  const priorities = ['Give a directly useful result first.', 'Avoid overexplaining internal mechanics.'];
  if (intent === 'finance') priorities.unshift('Prioritize measurable savings opportunities.');
  if (intent === 'plan_today') priorities.unshift('Prioritize time-sensitive commitments and one concrete first block.');
  if (intent === 'kivo_build') priorities.unshift('Prioritize production-safe architecture and TypeScript correctness.');
  if (taskDepth === 'deep') priorities.push('Provide explicit sequencing for multi-step execution.');
  return priorities;
}

function resolveClarifyingQuestion(text: string, intent: KernelPlannerIntent, confidence: number, tools: KernelToolName[]): string | undefined {
  const tokenCount = text.split(' ').filter(Boolean).length;
  const hasConcreteSignal = includesAny(text, ['calendar', 'gmail', 'email', 'finance', 'memory', 'kivo', 'compare', 'research', 'today', 'tomorrow']);
  const vague = tokenCount <= 3 || includesAny(text, CLARIFY_SIGNALS);
  if (!vague || confidence >= 0.55 || hasConcreteSignal || tools.length >= 2) return undefined;

  if (intent === 'calendar' || intent === 'plan_today') return 'Do you want me to optimize your schedule for today, or just summarize your calendar?';
  if (intent === 'finance') return 'Should I focus on cutting recurring costs, or on a full spending overview?';
  if (intent === 'kivo_build') return 'Should I propose architecture changes only, or include exact file-level implementation steps?';
  return 'What outcome do you want first: a quick answer, or a detailed step-by-step plan?';
}

function buildNextBestActionHint(intent: KernelPlannerIntent): string {
  switch (intent) {
    case 'plan_today':
      return 'Convert priorities into a time-blocked first action.';
    case 'finance':
      return 'Identify the highest-confidence saving and recommend the first cancellation or negotiation action.';
    case 'kivo_build':
      return 'Return concrete file-level changes and execution order.';
    case 'gmail':
      return 'Promote urgent messages into explicit follow-up actions.';
    default:
      return 'End with one practical next action the user can take immediately.';
  }
}

function buildEvaluationChecks(intent: KernelPlannerIntent): string[] {
  const checks = ['Is the answer directly actionable?', 'Did we separate known facts from missing context?', 'Did we avoid raw tool dumps?'];
  if (intent === 'finance') checks.push('Is there at least one measurable financial recommendation?');
  if (intent === 'kivo_build') checks.push('Are implementation steps production-safe and specific?');
  return checks;
}

export function buildExecutionPlan(request: KernelRequest): KernelExecutionPlan {
  const text = normalize(request.message);
  const mode = request.mode === 'agent' ? 'agent' : 'fast';
  const inferred = inferIntent(text);
  const tools = buildToolsForIntent(inferred.intent, text, mode);
  const taskDepth = inferTaskDepth(text, mode, tools);
  const clarifyingQuestion = resolveClarifyingQuestion(text, inferred.intent, inferred.score, tools);

  return {
    mode,
    tools,
    toolBatches: buildToolBatches(tools),
    reasoning: mode === 'agent' || tools.length > 1 || taskDepth === 'deep' ? 'structured' : 'light',
    taskDepth,
    useBuiltInWebSearch: shouldUseWeb(text, inferred.intent),
    intent: inferred.intent,
    confidence: inferred.score,
    reasons: inferred.reasons,
    assumptions: buildAssumptions(text, inferred.intent, inferred.score),
    priorities: buildPriorities(inferred.intent, taskDepth),
    shouldAskClarifyingQuestion: Boolean(clarifyingQuestion),
    clarifyingQuestion,
    nextBestActionHint: buildNextBestActionHint(inferred.intent),
    evaluationChecks: buildEvaluationChecks(inferred.intent),
  };
}
