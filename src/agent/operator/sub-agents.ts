import type { ChatMessage } from '@/lib/ai/types';
import type { AIProviderClient } from '@/lib/ai/types';
import type { IntentRoute, StoredMemory } from './types';

async function completeText(provider: AIProviderClient, systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  let content = '';
  await provider.streamChat(
    { messages, systemPrompt },
    (event) => {
      if (event.type === 'text-delta') content += event.delta;
    },
  );
  return content.trim();
}

function formatMemory(memory: StoredMemory[]): string {
  if (!memory.length) return 'No relevant memory found.';
  return memory.map((item) => `- (${item.source}) ${item.value}`).join('\n');
}

export async function runPlanningStep(
  provider: AIProviderClient,
  userInput: string,
  route: IntentRoute,
  memory: StoredMemory[],
): Promise<string> {
  return completeText(
    provider,
    'You are Kivo Planner. Create a compact internal plan to maximize answer quality. Return only bullets under: Goal, Critical factors, Output approach. Do not include chain-of-thought.',
    [
      { role: 'user', content: `User request:\n${userInput}` },
      { role: 'system', content: `Intent route:\n${JSON.stringify(route, null, 2)}` },
      { role: 'system', content: `Memory:\n${formatMemory(memory)}` },
    ],
  );
}

export async function runResearchAgent(provider: AIProviderClient, userInput: string, conversation: ChatMessage[]): Promise<string> {
  return completeText(
    provider,
    'You are Kivo Research. Provide concise, high-signal findings and practical facts. Label uncertain points clearly. Prefer relevance over breadth.',
    [...conversation.slice(-8), { role: 'user', content: userInput }],
  );
}

export async function runAnalysisAgent(
  provider: AIProviderClient,
  userInput: string,
  research: string,
  memory: StoredMemory[],
  plan: string,
): Promise<string> {
  return completeText(
    provider,
    'You are Kivo Analysis. Synthesize evidence and reasoning into a decision-ready analysis. Highlight tradeoffs, risks, and best path. Avoid fluff.',
    [
      { role: 'user', content: `User request:\n${userInput}` },
      { role: 'system', content: `Planning notes:\n${plan || 'No plan'}` },
      { role: 'system', content: `Research notes:\n${research || 'No research run'}` },
      { role: 'system', content: `Memory context:\n${formatMemory(memory)}` },
    ],
  );
}

export async function runResponseAgent(
  provider: AIProviderClient,
  userInput: string,
  options: {
    route: IntentRoute;
    research?: string;
    analysis?: string;
    memory?: StoredMemory[];
    plan?: string;
  },
): Promise<string> {
  const memoryText = formatMemory(options.memory ?? []);
  const modeGuide: Record<IntentRoute['mode'], string> = {
    direct: 'Start with the answer in 1-2 sentences. Add only one helpful follow-up insight.',
    deep_explanation: 'Use clear teaching structure, simple language, and a short example if useful.',
    analysis: 'Give recommendation + reasoning. Include tradeoffs and decision criteria.',
    operator: 'Act like a proactive operator: give a practical plan, execution order, and immediate next step.',
  };

  const structureGuide: Record<IntentRoute['outputShape'], string> = {
    short: 'Keep concise paragraph format.',
    sections: 'Use short section headers.',
    steps: 'Use numbered steps with outcomes.',
    decision: 'Use comparison table-style bullets and a final recommendation.',
  };

  return completeText(
    provider,
    [
      'You are Kivo, a premium operator AI. Act like an operator, not a chatbot.',
      'Goal: deliver a concise, decision-ready answer with the best immediate action.',
      modeGuide[options.route.mode],
      structureGuide[options.route.outputShape],
      'Default to brevity. Avoid filler, repetition, and generic advice.',
      'Always include a concrete next step when useful.',
      'Use this internal structure: core answer, key insight, optional actions, deeper analysis (only if requested).',
      'Use memory only when it improves relevance, and reference it naturally.',
      'If uncertain, state uncertainty briefly and continue with best guidance.',
      'Language lock: answer fully in the user message language; never mix Finnish/English/Swedish in one reply.',
      'Do not expose chain-of-thought.',
    ].join(' '),
    [
      { role: 'user', content: userInput },
      { role: 'system', content: `Route:\n${JSON.stringify(options.route, null, 2)}` },
      { role: 'system', content: `Planning:\n${options.plan || 'No plan generated'}` },
      { role: 'system', content: `Research:\n${options.research || 'No external research used'}` },
      { role: 'system', content: `Analysis:\n${options.analysis || 'No deep analysis needed'}` },
      { role: 'system', content: `Memory:\n${memoryText}` },
    ],
  );
}
