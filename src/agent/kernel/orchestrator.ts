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

function inputPayload(systemPrompt: string, userInput: string) {
  return [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: userInput,
    },
  ];
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
    throw new Error(
      "KernelRequest.message cannot be empty.",
    );
  }

  const response = await client.responses.create(
    {
      model,
      reasoning: {
        effort: getReasoningEffort(deps.runtime),
      },
      max_output_tokens: getMaxOutputTokens(
        deps.runtime,
      ),
      input: inputPayload(systemPrompt, userInput),
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
    throw new Error(
      "KernelRequest.message cannot be empty.",
    );
  }

  let finalText = "";
  let finalId = crypto.randomUUID();
  let finalUsage: KernelUsage | undefined;

  const contextTool = buildToolEvent({
    tool: "context_builder",
    title: "Building context",
    subtitle: "Preparing request",
  });

  const generationTool = buildToolEvent({
    tool: "response_generator",
    title: "Generating response",
    subtitle: "Streaming model output",
  });

  try {
    yield createStatusEvent("starting");
    yield createLogEvent("Kernel stream started.");

    yield createToolCallEvent(contextTool);
    yield createToolResultEvent({
      ...contextTool,
      status: "completed",
      output: `Mode: ${mode}`,
    });

    const stream =
      await client.responses.stream(
        {
          model,
          reasoning: {
            effort: getReasoningEffort(
              deps.runtime,
            ),
          },
          max_output_tokens:
            getMaxOutputTokens(deps.runtime),
          input: inputPayload(
            systemPrompt,
            userInput,
          ),
        },
        {
          signal: options.signal,
        },
      );

    yield createToolCallEvent(generationTool);

    for await (const event of stream) {
      if (
        event.type ===
        "response.output_text.delta"
      ) {
        const delta = event.delta ?? "";
        finalText += delta;

        yield {
          type: "answer_delta",
          delta,
          at: new Date().toISOString(),
        };
      }

      if (
        event.type === "response.completed"
      ) {
        finalId =
          event.response?.id ?? finalId;
        finalUsage = extractUsage(
          event.response,
        );
      }

      if (event.type === "error") {
        const msg =
          event.error?.message ||
          "OpenAI stream error.";

        yield createToolResultEvent({
          ...generationTool,
          status: "failed",
          output: msg,
        });

        yield createErrorEvent(msg);
        return;
      }
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
        responseMode: "chat",
      },
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
