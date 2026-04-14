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

type LlmAnswerSchema = {
  answer: string;
  followUps: string[];
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

function getConversationMessages(
  request: AgentRequest,
): Array<{ role: string; content: string }> {
  const raw =
    (request as AgentRequest & {
      conversation?: Array<{ role?: string; content?: string }>;
    }).conversation ?? [];

  if (!Array.isArray(raw)) return [];

  return raw
    .filter(
      (item): item is { role?: string; content?: string } =>
        Boolean(item) && typeof item === 'object',
    )
    .map((item) => ({
      role: normalizeText(item.role) || 'user',
      content: normalizeText(item.content),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-8);
}

function getLanguage(input: GenerateFinalAnswerInput): string {
  return (
    normalizeText(input.route.responseLanguage) ||
    normalizeText(input.route.inputLanguage) ||
    normalizeText(input.request.responseLanguage) ||
    normalizeText(input.request.inputLanguage) ||
    'en'
  ).toLowerCase();
}

function summarizeToolResults(toolResults: AgentToolResult[]): {
  successful: string[];
  failed: string[];
  compactJson: string;
} {
  const successful: string[] = [];
  const failed: string[] = [];

  const compact = toolResults.map((result) => {
    const summary =
      typeof result.data?.summary === 'string'
        ? normalizeText(result.data.summary)
        : typeof result.data?.message === 'string'
          ? normalizeText(result.data.message)
          : typeof result.data?.meta === 'object' &&
              result.data?.meta &&
              'summary' in result.data.meta &&
              typeof (result.data.meta as { summary?: unknown }).summary ===
                'string'
            ? normalizeText((result.data.meta as { summary: string }).summary)
            : '';

    const item = {
      tool: result.tool,
      ok: result.ok,
      summary,
      error: normalizeText(result.error),
      data:
        typeof result.data === 'object' && result.data
          ? result.data
          : {},
    };

    if (result.ok) {
      successful.push(summary ? `${result.tool}: ${summary}` : `${result.tool}`);
    } else {
      failed.push(
        `${result.tool}${item.error ? `: ${item.error}` : ': failed'}`,
      );
    }

    return item;
  });

  return {
    successful,
    failed,
    compactJson: JSON.stringify(compact, null, 2),
  };
}

function estimateConfidence(
  route: AgentRouteResult,
  toolResults: AgentToolResult[],
  answerText: string,
): number {
  let confidence = typeof route.confidence === 'number' ? route.confidence : 0.6;

  const okCount = toolResults.filter((item) => item.ok).length;
  const failCount = toolResults.filter((item) => !item.ok).length;

  if (okCount > 0) confidence += 0.07;
  if (okCount > 1) confidence += 0.04;
  if (failCount > 0) confidence -= 0.1;
  if (failCount > okCount) confidence -= 0.08;
  if (answerText.length < 80) confidence -= 0.08;
  if (answerText.length > 180) confidence += 0.03;

  return Math.max(0.22, Math.min(0.97, Number(confidence.toFixed(2))));
}

function buildLanguageInstruction(language: string): string {
  if (language.startsWith('fi')) {
    return 'Respond entirely in Finnish. Do not mix languages.';
  }
  if (language.startsWith('sv')) {
    return 'Respond entirely in Swedish. Do not mix languages.';
  }
  if (language.startsWith('es')) {
    return 'Respond entirely in Spanish. Do not mix languages.';
  }
  if (language.startsWith('de')) {
    return 'Respond entirely in German. Do not mix languages.';
  }

  return 'Respond entirely in English. Do not mix languages.';
}

function buildFallbackAnswer(
  input: GenerateFinalAnswerInput,
  language: string,
): AgentFinalAnswer {
  const requestText = getRequestText(input.request);
  const { successful, failed } = summarizeToolResults(input.toolResults);

  const directAnswer =
    language.startsWith('fi')
      ? [
          `Tässä paras vastaus pyyntöösi: ${requestText}.`,
          input.memorySummary
            ? `Hyödynsin myös tätä keskustelukontekstia: ${input.memorySummary}`
            : '',
          successful.length
            ? `Käytin näitä tietolähteitä tai työkaluja: ${successful.join(', ')}.`
            : '',
          failed.length
            ? `Kaikkea ei saatu haettua täydellisesti: ${failed.join(', ')}.`
            : '',
        ]
          .filter(Boolean)
          .join(' ')
      : [
          `Here is the best answer I can give for: ${requestText}.`,
          input.memorySummary
            ? `I also used this relevant context: ${input.memorySummary}`
            : '',
          successful.length
            ? `I used these tools or sources: ${successful.join(', ')}.`
            : '',
          failed.length
            ? `Some parts were incomplete: ${failed.join(', ')}.`
            : '',
        ]
          .filter(Boolean)
          .join(' ');

  const followUps = language.startsWith('fi')
    ? ['Haluatko tästä tarkemman version?', 'Teenkö tästä checklistin?']
    : ['Do you want a more detailed version?', 'Should I turn this into a checklist?'];

  return {
    text: directAnswer,
    confidence: estimateConfidence(input.route, input.toolResults, directAnswer),
    followUps,
    metadata: {
      intent: input.route.intent,
      inputLanguage: input.route.inputLanguage,
      responseLanguage: language,
      successfulTools: input.toolResults.filter((item) => item.ok).map((item) => item.tool),
      failedTools: input.toolResults.filter((item) => !item.ok).map((item) => item.tool),
      planId: input.plan.id,
      stepCount: input.plan.steps.length,
      mode: 'fallback',
    },
  };
}

function extractJsonBlock(text: string): string | null {
  const trimmed = normalizeText(text);
  if (!trimmed) return null;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed;
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  return null;
}

async function generateWithModel(
  input: GenerateFinalAnswerInput,
): Promise<LlmAnswerSchema | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const requestText = getRequestText(input.request);
  const language = getLanguage(input);
  const conversation = getConversationMessages(input.request);
  const { compactJson } = summarizeToolResults(input.toolResults);

  const systemPrompt = [
    'You are the final answer generator for a premium AI agent.',
    'Your job is to answer the user directly and intelligently.',
    'Never expose internal reasoning, plan summaries, tool logs, chain-of-thought, or debug text.',
    'Do not write sections like "Plan used", "What I used", "Relevant memory", or "Recommended next step".',
    'Use tool results and memory silently to improve the answer.',
    'Be concrete, helpful, and decisive.',
    'If data is incomplete, still give the best useful answer possible instead of sounding broken.',
    buildLanguageInstruction(language),
    'Return JSON only with this schema:',
    '{ "answer": "string", "followUps": ["string"] }',
    'Keep followUps short and useful. Max 3.',
  ].join('\n');

  const userPrompt = [
    `User request: ${requestText}`,
    `Intent: ${input.route.intent}`,
    `User goal: ${normalizeText(input.route.userGoal) || 'Help with the user request.'}`,
    `Entities: ${Array.isArray(input.route.entities) ? input.route.entities.join(', ') : ''}`,
    `Memory summary: ${normalizeText(input.memorySummary) || 'none'}`,
    'Recent conversation:',
    conversation.length
      ? conversation.map((item) => `${item.role}: ${item.content}`).join('\n')
      : 'none',
    'Tool results JSON:',
    compactJson,
    `Plan steps: ${input.plan.steps.map((step) => step.title).join(' -> ')}`,
    'Now produce the final user-facing answer only.',
  ].join('\n\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.35,
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: systemPrompt }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: userPrompt }],
        },
      ],
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as { output_text?: string };
  const textOutput = normalizeText(payload.output_text);
  if (!textOutput) return null;

  const jsonBlock = extractJsonBlock(textOutput);
  if (!jsonBlock) return null;

  try {
    const parsed = JSON.parse(jsonBlock) as Partial<LlmAnswerSchema>;
    const answer = normalizeText(parsed.answer);
    const followUps = Array.isArray(parsed.followUps)
      ? parsed.followUps
          .map((item) => normalizeText(item))
          .filter(Boolean)
          .slice(0, 3)
      : [];

    if (!answer) return null;

    return {
      answer,
      followUps,
    };
  } catch {
    return null;
  }
}

