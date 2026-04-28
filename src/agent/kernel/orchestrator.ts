import OpenAI from 'openai';
import { buildKernelSystemPrompt } from './system';
import { routeKernelModel, type ModelRouterOutput } from './model-router';
import {
  createAnswerCompletedEvent,
  createDeltaEvent,
  createDoneEvent,
  createErrorEvent,
  createLogEvent,
  createStatusEvent,
  createToolCallEvent,
  createToolResultEvent,
} from './stream';
import { buildExecutionPlan, type KernelExecutionPlan } from './planner';
import { executeKernelTools } from './tool-executor';
import type {
  KernelDependencies,
  KernelRequest,
  KernelResponse,
  KernelToolEvent,
  KernelUsage,
  RunKernelOptions,
  RunKernelStreamOptions,
} from './types';
import type { KernelPlannerIntent } from './planner';

type ToolResult = { tool: string; ok: boolean; summary: string; data?: Record<string, unknown> };

function getClient(provider: 'openai' | 'groq', apiKey?: string): OpenAI {
  if (provider === 'groq') {
    const key = apiKey ?? process.env.GROQ_API_KEY;
    if (!key) throw new Error('GROQ_API_KEY is missing.');
    return new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
  }

  const key = apiKey ?? process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is missing.');
  return new OpenAI({ apiKey: key });
}

function getReasoningEffort(runtime?: KernelDependencies['runtime']) {
  return runtime?.reasoningEffort ?? 'medium';
}

function getMaxOutputTokens(runtime?: KernelDependencies['runtime']) {
  return runtime?.maxOutputTokens ?? 1600;
}

function coerceMode(mode?: KernelRequest['mode']): 'fast' | 'agent' {
  return mode === 'agent' ? 'agent' : 'fast';
}

function requiresHighAccuracy(message: string, intent: KernelPlannerIntent): boolean {
  if (intent === 'finance' || intent === 'research') return true;
  return /medical|legal|compliance|security|tax|contract|diagnos|prescription/i.test(message);
}

function resolveRoute(request: KernelRequest, plan: KernelExecutionPlan, isRepairPass: boolean): ModelRouterOutput {
  return routeKernelModel({
    message: request.message,
    intent: plan.intent,
    taskDepth: plan.taskDepth,
    needsTools: plan.tools.length > 0 || plan.useBuiltInWebSearch,
    requiresHighAccuracy: requiresHighAccuracy(request.message, plan.intent),
    isRepairPass,
  });
}

function buildInputMessage(message: string) {
  return message.trim();
}

function extractUsage(response: any): KernelUsage | undefined {
  const usage = response?.usage;
  if (!usage) return undefined;
  return {
    inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : undefined,
    outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : undefined,
    totalTokens: typeof usage.total_tokens === 'number' ? usage.total_tokens : undefined,
  };
}

function buildToolEvent(partial: Partial<KernelToolEvent> & Pick<KernelToolEvent, 'tool' | 'title'>): KernelToolEvent {
  return {
    id: crypto.randomUUID(),
    tool: partial.tool,
    title: partial.title,
    subtitle: partial.subtitle,
    status: partial.status ?? 'running',
    output: partial.output,
  };
}

function countWebSearchCalls(response: any): number {
  const output = Array.isArray(response?.output) ? response.output : [];
  return output.filter((item: any) => item?.type === 'web_search_call').length;
}

function extractWebSources(response: any): Array<{ url?: string; title?: string }> {
  const output = Array.isArray(response?.output) ? response.output : [];
  const sources: Array<{ url?: string; title?: string }> = [];
  for (const item of output) {
    const actionSources = item?.action?.sources;
    if (!Array.isArray(actionSources)) continue;
    for (const source of actionSources) {
      if (source && typeof source === 'object') {
        sources.push({
          url: typeof source.url === 'string' ? source.url : undefined,
          title: typeof source.title === 'string' ? source.title : undefined,
        });
      }
    }
  }
  return sources;
}

function extractTextFromResponse(response: any): string {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  const output = Array.isArray(response?.output) ? response.output : [];
  const parts: string[] = [];
  for (const item of output) {
    if (item?.type !== 'message') continue;
    const content = Array.isArray(item?.content) ? item.content : [];
    for (const block of content) {
      const text = typeof block?.text === 'string' ? block.text : typeof block?.content === 'string' ? block.content : '';
      if (text.trim()) parts.push(text.trim());
    }
  }
  return parts.join('\n\n').trim();
}

