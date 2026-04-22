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

  return new OpenAI({
    apiKey: resolvedApiKey,
  });
}

function getModel(runtime?: KernelDependencies["runtime"]): string {
  return runtime?.model ?? process.env.OPENAI_MODEL ?? "gpt-5.4";
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

function extractOutputText(response: any): string {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const output = response?.output;
  if (!Array.isArray(output)) {
    return "";
  }

  const chunks: string[] = [];

  for (const item of output) {
    const content = item?.content;
    if (!Array.isArray(content)) continue;

    for (const block of content) {
      if (block?.type === "output_text" && typeof block?.text === "string") {
        chunks.push(block.text);
      }
    }
  }

  return chunks.join("\n").trim();
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

  const answer = extractOutputText(response);

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
  try {
    yield createStatusEvent("starting");
    yield createLogEvent("Kernel execution started.");

    yield createStatusEvent("building_context");
    yield createLogEvent(
      `Preparing ${request.mode === "agent" ? "agent" : "fast"} mode context.`,
    );

    yield createStatusEvent("calling_model");

    const result = await runKernel(request, deps, options);

    yield createStatusEvent("finalizing");
    yield createDoneEvent(result);
    yield createStatusEvent("completed");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown kernel error.";

    yield createStatusEvent("failed");
    yield createErrorEvent(message);
  }
}
