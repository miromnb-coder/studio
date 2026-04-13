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

type ToolOutcome = {
  success: AgentToolResult[];
  failed: AgentToolResult[];
};

function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function getRequestText(request: AgentRequest): string {
  const candidates = [
    (request as AgentRequest & { message?: string }).message,
    (request as AgentRequest & { input?: string }).input,
    (request as AgentRequest & { prompt?: string }).prompt,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeText(candidate);
    if (normalized) return normalized;
  }

  return '';
}

function splitToolResults(results: AgentToolResult[]): ToolOutcome {
  return {
    success: results.filter((result) => result.ok),
    failed: results.filter((result) => !result.ok),
  };
}

function summarizeSuccessfulTools(results: AgentToolResult[]): string[] {
  return results.map((result) => {
    const metaSummary =
      typeof result.data?.meta === 'object' &&
      result.data?.meta &&
      'summary' in result.data.meta &&
      typeof (result.data.meta as { summary?: unknown }).summary === 'string'
        ? (result.data.meta as { summary: string }).summary
        : '';

    if (metaSummary) {
      return `${result.tool}: ${metaSummary}`;
    }

    return `${result.tool}: completed successfully`;
  });
}

function summarizeFailedTools(results: AgentToolResult[]): string[] {
  return results.map(
    (result) => `${result.tool}: ${normalizeText(result.error) || 'failed'}`,
  );
}

function determineLeadText(
  route: AgentRouteResult,
  requestText: string,
): string {
  switch (route.intent) {
    case 'research':
      return `I researched your request and pulled together the most relevant findings for "${requestText}".`;
    case 'compare':
      return `I compared the main options related to "${requestText}" and prepared a structured answer.`;
    case 'planning':
      return `I turned "${requestText}" into a practical plan you can act on.`;
    case 'execution':
      return `I prepared the execution result for "${requestText}" and focused on direct action.`;
    case 'email':
      return `I checked the email-related context for "${requestText}" and organized the next steps.`;
    case 'scheduling':
      return `I reviewed the scheduling context for "${requestText}" and prepared the clearest next move.`;
    case 'memory_lookup':
      return `I searched your relevant history for "${requestText}" and pulled back the strongest matches.`;
    case 'tool_use':
      return `I prepared the tool-driven response for "${requestText}".`;
    case 'question':
      return `Here is the clearest answer I can give for "${requestText}".`;
    case 'chat':
      return `Here’s a direct response for "${requestText}".`;
    default:
      return `I analyzed "${requestText}" and prepared the best response I can from the available context.`;
  }
}

function buildEvidenceSection(
  successfulToolSummaries: string[],
  failedToolSummaries: string[],
  memorySummary: string,
): string[] {
  const lines: string[] = [];

  if (successfulToolSummaries.length) {
    lines.push('What I used:');
    successfulToolSummaries.forEach((summary) => lines.push(`- ${summary}`));
  }

  if (memorySummary) {
    lines.push('Relevant memory:');
    lines.push(`- ${memorySummary}`);
  }

  if (failedToolSummaries.length) {
    lines.push('What was incomplete:');
    failedToolSummaries.forEach((summary) => lines.push(`- ${summary}`));
  }

  return lines;
}

function buildActionSection(route: AgentRouteResult): string[] {
  switch (route.intent) {
    case 'planning':
      return [
        'Recommended next step:',
        '- Start with the first concrete milestone and keep the scope narrow.',
      ];
    case 'research':
      return [
        'Recommended next step:',
        '- Review the strongest sources first, then decide whether you want a deeper comparison or summary.',
      ];
    case 'compare':
      return [
        'Recommended next step:',
        '- Choose the option that best matches your highest-priority criteria, then I can help turn it into a decision table.',
      ];
    case 'email':
      return [
        'Recommended next step:',
        '- Open the email-related workflow or tell me whether you want search, summary, receipt scan, or subscription scan.',
      ];
    case 'execution':
      return [
        'Recommended next step:',
        '- Confirm the action you want me to carry out next, and I can continue step by step.',
      ];
    case 'scheduling':
      return [
        'Recommended next step:',
        '- Confirm the time or planning goal, and I can refine the schedule from there.',
      ];
    case 'memory_lookup':
      return [
        'Recommended next step:',
        '- Open the matching thread or ask me to summarize the most relevant memory items.',
      ];
    default:
      return [
        'Recommended next step:',
        '- Tell me whether you want this turned into a checklist, draft, or deeper analysis.',
      ];
  }
}

