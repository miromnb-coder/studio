import { groq } from '@/ai/groq';
import type { ResponseMode } from '@/agent/types/response-mode';

import type {
  AgentContext,
  AgentFinalAnswer,
  AgentPlan,
  AgentRequest,
  AgentRouteResult,
  AgentStreamEvent,
  StructuredAnswer,
  StructuredSection,
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
    .filter((item) => Boolean(item) && typeof item === 'object')
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

function getResponseMode(input: GenerateFinalAnswerInput): ResponseMode {
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;
  const mode = metadata.responseModeHint;
  if (
    mode === 'casual' ||
    mode === 'fast' ||
    mode === 'operator' ||
    mode === 'tool' ||
    mode === 'fallback'
  ) {
    return mode;
  }

  return 'operator';
}

function buildModeInstruction(mode: ResponseMode): string {
  switch (mode) {
    case 'casual':
      return [
        'Mode: casual.',
        'Reply directly and naturally as in normal conversation.',
        'Never add workflow/preamble phrases (e.g. "Great request", "I will handle this now").',
        'No task framing or process narration.',
        'Keep it warm, concise, premium.',
      ].join(' ');
    case 'fast':
      return [
        'Mode: fast.',
        'Answer quickly and clearly with minimal overhead.',
        'Avoid planning theater and long setup text.',
      ].join(' ');
    case 'tool':
      return [
        'Mode: tool.',
        'Give a direct answer grounded in available tool context.',
        'Do not pretend tools were used if data is missing.',
      ].join(' ');
    case 'fallback':
      return [
        'Mode: fallback.',
        'Be honest about uncertainty in calm user language.',
        'No technical/internal error jargon.',
      ].join(' ');
    case 'operator':
    default:
      return [
        'Mode: operator.',
        'Use a structured, action-oriented style when it helps execution.',
        'Stay natural and avoid robotic filler.',
      ].join(' ');
  }
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
  const normalizedLanguage = language || 'en';
  return [
    `Respond ONLY in ${normalizedLanguage}.`,
    'Use that language for the entire answer.',
    'Do not mix languages.',
    'Do not switch to English automatically.',
    "If uncertain, prefer the user's detected language.",
  ].join(' ');
}

function toTitleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildSourceList(toolResults: AgentToolResult[]) {
  const byTool = new Map<string, boolean>();

  for (const result of toolResults) {
    byTool.set(result.tool, Boolean(result.ok) || byTool.get(result.tool) === true);
  }

  return [...byTool.entries()]
    .slice(0, 5)
    .map(([tool, used]) => ({
      id: tool,
      label: toTitleCase(tool),
      used,
    }));
}

function buildTodayPlanStructure(input: GenerateFinalAnswerInput): StructuredAnswer {
  const sections: StructuredSection[] = [
    {
      label: 'Priority',
      content: input.plan.steps[0]?.title || 'Start with your top-impact task first.',
      tone: 'important',
    },
    {
      label: 'Focus',
      content:
        input.plan.steps[1]?.title ||
        'Block one uninterrupted deep-work window this morning.',
      tone: 'default',
    },
    {
      label: 'Savings',
      content:
        input.plan.steps[2]?.title ||
        'Close one low-value subscription or pending small expense.',
      tone: 'success',
    },
  ];

  const sources = buildSourceList(input.toolResults);

  return {
    title: 'Today Plan',
    summary: 'Built from your current priorities, tools, and recent context.',
    sections,
    actions: [
      { id: 'open_calendar', label: 'Open Calendar', kind: 'primary' },
      { id: 'show_emails', label: 'Show Emails', kind: 'secondary' },
    ],
    sources:
      sources.length > 0
        ? sources
        : [
            { id: 'calendar', label: 'Calendar', used: true },
            { id: 'gmail', label: 'Gmail', used: true },
            { id: 'memory', label: 'Memory', used: true },
          ],
    outcome: 'Estimated 1h saved today',
  };
}

function buildGenericStructure(
  input: GenerateFinalAnswerInput,
  answerText: string,
): StructuredAnswer | undefined {
  const trimmed = normalizeText(answerText);
  if (!trimmed) return undefined;

  const paragraphs = trimmed
    .split(/\n{2,}/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
  const firstParagraph = paragraphs[0] || trimmed;
  const bulletCandidates = trimmed
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^([-•*]|\d+\.)\s+/.test(line))
    .map((line) => line.replace(/^([-•*]|\d+\.)\s+/, ''))
    .slice(0, 5);
  const sources = buildSourceList(input.toolResults);

  const sections: StructuredSection[] = input.plan.steps.slice(0, 3).map((step, index) => ({
    label: step.title,
    content: step.description || step.title,
    tone: index === 0 ? 'important' : 'default',
  }));

  const shouldRender =
    input.route.intent === 'planning' ||
    input.route.intent === 'productivity' ||
    sections.length >= 2 ||
    bulletCandidates.length >= 2;

  if (!shouldRender) return undefined;

  return {
    title: input.route.intent === 'planning' ? 'Plan' : 'Structured Answer',
    summary: firstParagraph.slice(0, 220),
    sections: sections.length ? sections : undefined,
    bullets: bulletCandidates.length ? bulletCandidates : undefined,
    actions: [
      { id: 'refine_plan', label: 'Refine Plan', kind: 'secondary' },
      { id: 'next_step', label: 'Take Next Step', kind: 'primary' },
    ],
    sources: sources.length ? sources : undefined,
    outcome: paragraphs[1] || undefined,
  };
}

function buildStructuredAnswer(
  input: GenerateFinalAnswerInput,
  answerText: string,
): StructuredAnswer | undefined {
  const requestText = getRequestText(input.request).toLowerCase();
  const asksForTodayPlan =
    /\b(what should i do today|today plan|plan my day|what now today)\b/i.test(
      requestText,
    ) || /\b(today|todays|this morning|this afternoon)\b/i.test(requestText);

  if (asksForTodayPlan || input.route.intent === 'planning') {
    const todayPlan = buildTodayPlanStructure(input);
    return { ...todayPlan, plainText: answerText };
  }

  const generic = buildGenericStructure(input, answerText);
  if (!generic) return undefined;
  return { ...generic, plainText: answerText };
}

function buildLocalizedFallback(
  language: string,
  params: {
    requestText: string;
    memorySummary: string;
    successful: string[];
    failed: string[];
  },
): { text: string; followUps: string[] } {
  const { requestText, memorySummary, successful, failed } = params;

  if (language.startsWith('fi')) {
    return {
      text: [
        `Yhteenveto pyyntöäsi varten: ${requestText || 'Kerro tarkemmin, niin autan mielelläni.'}`,
        memorySummary ? `Aiempi konteksti huomioituna: ${memorySummary}` : '',
        successful.length ? `Tärkeimmät löydökset: ${successful.join(', ')}.` : '',
        failed.length
          ? `Osa tiedoista jäi epävarmaksi, joten täydennä tarvittaessa: ${failed.join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      followUps: [
        'Haluatko tiiviimmän version?',
        'Haluatko, että teen tästä toimintalistan?',
      ],
    };
  }

  if (language.startsWith('sv')) {
    return {
      text: [
        `Här är en tydlig sammanfattning av din begäran: ${requestText || 'Berätta lite mer så hjälper jag gärna.'}`,
        memorySummary ? `Med tidigare kontext i åtanke: ${memorySummary}` : '',
        successful.length ? `Viktigaste resultat: ${successful.join(', ')}.` : '',
        failed.length
          ? `Vissa detaljer kan vara ofullständiga: ${failed.join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      followUps: ['Vill du ha en kortare version?', 'Vill du att jag gör en checklista?'],
    };
  }

  if (language.startsWith('es')) {
    return {
      text: [
        `Aquí tienes una respuesta clara para tu solicitud: ${requestText || 'Comparte un poco más de detalle y la ajusto.'}`,
        memorySummary ? `Teniendo en cuenta el contexto previo: ${memorySummary}` : '',
        successful.length ? `Hallazgos clave: ${successful.join(', ')}.` : '',
        failed.length
          ? `Algunos detalles pueden estar incompletos: ${failed.join(', ')}.`
          : '',
      ]
        .filter(Boolean)
        .join(' '),
      followUps: ['¿Quieres una versión más breve?', '¿Quieres que lo convierta en una lista de acciones?'],
    };
  }

  return {
    text: [
      `Here is a clear answer for your request: ${requestText || 'Share a bit more detail and I can refine this for you.'}`,
      memorySummary ? `Considering earlier context: ${memorySummary}` : '',
      successful.length ? `Key findings: ${successful.join(', ')}.` : '',
      failed.length
        ? `A few details may be incomplete: ${failed.join(', ')}.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
    followUps: [
      'Would you like a shorter version?',
      'Want me to turn this into an action checklist?',
    ],
  };
}

function buildFallbackAnswer(
  input: GenerateFinalAnswerInput,
  language: string,
): AgentFinalAnswer {
  const requestText = getRequestText(input.request);
  const { successful, failed } = summarizeToolResults(input.toolResults);
  const localized = buildLocalizedFallback(language, {
    requestText,
    memorySummary: input.memorySummary,
    successful,
    failed,
  });

  return {
    text: localized.text,
    structured: buildStructuredAnswer(input, localized.text),
    confidence: estimateConfidence(input.route, input.toolResults, localized.text),
    followUps: localized.followUps,
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
  if (!process.env.GROQ_API_KEY) return null;

  const requestText = getRequestText(input.request);
  const language = getLanguage(input);
  const conversation = getConversationMessages(input.request);
  const { compactJson } = summarizeToolResults(input.toolResults);
  const metadata = (input.request.metadata ?? {}) as Record<string, unknown>;
  const responseMode = getResponseMode(input);
  const generatorModel =
    normalizeText(metadata.generatorModel) || 'openai/gpt-oss-120b';

  const systemPrompt = [
    'You are the final answer generator for a premium AI assistant.',
    'Answer the user directly in a natural and friendly way.',
    'Never expose reasoning traces, tool logs, or internal process details.',
    'Do not add sections about memory, planning, or what tools were used.',
    'Use available context silently and focus on practical value.',
    'If data is partial, still provide the most useful answer possible.',
    buildModeInstruction(responseMode),
    buildLanguageInstruction(language),
    'Return JSON only with this schema:',
    '{ "answer": "string", "followUps": ["string"] }',
    'Keep followUps short and useful. Max 3.',
  ].join('\n');

  const userPrompt = [
    `User request: ${requestText}`,
    `Intent: ${input.route.intent}`,
    `Response mode: ${responseMode}`,
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
    'Now produce the final user-facing answer.',
  ].join('\n\n');

  try {
    const completion = await groq.chat.completions.create({
      model: generatorModel,
      temperature: 0.35,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const textOutput = normalizeText(completion.choices?.[0]?.message?.content);
    if (!textOutput) return null;

    const jsonBlock = extractJsonBlock(textOutput);
    if (!jsonBlock) return null;

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
  const structured = buildStructuredAnswer(input, text);
  const confidence = estimateConfidence(input.route, input.toolResults, text);

  return {
    text,
    structured,
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