function summarizeFindings(result: ToolResult): string {
  const data = result.data ?? {};
  if (result.tool === 'gmail.inbox_summary') {
    const count = typeof data.emailsAnalyzed === 'number' ? data.emailsAnalyzed : 0;
    return result.ok ? `Inbox context analyzed (${count} emails).` : 'Inbox intelligence unavailable.';
  }
  if (result.tool === 'gmail.finance_scan') {
    const subs = typeof data.subscriptionsFound === 'number' ? data.subscriptionsFound : 0;
    const savings = typeof data.estimatedMonthlySavings === 'number' ? data.estimatedMonthlySavings : 0;
    return result.ok ? `Detected ${subs} subscription signals; est. savings ${savings}.` : 'Gmail finance scan unavailable.';
  }
  if (result.tool === 'calendar.today' || result.tool === 'calendar.search') {
    const count = typeof data.count === 'number' ? data.count : Array.isArray(data.events) ? data.events.length : 0;
    return count > 0 ? `Found ${count} calendar event${count === 1 ? '' : 's'}.` : 'No calendar events found for requested window.';
  }
  if (result.tool === 'memory.search') {
    const notes = Array.isArray(data.notes) ? data.notes.length : 0;
    return notes > 0 ? `Recovered ${notes} relevant memory note${notes === 1 ? '' : 's'}.` : 'No highly relevant memory found.';
  }
  return result.summary;
}

function missingContext(results: ToolResult[]): string[] {
  return Array.from(
    new Set(
      results
        .filter((result) => !result.ok)
        .map((result) => {
          if (result.tool.startsWith('gmail.')) return 'Gmail context unavailable or disconnected.';
          if (result.tool.startsWith('calendar.')) return 'Calendar context unavailable or disconnected.';
          if (result.tool.startsWith('memory.')) return 'No reliable memory signal found.';
          return `${result.tool}: ${result.summary}`;
        }),
    ),
  );
}

function buildToolContextBlock(request: KernelRequest, plan: KernelExecutionPlan, results: ToolResult[]): string {
  if (!results.length && !plan.shouldAskClarifyingQuestion) return '';
  const findings = results.map(summarizeFindings);
  const missing = missingContext(results);
  const lines = [
    'Kivo Intelligence Context:',
    `intent: ${plan.intent}`,
    `confidence: ${plan.confidence.toFixed(2)}`,
    `reasoning_mode: ${plan.reasoning}`,
    `task_depth: ${plan.taskDepth}`,
    `priorities: ${plan.priorities.join(' | ')}`,
    `assumptions: ${plan.assumptions.length ? plan.assumptions.join(' | ') : 'none'}`,
    `next_best_action_hint: ${plan.nextBestActionHint}`,
    `evaluation_checks: ${plan.evaluationChecks.join(' | ')}`,
    `planner_reasons: ${plan.reasons.join(' | ') || 'none'}`,
    `clarify_if_needed: ${plan.shouldAskClarifyingQuestion ? plan.clarifyingQuestion : 'not required'}`,
    'findings:',
    ...(findings.length ? findings.map((line) => `- ${line}`) : ['- no custom tool findings']),
    'missing_context:',
    ...(missing.length ? missing.map((line) => `- ${line}`) : ['- none']),
    '',
    'Raw tool results:',
    ...results.map((result, index) => [`${index + 1}. ${result.tool}`, `ok: ${String(result.ok)}`, `summary: ${result.summary}`, `data: ${JSON.stringify(result.data ?? {})}`].join('\n')),
  ];

  if (!request.message.trim().endsWith('?') && plan.shouldAskClarifyingQuestion) {
    lines.push('', 'Guidance: If ambiguity remains high, ask exactly one targeted clarifying question before deep detail.');
  }

  return lines.join('\n');
}

function inputPayload(systemPrompt: string, userInput: string, toolContext: string) {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: toolContext ? `${userInput}\n\n${toolContext}` : userInput },
  ];
}

function getWebSearchTool() {
  return { type: 'web_search' as const };
}

