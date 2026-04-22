import OpenAI from "openai";

import { buildKernelSystemPrompt } from "./system";
import {
  createDoneEvent,
  createErrorEvent,
  createLogEvent,
  createStatusEvent,
  createToolCallEvent,
  createToolResultEvent,
} from "./stream";
import { buildExecutionPlan } from "./planner";
import { executeKernelTools } from "./tool-executor";
import type {
  KernelDependencies,
  KernelRequest,
  KernelResponse,
  KernelToolEvent,
  KernelUsage,
  RunKernelOptions,
  RunKernelStreamOptions,
} from "./types";

function getClient(apiKey?: string): OpenAI {
  const key = apiKey ?? process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  return new OpenAI({ apiKey: key });
}

function getModel(runtime?: KernelDependencies["runtime"]) {
  return runtime?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
}

function getReasoningEffort(runtime?: KernelDependencies["runtime"]) {
  return runtime?.reasoningEffort ?? "medium";
}

function getMaxOutputTokens(runtime?: KernelDependencies["runtime"]) {
  return runtime?.maxOutputTokens ?? 1600;
}

function coerceMode(
  mode?: KernelRequest["mode"],
): "fast" | "agent" {
  return mode === "agent" ? "agent" : "fast";
}

function extractUsage(response: any): KernelUsage | undefined {
  const usage = response?.usage;
  if (!usage) return undefined;

  return {
    inputTokens:
      typeof usage.input_tokens === "number"
        ? usage.input_tokens
        : undefined,
    outputTokens:
      typeof usage.output_tokens === "number"
        ? usage.output_tokens
        : undefined,
    totalTokens:
      typeof usage.total_tokens === "number"
        ? usage.total_tokens
        : undefined,
  };
}

function buildInputMessage(message: string) {
  return message.trim();
}

function buildToolEvent(
  partial: Partial<KernelToolEvent> &
    Pick<KernelToolEvent, "tool" | "title">,
): KernelToolEvent {
  return {
    id: crypto.randomUUID(),
    tool: partial.tool,
    title: partial.title,
    subtitle: partial.subtitle,
    status: partial.status ?? "running",
  };
}

function buildToolContextBlock(
  toolResults: Array<{
    tool: string;
    ok: boolean;
    summary: string;
    data?: Record<string, unknown>;
  }>,
): string {
  if (!toolResults.length) return "";

  return [
    "Custom tool results:",
    ...toolResults.map((result, index) =>
      [
        `${index + 1}. ${result.tool}`,
        `ok: ${String(result.ok)}`,
        `summary: ${result.summary}`,
        `data: ${JSON.stringify(result.data ?? {})}`,
      ].join("\n"),
    ),
  ].join("\n\n");
}

function inputPayload(
  systemPrompt: string,
  userInput: string,
  toolContext: string,
) {
  const userContent = toolContext
    ? `${userInput}\n\n${toolContext}`
    : userInput;

  return [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userContent,
    },
  ];
}

function getWebSearchTool(userTimezone?: string) {
  return {
    type: "web_search" as const,
    user_location: userTimezone
      ? {
          type: "approximate" as const,
          timezone: userTimezone,
        }
      : undefined,
  };
}

function countWebSearchCalls(response: any): number {
  const output = Array.isArray(response?.output) ? response.output : [];
  return output.filter((item: any) => item?.type === "web_search_call").length;
}

function extractWebSources(response: any): Array<{
  url?: string;
  title?: string;
}> {
  const output = Array.isArray(response?.output) ? response.output : [];
  const sources: Array<{ url?: string; title?: string }> = [];

  for (const item of output) {
    const actionSources = item?.action?.sources;
    if (!Array.isArray(actionSources)) continue;

    for (const source of actionSources) {
      if (!source || typeof source !== "object") continue;
      sources.push({
        url: typeof source.url === "string" ? source.url : undefined,
        title: typeof source.title === "string" ? source.title : undefined,
      });
    }
  }

  return sources;
}

