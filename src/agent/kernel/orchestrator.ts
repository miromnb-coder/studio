import OpenAI from "openai";

import { buildKernelSystemPrompt } from "./system";
import {
  createDoneEvent,
  createErrorEvent,
  createLogEvent,
  createStatusEvent,
} from "./stream";
import type {
  KernelDependencies,
  KernelRequest,
  KernelResponse,
  KernelUsage,
  RunKernelOptions,
  RunKernelStreamOptions,
} from "./types";

function getClient(apiKey?: string): OpenAI {
  const resolvedApiKey = apiKey ?? process.env.OPENAI_API_KEY;

  if (!resolvedApiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  return new OpenAI({ apiKey: resolvedApiKey });
}

function getModel(runtime?: KernelDependencies["runtime"]): string {
  return runtime?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
}

function getReasoningEffort(runtime?: KernelDependencies["runtime"]) {
  return runtime?.reasoningEffort ?? "medium";
}

function getMaxOutputTokens(runtime?: KernelDependencies["runtime"]): number {
  return runtime?.maxOutputTokens ?? 1600;
}

function coerceMode(mode?: KernelRequest["mode"]): "fast" | "agent" {
  return mode === "agent" ? "agent" : "fast";
}

function extractUsage(response: any): KernelUsage | undefined {
  const usage = response?.usage;
  if (!usage) return undefined;

  const inputTokens =
    typeof usage?.input_tokens === "number" ? usage.input_tokens : undefined;
  const outputTokens =
    typeof usage?.output_tokens === "number" ? usage.output_tokens : undefined;
  const totalTokens =
    typeof usage?.total_tokens === "number" ? usage.total_tokens : undefined;

  if (
    inputTokens === undefined &&
    outputTokens === undefined &&
    totalTokens === undefined
  ) {
    return undefined;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

function buildInputMessage(message: string): string {
  return message.trim();
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

  const response = await client.responses.create(
    {
      model,
      reasoning: {
        effort: getReasoningEffort(deps.runtime),
      },
      max_output_tokens: getMaxOutputTokens(deps.runtime),
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: userInput }],
        },
      ],
    },
    {
      signal: options.signal,
    },
  );

  const answer =
    typeof response.output_text === "string" ? response.output_text.trim() : "";

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
    throw new Error("KernelRequest.message cannot be empty.");
  }

  let finalText = "";
  let finalResponseId = "";
  let finalUsage: KernelUsage | undefined;

  try {
    yield createStatusEvent("starting");
    yield createLogEvent("Kernel execution started.");

    yield createStatusEvent("building_context");
    yield createLogEvent(
      `Preparing ${mode === "agent" ? "agent" : "fast"} mode context.`,
    );

    const stream = await client.responses.create(
      {
        model,
        stream: true,
        reasoning: {
          effort: getReasoningEffort(deps.runtime),
        },
        max_output_tokens: getMaxOutputTokens(deps.runtime),
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: systemPrompt }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userInput }],
          },
        ],
      },
      {
        signal: options.signal,
      },
    );

    yield createStatusEvent("calling_model");

    for await (const event of stream) {
      switch (event.type) {
        case "response.created": {
          finalResponseId = event.response?.id ?? finalResponseId;
          break;
        }

        case "response.output_text.delta": {
          finalText += event.delta ?? "";
          yield {
            type: "delta",
            text: event.delta ?? "",
            at: new Date().toISOString(),
          };
          break;
        }

        case "response.completed": {
          finalResponseId = event.response?.id ?? finalResponseId;
          finalUsage = extractUsage(event.response);
          yield createStatusEvent("finalizing");
          break;
        }

        case "error": {
          const message =
            event.error?.message || "OpenAI streaming error.";
          yield createStatusEvent("failed");
          yield createErrorEvent(message);
          return;
        }

        default:
          break;
      }
    }

    const result: KernelResponse = {
      id: finalResponseId || crypto.randomUUID(),
      mode,
      answer: finalText.trim(),
      summary: finalText.trim().slice(0, 200),
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
      error instanceof Error ? error.message : "Unknown kernel error.";

    yield createStatusEvent("failed");
    yield createErrorEvent(message);
  }
}