function assessAnswerQuality(answer: string, plan: KernelExecutionPlan, results: ToolResult[]): { score: number; issues: string[]; shouldRepair: boolean } {
  const issues: string[] = [];
  const trimmed = answer.trim();
  if (trimmed.length < 80 && plan.taskDepth !== 'quick') issues.push('Answer is too short for requested depth.');
  if (!/[\n\-•]|\d+\./.test(trimmed) && (plan.taskDepth === 'deep' || results.length > 2)) issues.push('Answer lacks structured action format.');
  if (!/next action|next step|first step|first action/i.test(trimmed)) issues.push('No clear next action stated.');
  if (results.some((result) => !result.ok) && !/missing|unavailable|disconnected|fallback/i.test(trimmed)) {
    issues.push('Missing context limitations were not clearly acknowledged.');
  }
  const score = Math.max(0, 1 - issues.length * 0.22);
  return { score, issues, shouldRepair: issues.length >= 2 };
}

async function repairAnswerIfNeeded(
  client: OpenAI,
  route: ModelRouterOutput,
  deps: KernelDependencies,
  input: { answer: string; plan: KernelExecutionPlan; results: ToolResult[]; issues: string[] },
  signal?: AbortSignal,
): Promise<string> {
  if (!input.issues.length) return input.answer;
  const repairPrompt = [
    'Improve the draft answer below.',
    'Keep facts exactly the same; do not invent tool results.',
    'Fix these quality issues:',
    ...input.issues.map((issue) => `- ${issue}`),
    'Make the final response concise, premium, actionable, and include a specific next action.',
    '',
    'Draft answer:',
    input.answer,
  ].join('\n');

  const improved =
    route.provider === 'groq'
      ? extractTextFromChatCompletion(
          await client.chat.completions.create(
            {
              model: route.model,
              temperature: 0.1,
              messages: [
                { role: 'system', content: 'You are an expert response editor for Kivo. Improve clarity, actionability, and structure without changing facts.' },
                { role: 'user', content: repairPrompt },
              ],
            },
            { signal },
          ),
        )
      : extractTextFromResponse(
          await client.responses.create(
            {
              model: route.model,
              reasoning: { effort: deps.runtime?.reasoningEffort ?? 'low' },
              max_output_tokens: Math.min(1200, getMaxOutputTokens(deps.runtime)),
              input: [
                { role: 'system', content: 'You are an expert response editor for Kivo. Improve clarity, actionability, and structure without changing facts.' },
                { role: 'user', content: repairPrompt },
              ],
            },
            { signal },
          ),
        );

  return improved || input.answer;
}

function extractTextFromChatCompletion(response: any): string {
  const choices = Array.isArray(response?.choices) ? response.choices : [];
  const first = choices[0];
  const content = first?.message?.content;
  if (typeof content === 'string') return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n')
      .trim();
  }
  return '';
}

async function runModelOnce(
  client: OpenAI,
  route: ModelRouterOutput,
  deps: KernelDependencies,
  request: KernelRequest,
  plan: KernelExecutionPlan,
  toolResults: ToolResult[],
  options: RunKernelOptions | RunKernelStreamOptions,
) {
  const systemPrompt = buildKernelSystemPrompt({ mode: plan.mode });
  const userInput = buildInputMessage(request.message);
  const toolContext = buildToolContextBlock(request, plan, toolResults);
  if (route.provider === 'groq') {
    const completion = await client.chat.completions.create(
      {
        model: route.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: toolContext ? `${userInput}\n\n${toolContext}` : userInput },
        ],
      },
      { signal: options.signal },
    );

    return {
      response: completion,
      answer: extractTextFromChatCompletion(completion),
      webSearchCount: 0,
      webSources: [] as Array<{ url?: string; title?: string }>,
    };
  }

  const response = await client.responses.create(
    {
      model: route.model,
      reasoning: { effort: getReasoningEffort(deps.runtime) },
      max_output_tokens: getMaxOutputTokens(deps.runtime),
      input: inputPayload(systemPrompt, userInput, toolContext),
      tools: plan.useBuiltInWebSearch ? [getWebSearchTool()] : undefined,
      tool_choice: plan.useBuiltInWebSearch ? 'auto' : undefined,
      include: plan.useBuiltInWebSearch ? ['web_search_call.action.sources'] : undefined,
    },
    { signal: options.signal },
  );

  const answer = extractTextFromResponse(response);
  return {
    response,
    answer,
    webSearchCount: countWebSearchCalls(response),
    webSources: extractWebSources(response),
  };
}