export async function runKernel(
  request: KernelRequest,
  deps: KernelDependencies = {},
  options: RunKernelOptions = {},
): Promise<KernelResponse> {
  const mode = coerceMode(request.mode);
  const client = getClient(deps.apiKey);
  const model = getModel(deps.runtime);

  const systemPrompt = buildKernelSystemPrompt({ mode });
  const userInput = buildInputMessage(request.message);

  if (!userInput) {
    throw new Error("KernelRequest.message cannot be empty.");
  }

  const plan = buildExecutionPlan(request);
  const toolResults = await executeKernelTools(plan.tools, request, {
    userId: request.userId,
    conversationId: request.conversationId,
  });

  const response = await client.responses.create(
    {
      model,
      reasoning: {
        effort: getReasoningEffort(deps.runtime),
      },
      max_output_tokens: getMaxOutputTokens(deps.runtime),
      input: inputPayload(
        systemPrompt,
        userInput,
        buildToolContextBlock(toolResults),
      ),
      tools: plan.useBuiltInWebSearch
        ? [getWebSearchTool()]
        : undefined,
      tool_choice: plan.useBuiltInWebSearch ? "auto" : undefined,
      include: plan.useBuiltInWebSearch
        ? ["web_search_call.action.sources"]
        : undefined,
    },
    {
      signal: options.signal,
    },
  );

  const answer =
    typeof response.output_text === "string"
      ? response.output_text.trim()
      : "";

  return {
    id: response.id,
    mode,
    answer,
    summary: answer.slice(0, 200),
    status: "completed",
    model,
    createdAt: new Date().toISOString(),
    usage: extractUsage(response),
    metadata: {
      conversationId: request.conversationId,
      userId: request.userId,
      toolsUsed: plan.tools,
      toolResults,
      webSearchUsed: countWebSearchCalls(response) > 0,
      webSources: extractWebSources(response),
    },
  };
}

