import type {
  AgentContext,
  AgentFinalAnswer,
  AgentPlan,
  AgentRequest,
  AgentRouteResult,
  AgentStreamEvent,
  AgentToolResult,
} from './types';

export type GenerateFinalAnswerInput = {
  request: AgentRequest;
  route: AgentRouteResult;
  plan: AgentPlan;
  context: AgentContext;
  toolResults: AgentToolResult[];
  memorySummary: string;
};

export async function generateFinalAnswer(input: GenerateFinalAnswerInput): Promise<AgentFinalAnswer> {
  const successfulTools = input.toolResults.filter((result) => result.ok).map((result) => result.tool);

  const text = [
    `Intent: ${input.route.intent}`,
    `I processed your request: "${input.request.message}"`,
    successfulTools.length ? `Tools consulted: ${successfulTools.join(', ')}.` : 'No external tools were required.',
    input.memorySummary ? `Relevant memory: ${input.memorySummary}` : 'No memory context was used.',
    'TODO: Replace scaffold synthesis with model-generated answer using prompts.ts helpers.',
  ].join('\n');

  return {
    text,
    confidence: input.route.confidence,
    followUps: ['Would you like me to turn this into an actionable checklist?'],
  };
}

export async function* generateFinalAnswerStream(input: GenerateFinalAnswerInput): AsyncGenerator<AgentStreamEvent> {
  const answer = await generateFinalAnswer(input);

  yield {
    type: 'answer_delta',
    requestId: input.request.requestId,
    timestamp: new Date().toISOString(),
    payload: { delta: answer.text },
  };

  yield {
    type: 'answer_completed',
    requestId: input.request.requestId,
    timestamp: new Date().toISOString(),
    payload: { answer },
  };
}
