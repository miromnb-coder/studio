import type {
  KernelResponse,
  KernelStatus,
  KernelStreamEvent,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

export function createStatusEvent(value: KernelStatus): KernelStreamEvent {
  return {
    type: "status",
    value,
    at: now(),
  };
}

export function createDeltaEvent(text: string): KernelStreamEvent {
  return {
    type: "delta",
    text,
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
    message,
    at: now(),
  };
}

export function serializeKernelStreamEvent(event: KernelStreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function serializeKernelStreamEvents(
  events: KernelStreamEvent[],
): string {
  return events.map(serializeKernelStreamEvent).join("");
}