export async function* runKernelStream(
  request: KernelRequest,
  deps: KernelDependencies = {},
  options: RunKernelStreamOptions = {},
) {
  const mode = coerceMode(request.mode);
  const client = getClient(deps.apiKey);
  const model = getModel(deps.runtime);

  const systemPrompt = buildKernelSystemPrompt({ mode });
  const userInput = buildInputMessage(request.message);

  if (!userInput) {
    throw new Error("KernelRequest.message cannot be empty.");
  }

  let finalText = "";
  let finalId = crypto.randomUUID();
  let finalUsage: KernelUsage | undefined;
  let finalResponse: any = null;

  try {
    yield createStatusEvent("starting");
    yield createLogEvent("Kernel stream started.");

    const plan = buildExecutionPlan(request);

    yield createStatusEvent("building_context");
    yield createLogEvent(
      `Planned ${plan.tools.length} custom tools. Built-in web search: ${plan.useBuiltInWebSearch ? "on" : "off"}.`,
    );

    const customToolResults = [];

    for (const toolName of plan.tools) {
      const toolEvent = buildToolEvent({
        tool: toolName,
        title: toolName,
        subtitle: "Executing Kivo tool",
      });

      yield createToolCallEvent(toolEvent);

      const [result] = await executeKernelTools([toolName], request, {
        userId: request.userId,
        conversationId: request.conversationId,
      });

      customToolResults.push(result);

      yield createToolResultEvent({
        ...toolEvent,
        status: result.ok ? "completed" : "failed",
        output: result.summary,
      });
    }

    const webSearchEvent = plan.useBuiltInWebSearch
      ? buildToolEvent({
          tool: "web_search",
          title: "Searching web",
          subtitle: "Using OpenAI built-in web search",
        })
      : null;

    if (webSearchEvent) {
      yield createToolCallEvent(webSearchEvent);
    }

    const generationTool = buildToolEvent({
      tool: "response_generator",
      title: "Generating response",
      subtitle: "Streaming model output",
    });

    const stream = await client.responses.stream(
      {
        model,
        reasoning: {
          effort: getReasoningEffort(deps.runtime),
        },
        max_output_tokens: getMaxOutputTokens(deps.runtime),
        input: inputPayload(
          systemPrompt,
          userInput,
          buildToolContextBlock(customToolResults),
        ),
        tools: plan.useBuiltInWebSearch
          ? [getWebSearchTool()]
          : undefined,
        tool_choice: plan.useBuiltInWebSearch ? "auto" : undefined,
        include: plan.useBuiltInWebSearch
          ? ["web_search_call.action.sources"]
          : undefined,
      },
      {
        signal: options.signal,
      },
    );

    yield createStatusEvent("calling_model");
    yield createToolCallEvent(generationTool);

    for await (const event of stream) {
      if (event.type === "response.output_text.delta") {
        const delta = event.delta ?? "";
        finalText += delta;

        yield {
          type: "answer_delta",
          delta,
          at: new Date().toISOString(),
        };
      }

      if (event.type === "response.completed") {
        finalResponse = event.response;
        finalId = event.response?.id ?? finalId;
        finalUsage = extractUsage(event.response);
      }

      if (event.type === "error") {
        const msg =
          event.error?.message || "OpenAI stream error.";

        yield createToolResultEvent({
          ...generationTool,
          status: "failed",
          output: msg,
        });

        if (webSearchEvent) {
          yield createToolResultEvent({
            ...webSearchEvent,
            status: "failed",
            output: "Web search did not complete.",
          });
        }

        yield createErrorEvent(msg);
        return;
      }
    }

    const webSearchCount = countWebSearchCalls(finalResponse);
    const webSources = extractWebSources(finalResponse);

    if (webSearchEvent) {
      yield createToolResultEvent({
        ...webSearchEvent,
        status: webSearchCount > 0 ? "completed" : "completed",
        output:
          webSearchCount > 0
            ? `Searched the web and consulted ${webSources.length || webSearchCount} sources.`
            : "Web search was available but not needed for the final answer.",
      });
    }

    const content = finalText.trim();

    yield createToolResultEvent({
      ...generationTool,
      status: "completed",
      output: `Generated ${content.length} chars`,
    });

    yield {
      type: "answer_completed",
      content,
      metadata: {
        intent: mode,
        responseMode: "tool",
        execution: {
          intent: "general",
          forceMode:
            plan.tools.length || plan.useBuiltInWebSearch
              ? "execution"
              : "status",
          statusText:
            plan.tools.length || plan.useBuiltInWebSearch
              ? "Completed with tools"
              : "Completed",
          toolCount:
            plan.tools.length + (plan.useBuiltInWebSearch ? 1 : 0),
        },
        structuredData: {
          execution: {
            intent: "general",
            forceMode:
              plan.tools.length || plan.useBuiltInWebSearch
                ? "execution"
                : "status",
            statusText:
              plan.tools.length || plan.useBuiltInWebSearch
                ? "Completed with tools"
                : "Completed",
            toolCount:
              plan.tools.length + (plan.useBuiltInWebSearch ? 1 : 0),
          },
          webSources,
        },
      },
      toolResults: [
        ...customToolResults,
        ...(plan.useBuiltInWebSearch
          ? [
              {
                tool: "web_search",
                ok: true,
                summary:
                  webSearchCount > 0
                    ? `Web search used with ${webSources.length || webSearchCount} consulted sources.`
                    : "Web search available but not used by the model.",
                data: {
                  callCount: webSearchCount,
                  sources: webSources,
                },
              },
            ]
          : []),
      ],
      metrics: {
        charCount: content.length,
      },
      at: new Date().toISOString(),
    };

    const result: KernelResponse = {
      id: finalId,
      mode,
      answer: content,
      summary: content.slice(0, 200),
      status: "completed",
      model,
      createdAt: new Date().toISOString(),
      usage: finalUsage,
      metadata: {
        conversationId: request.conversationId,
        userId: request.userId,
        toolsUsed: plan.tools,
        toolResults: customToolResults,
        webSearchUsed: webSearchCount > 0,
        webSources,
      },
    };

    yield createDoneEvent(result);
    yield createStatusEvent("completed");
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown kernel error.";

    yield createErrorEvent(message);
  }
}