export async function generateFinalAnswer(
  input: GenerateFinalAnswerInput,
): Promise<AgentFinalAnswer> {
  const language = getLanguage(input);
  const llmAnswer = await generateWithModel(input);

  if (!llmAnswer) {
    return buildFallbackAnswer(input, language);
  }

  const text = llmAnswer.answer;
  const confidence = estimateConfidence(input.route, input.toolResults, text);

  return {
    text,
    confidence,
    followUps: llmAnswer.followUps,
    metadata: {
      intent: input.route.intent,
      inputLanguage: input.route.inputLanguage,
      responseLanguage: language,
      successfulTools: input.toolResults
        .filter((result) => result.ok)
        .map((result) => result.tool),
      failedTools: input.toolResults
        .filter((result) => !result.ok)
        .map((result) => result.tool),
      planId: input.plan.id,
      stepCount: input.plan.steps.length,
      mode: 'model',
    },
  };
}

function chunkText(text: string, chunkSize = 110): string[] {
  const normalized = normalizeText(text);
  if (!normalized) return [];

  const chunks: string[] = [];
  let rest = normalized;

  while (rest.length > chunkSize) {
    let splitIndex = rest.lastIndexOf(' ', chunkSize);
    if (splitIndex < Math.floor(chunkSize * 0.55)) {
      splitIndex = chunkSize;
    }

    chunks.push(rest.slice(0, splitIndex).trim());
    rest = rest.slice(splitIndex).trim();
  }

  if (rest) chunks.push(rest);

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
      payload: {
        delta: `${chunk}${chunk === chunks[chunks.length - 1] ? '' : ' '}`,
      },
    };
  }

  yield {
    type: 'answer_completed',
    requestId: input.request.requestId,
    timestamp: new Date().toISOString(),
    payload: { answer },
  };
}