function buildExecutionMetadata(
  plan: KernelExecutionPlan,
  toolCount: number,
  routing: { provider: 'groq' | 'openai'; model: string; costTier: 'low' | 'medium' | 'high'; reason: string; fallbackUsed: boolean },
  quality?: { score: number; issues: string[] },
) {
  return {
    intent: plan.intent,
    confidence: plan.confidence,
    taskDepth: plan.taskDepth,
    provider: routing.provider,
    model: routing.model,
    costTier: routing.costTier,
    routingReason: routing.reason,
    fallbackUsed: routing.fallbackUsed,
    responseMode: 'tool',
    execution: {
      intent: plan.intent,
      forceMode: toolCount ? 'execution' : 'status',
      statusText: toolCount ? 'Completed with context intelligence' : 'Completed',
      toolCount,
      confidence: plan.confidence,
      taskDepth: plan.taskDepth,
    },
    evaluation: quality
      ? {
          score: quality.score,
          issues: quality.issues,
        }
      : undefined,
  };
}

export async function runKernel(request: KernelRequest, deps: KernelDependencies = {}, options: RunKernelOptions = {}): Promise<KernelResponse> {
  const mode = coerceMode(request.mode);
  const userInput = buildInputMessage(request.message);
  if (!userInput) throw new Error('KernelRequest.message cannot be empty.');

  const plan = buildExecutionPlan(request);
  const toolResults = await executeKernelTools(plan.tools, request, { userId: request.userId, conversationId: request.conversationId }, { toolBatches: plan.toolBatches, retries: 1, timeoutMs: 12_000 });
  const route = resolveRoute(request, plan, false);
  let fallbackUsed = false;
  let activeRoute = route;
  let modelRun;
  try {
    modelRun = await runModelOnce(getClient(route.provider, deps.apiKey), route, deps, { ...request, mode }, { ...plan, mode }, toolResults, options);
  } catch (error) {
    if (route.provider !== 'groq' || route.fallbackProvider !== 'openai') throw error;
    fallbackUsed = true;
    activeRoute = {
      provider: 'openai',
      model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
      costTier: 'high',
      reason: `${route.reason} Groq request failed, retried once with OpenAI fallback.`,
      fallbackProvider: 'groq',
    };
    modelRun = await runModelOnce(getClient('openai', deps.apiKey), activeRoute, deps, { ...request, mode }, { ...plan, mode }, toolResults, options);
  }
  const quality = assessAnswerQuality(modelRun.answer, plan, toolResults);
  const repairRoute = resolveRoute(request, plan, true);
  const finalAnswer = quality.shouldRepair
    ? await repairAnswerIfNeeded(getClient(repairRoute.provider, deps.apiKey), repairRoute, deps, { answer: modelRun.answer, plan, results: toolResults, issues: quality.issues }, options.signal)
    : modelRun.answer;
  const effectiveRoute = quality.shouldRepair ? repairRoute : activeRoute;
  const executionMetadata = buildExecutionMetadata(
    plan,
    plan.tools.length + (plan.useBuiltInWebSearch && effectiveRoute.provider === 'openai' ? 1 : 0),
    {
      provider: effectiveRoute.provider,
      model: effectiveRoute.model,
      costTier: effectiveRoute.costTier,
      reason: effectiveRoute.reason,
      fallbackUsed,
    },
    quality,
  );

  return {
    id: modelRun.response.id,
    mode,
    answer: finalAnswer,
    summary: finalAnswer.slice(0, 200),
    status: 'completed',
    model: effectiveRoute.model,
    createdAt: new Date().toISOString(),
    usage: extractUsage(modelRun.response),
    metadata: {
      conversationId: request.conversationId,
      userId: request.userId,
      ...executionMetadata,
      importantFindings: toolResults.map(summarizeFindings),
      missingContext: missingContext(toolResults),
      toolResults,
      toolsUsed: plan.tools,
      toolBatches: plan.toolBatches,
      webSearchUsed: effectiveRoute.provider === 'openai' && modelRun.webSearchCount > 0,
      webSources: modelRun.webSources,
      planner: {
        reasons: plan.reasons,
        assumptions: plan.assumptions,
        priorities: plan.priorities,
        nextBestActionHint: plan.nextBestActionHint,
        clarifyingQuestion: plan.clarifyingQuestion,
      },
    },
  };
}

