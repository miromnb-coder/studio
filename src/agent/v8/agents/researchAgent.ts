import { AgentContextV8, ExecutionResultV8, RouteResultV8 } from '../types';
import { groq } from '@/ai/groq';

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
  const relevantMemories = input.context.memory.relevantMemories.slice(0, 2).map((item) => item.content);
  const conversationTail = input.context.conversation.slice(-4).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const modeHint =
    input.route.intent === 'coding'
      ? 'Focus on concrete debugging/coding guidance and specific next steps.'
      : input.route.intent === 'productivity'
        ? 'Focus on practical planning, prioritization, and action sequencing.'
        : input.route.intent === 'memory'
          ? 'Focus on memory/retrieval requests without unrelated details.'
          : 'Focus on directly answering the user question with clear reasoning.';

  let answerDraft = inFinnish
    ? 'En saanut vielä vastausta muodostettua. Kokeile kysymystä yhdellä tarkalla lauseella.'
    : 'I could not generate a full answer yet. Please restate your request in one clear sentence.';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: `You are a smart general AI assistant.
Default to normal, direct conversation.
Answer the exact user request first.
Avoid generic filler, fake process summaries, and operator-style language.
Do not mention tools, plans, hidden steps, or internal routing unless the user asks.
${modeHint}
Respond in ${inFinnish ? 'Finnish' : 'English'}.`,
        },
        ...conversationTail,
        {
          role: 'user',
          content: `User request: ${message}
Intent: ${input.route.intent}
Relevant memory: ${relevantMemories.length ? relevantMemories.join(' | ') : 'none'}
Tool outputs present: ${input.execution.steps.length > 0 ? 'yes' : 'no'}
Give a direct final answer.`,
        },
      ],
    });

    const modelReply = completion.choices[0]?.message?.content?.trim();
    if (modelReply) answerDraft = modelReply;
  } catch {
    // keep fallback draft
  }

  const keyPoints = [
    `Intent: ${input.route.intent}`,
    relevantMemories.length
      ? `Relevant memories used: ${relevantMemories.length}`
      : 'No strongly relevant long-term memory found.',
    `Tool steps executed: ${input.execution.steps.length}`,
    `Language: ${inFinnish ? 'fi' : 'en'}`,
  ];

  return { keyPoints, answerDraft };
}
