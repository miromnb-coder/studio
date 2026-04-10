import { AgentContextV8, ExecutionResultV8, RouteResultV8 } from '../types';

export type ResearchAgentInput = {
  route: RouteResultV8;
  context: AgentContextV8;
  execution: ExecutionResultV8;
};

export type ResearchAgentOutput = {
  keyPoints: string[];
  answerDraft: string;
};

const FINNISH_LANGUAGE_PATTERN = /\b(voitko vastata suomeksi|vastaa suomeksi|suomeksi|kirjoita suomeksi)\b/i;

function prefersFinnish(message: string, history: AgentContextV8['conversation']): boolean {
  const corpus = `${history.slice(-4).map((item) => item.content).join(' ')} ${message}`;
  return FINNISH_LANGUAGE_PATTERN.test(corpus);
}

export async function runResearchAgent(input: ResearchAgentInput): Promise<ResearchAgentOutput> {
  const inFinnish = prefersFinnish(input.context.user.message, input.context.conversation);
  const message = input.context.user.message;
  const relevantMemory = input.context.memory.relevantMemories[0]?.content;

  let answerDraft = inFinnish
    ? 'Vastaan suoraan ja tiiviisti kysymykseesi.'
    : 'Here is a direct, grounded answer to your question.';

  if (input.route.intent === 'coding') {
    answerDraft = inFinnish
      ? 'Selvä — käsitellään tämä koodiongelmana. Kuvaa virhe tai tavoite, niin annan täsmäkorjauksen ja perustelun.'
      : 'Got it — treating this as a coding task. Share the exact bug or target behavior and I will give a concrete fix path.';
  } else if (input.route.intent === 'productivity') {
    answerDraft = inFinnish
      ? 'Tehdään tästä selkeä suunnitelma: tavoite, seuraava askel ja aikaraja.'
      : 'Let’s turn this into a clear plan: goal, immediate next step, and deadline.';
  } else if (input.route.intent === 'memory') {
    answerDraft = inFinnish
      ? 'Ymmärretty. Tallennan vain pitkäaikaisesti hyödylliset asiat, en satunnaista keskustelua.'
      : 'Understood. I only keep high-signal long-term memory, not casual chat.';
  }

  const keyPoints = [
    `Intent: ${input.route.intent}`,
    relevantMemory ? `Relevant memory: ${relevantMemory}` : 'No strongly relevant long-term memory found.',
    `Tool steps executed: ${input.execution.steps.length}`,
    `Language: ${inFinnish ? 'fi' : 'en'}`,
  ];

  if (message.length > 0 && !/\?$/.test(answerDraft)) {
    answerDraft += inFinnish ? ' Jos haluat, voin tarkentaa seuraavaksi.' : ' If you want, I can refine this for your exact situation.';
  }

  return { keyPoints, answerDraft };
}