export async function* runKernelStream(request: KernelRequest, deps: KernelDependencies = {}, options: RunKernelStreamOptions = {}) {
  const mode = coerceMode(request.mode);
  const userInput = buildInputMessage(request.message);
  if (!userInput) throw new Error('KernelRequest.message cannot be empty.');

  let finalText = '';
  let finalId = crypto.randomUUID();
  let finalUsage: KernelUsage | undefined;
  let finalResponse: any = null;
  const startedAt = Date.now();

  try {
    yield createStatusEvent('thinking');
    yield createLogEvent('Kernel stream started.');

    const plan = buildExecutionPlan({ ...request, mode });
    const route = resolveRoute(request, plan, false);
    let activeRoute = route;
    let fallbackUsed = false;
    yield createStatusEvent('planning');
    yield createLogEvent(`Intent=${plan.intent} confidence=${plan.confidence.toFixed(2)} depth=${plan.taskDepth} tools=${plan.tools.length}. provider=${route.provider} model=${route.model}`);

    const customToolResults: ToolResult[] = [];
    yield createStatusEvent('executing');

    for (const batch of plan.toolBatches.length ? plan.toolBatches : [plan.tools]) {
      const events = batch.map((tool) => buildToolEvent({ tool, title: tool, subtitle: 'Executing Kivo tool' }));
      for (const toolEvent of events) yield createToolCallEvent(toolEvent);
      const batchResults = await executeKernelTools(batch, request, { userId: request.userId, conversationId: request.conversationId }, { retries: 1, timeoutMs: 12_000 });
      customToolResults.push(...batchResults);
      for (const [index, result] of batchResults.entries()) {
        const toolEvent = events[index] ?? buildToolEvent({ tool: result.tool, title: result.tool, subtitle: 'Executing Kivo tool' });
        yield createToolResultEvent({ ...toolEvent, status: result.ok ? 'completed' : 'failed', output: result.summary });
      }
    }

    const webSearchEvent = plan.useBuiltInWebSearch && activeRoute.provider === 'openai'
      ? buildToolEvent({ tool: 'web_search', title: 'Searching web', subtitle: 'Using built-in web search when useful' })
      : null;
    if (webSearchEvent) yield createToolCallEvent(webSearchEvent);

    const generationTool = buildToolEvent({ tool: 'response_generator', title: 'Generating response', subtitle: 'Streaming model output' });
    yield createToolCallEvent(generationTool);

    const modelInput = buildToolContextBlock(request, plan, customToolResults);
    const runPrimaryStream = async function* (selectedRoute: ModelRouterOutput): AsyncGenerator<string, void, void> {
      const client = getClient(selectedRoute.provider, deps.apiKey);
      if (selectedRoute.provider === 'groq') {
        const stream = await client.chat.completions.create(
          {
            model: selectedRoute.model,
            stream: true,
            temperature: 0.2,
            messages: [
              { role: 'system', content: buildKernelSystemPrompt({ mode }) },
              { role: 'user', content: modelInput ? `${userInput}\n\n${modelInput}` : userInput },
            ],
          },
          { signal: options.signal },
        );
        for await (const event of stream as any) {
          const delta = typeof event?.choices?.[0]?.delta?.content === 'string' ? event.choices[0].delta.content : '';
          if (!delta) continue;
          finalText += delta;
          yield delta;
        }
        finalResponse = { id: `groq-${crypto.randomUUID()}` };
        finalId = finalResponse.id;
        return;
      }

      const stream = await client.responses.create(
        {
          model: selectedRoute.model,
          stream: true,
          reasoning: { effort: getReasoningEffort(deps.runtime) },
          max_output_tokens: getMaxOutputTokens(deps.runtime),
          input: inputPayload(buildKernelSystemPrompt({ mode }), userInput, modelInput),
          tools: plan.useBuiltInWebSearch ? [getWebSearchTool()] : undefined,
          tool_choice: plan.useBuiltInWebSearch ? 'auto' : undefined,
          include: plan.useBuiltInWebSearch ? ['web_search_call.action.sources'] : undefined,
        },
        { signal: options.signal },
      );

      for await (const event of stream as any) {
        if (event?.type === 'response.output_text.delta') {
          const delta = typeof event?.delta === 'string' ? event.delta : typeof event?.text === 'string' ? event.text : '';
          if (!delta) continue;
          finalText += delta;
          yield delta;
          continue;
        }
        if (event?.type === 'response.completed') {
          finalResponse = event.response;
          finalId = event.response?.id ?? finalId;
          finalUsage = extractUsage(event.response);
          continue;
        }
      }
    };

    try {
      for await (const delta of runPrimaryStream(activeRoute)) {
        yield createDeltaEvent(delta);
      }
    } catch (error) {
      if (activeRoute.provider !== 'groq' || activeRoute.fallbackProvider !== 'openai') {
        throw error;
      }
      fallbackUsed = true;
      activeRoute = {
        provider: 'openai',
        model: process.env.OPENAI_MODEL ?? 'gpt-5.4-mini',
        costTier: 'high',
        reason: `${activeRoute.reason} Groq stream failed, retried once with OpenAI fallback.`,
        fallbackProvider: 'groq',
      };
      yield createLogEvent('Groq stream failed; retrying once with OpenAI fallback.');
      finalText = '';
      for await (const delta of runPrimaryStream(activeRoute)) {
        yield createDeltaEvent(delta);
      }
    }

    yield createStatusEvent('evaluating');

    const webSearchCount = countWebSearchCalls(finalResponse);
    const webSources = extractWebSources(finalResponse);
    if (webSearchEvent && activeRoute.provider === 'openai') {
      yield createToolResultEvent({
        ...webSearchEvent,
        status: 'completed',
        output:
          webSearchCount > 0
            ? `Searched web and consulted ${webSources.length || webSearchCount} sources.`
            : 'Web search was available but not used.',
      });
    }

    const rawContent = finalText.trim() || extractTextFromResponse(finalResponse) || '';
    const quality = assessAnswerQuality(rawContent, plan, customToolResults);
    const repairRoute = resolveRoute(request, plan, true);
    const content = quality.shouldRepair
      ? await repairAnswerIfNeeded(getClient(repairRoute.provider, deps.apiKey), repairRoute, deps, { answer: rawContent, plan, results: customToolResults, issues: quality.issues }, options.signal)
      : rawContent;
    const effectiveRoute = quality.shouldRepair ? repairRoute : activeRoute;

    yield createToolResultEvent({
      ...generationTool,
      status: content ? 'completed' : 'failed',
      output: content ? `Generated ${content.length} chars` : 'No response text produced by the model.',
    });

    const toolCount = plan.tools.length + (plan.useBuiltInWebSearch && effectiveRoute.provider === 'openai' ? 1 : 0);
    const executionMetadata = buildExecutionMetadata(
      plan,
      toolCount,
      {
        provider: effectiveRoute.provider,
        model: effectiveRoute.model,
        costTier: effectiveRoute.costTier,
        reason: effectiveRoute.reason,
        fallbackUsed,
      },
      quality,
    );

    yield createAnswerCompletedEvent({
      content,
      metadata: executionMetadata,
      structuredData: {
        execution: executionMetadata.execution,
        intent: plan.intent,
        confidence: plan.confidence,
        taskDepth: plan.taskDepth,
        importantFindings: customToolResults.map(summarizeFindings),
        missingContext: missingContext(customToolResults),
        priorities: plan.priorities,
        assumptions: plan.assumptions,
        plannerReasons: plan.reasons,
        clarifyingQuestion: plan.clarifyingQuestion,
        nextBestActionHint: plan.nextBestActionHint,
        evaluation: executionMetadata.evaluation,
        toolsUsed: plan.tools,
        toolBatches: plan.toolBatches,
        webSources,
      },
      toolResults: [
        ...customToolResults,
        ...(plan.useBuiltInWebSearch && effectiveRoute.provider === 'openai'
          ? [
              {
                tool: 'web_search',
                ok: true,
                summary:
                  webSearchCount > 0
                    ? `Web search used with ${webSources.length || webSearchCount} consulted sources.`
                    : 'Web search available but not used by the model.',
                data: { callCount: webSearchCount, sources: webSources },
              },
            ]
          : []),
      ],
      metrics: { charCount: content.length, completionMs: Date.now() - startedAt },
    });

    const result: KernelResponse = {
      id: finalId,
      mode,
      answer: content,
      summary: content.slice(0, 200),
      status: 'completed',
      model: effectiveRoute.model,
      createdAt: new Date().toISOString(),
      usage: finalUsage,
      metadata: {
        conversationId: request.conversationId,
        userId: request.userId,
        ...executionMetadata,
        importantFindings: customToolResults.map(summarizeFindings),
        missingContext: missingContext(customToolResults),
        toolsUsed: plan.tools,
        toolBatches: plan.toolBatches,
        toolResults: customToolResults,
        webSearchUsed: effectiveRoute.provider === 'openai' && webSearchCount > 0,
        webSources,
      },
    };

    yield createDoneEvent(result);
    yield createStatusEvent('completed');
  } catch (error) {
    yield createErrorEvent(error instanceof Error ? error.message : 'Unknown kernel error.');
  }
}
