import type {
  KernelResponse,
  KernelStreamEvent,
  KernelToolEvent,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

export function serializeKernelStreamEvent(event: unknown): string {
  return `${JSON.stringify(event)}\n`;
}

export function createStatusEvent(status: string): KernelStreamEvent {
  return {
    type: "status",
    status,
    at: now(),
  };
}

export function createLogEvent(message: string): KernelStreamEvent {
  return {
    type: "log",
    message,
    at: now(),
  };
}

export function createToolCallEvent(
  tool: KernelToolEvent,
): KernelStreamEvent {
  return {
    type: "tool_started",
    id: tool.id,
    tool: tool.tool,
    title: tool.title,
    subtitle: tool.subtitle,
    at: now(),
  };
}

export function createToolResultEvent(
  tool: KernelToolEvent,
): KernelStreamEvent {
  return {
    type: tool.status === "failed" ? "tool_failed" : "tool_completed",
    id: tool.id,
    tool: tool.tool,
    title: tool.title,
    subtitle: tool.subtitle,
    output: tool.output,
    at: now(),
  };
}

export function createDeltaEvent(delta: string): KernelStreamEvent {
  return {
    type: "answer_delta",
    delta,
    at: now(),
  };
}

export function createAnswerCompletedEvent(args: {
  content: string;
  metadata?: Record<string, unknown>;
  structuredData?: Record<string, unknown>;
  toolResults?: Array<Record<string, unknown>>;
  metrics?: {
    charCount?: number;
    completionMs?: number;
  };
}): KernelStreamEvent {
  return {
    type: "answer_completed",
    content: args.content,
    metadata: args.metadata,
    structuredData: args.structuredData,
    toolResults: args.toolResults,
    metrics: args.metrics,
    at: now(),
  };
}

export function createDoneEvent(result: KernelResponse): KernelStreamEvent {
  return {
    type: "done",
    result,
    at: now(),
  };
}

export function createErrorEvent(message: string): KernelStreamEvent {
  return {
    type: "error",
    error: message,
    at: now(),
  };
}