function buildFollowUps(route: AgentRouteResult): string[] {
  switch (route.intent) {
    case 'research':
      return [
        'Would you like a shorter summary?',
        'Should I turn this into a comparison table?',
      ];
    case 'compare':
      return [
        'Do you want a winner + reasons?',
        'Should I make a scoring table?',
      ];
    case 'planning':
      return [
        'Would you like this as a step-by-step checklist?',
        'Should I convert this into a weekly plan?',
      ];
    case 'email':
      return [
        'Do you want me to search inbox or scan subscriptions next?',
        'Should I draft an email response?',
      ];
    case 'scheduling':
      return [
        'Should I turn this into a calendar-ready plan?',
        'Do you want a simpler schedule recommendation?',
      ];
    case 'memory_lookup':
      return [
        'Should I summarize the matching memory?',
        'Do you want me to reopen the related thread?',
      ];
    default:
      return [
        'Would you like me to make this more actionable?',
      ];
  }
}

function estimateConfidence(
  route: AgentRouteResult,
  toolResults: AgentToolResult[],
): number {
  const { success, failed } = splitToolResults(toolResults);

  let confidence = route.confidence ?? 0.6;

  if (success.length > 0) confidence += 0.06;
  if (success.length > 1) confidence += 0.04;
  if (failed.length > 0) confidence -= 0.1;
  if (failed.length > success.length && failed.length > 0) confidence -= 0.06;

  return Math.max(0.2, Math.min(0.97, Number(confidence.toFixed(2))));
}

function buildPlanSummary(plan: AgentPlan): string {
  const completedShape = plan.steps
    .map((step) => step.title)
    .slice(0, 4)
    .join(' → ');

  return completedShape
    ? `Plan used: ${completedShape}.`
    : 'Plan used: direct response flow.';
}

export async function generateFinalAnswer(
  input: GenerateFinalAnswerInput,
): Promise<AgentFinalAnswer> {
  const requestText = getRequestText(input.request);
  const { success, failed } = splitToolResults(input.toolResults);

  const lead = determineLeadText(input.route, requestText);
  const planSummary = buildPlanSummary(input.plan);

  const evidenceSection = buildEvidenceSection(
    summarizeSuccessfulTools(success),
    summarizeFailedTools(failed),
    normalizeText(input.memorySummary),
  );

  const actionSection = buildActionSection(input.route);

  const textBlocks = [
    lead,
    planSummary,
    ...evidenceSection,
    ...actionSection,
  ].filter(Boolean);

  const text = textBlocks.join('\n\n');

  return {
    text,
    confidence: estimateConfidence(input.route, input.toolResults),
    followUps: buildFollowUps(input.route),
    metadata: {
      intent: input.route.intent,
      successfulTools: success.map((result) => result.tool),
      failedTools: failed.map((result) => result.tool),
      planId: input.plan.id,
      stepCount: input.plan.steps.length,
    },
  };
}

function chunkText(text: string, chunkSize = 140): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let index = 0;

  while (index < normalized.length) {
    chunks.push(normalized.slice(index, index + chunkSize));
    index += chunkSize;
  }

  return chunks;
}

export async function* generateFinalAnswerStream(
  input: GenerateFinalAnswerInput,
): AsyncGenerator<AgentStreamEvent> {
  const answer = await generateFinalAnswer(input);
  const chunks = chunkText(answer.text);

  if (chunks.length === 0) {
    yield {
      type: 'answer_completed',
      requestId: input.request.requestId,
      timestamp: new Date().toISOString(),
      payload: { answer },
    };
    return;
  }

  for (const chunk of chunks) {
    yield {
      type: 'answer_delta',
      requestId: input.request.requestId,
      timestamp: new Date().toISOString(),
      payload: { delta: chunk },
    };
  }

  yield {
    type: 'answer_completed',
    requestId: input.request.requestId,
    timestamp: new Date().toISOString(),
    payload: { answer },
  };
}
