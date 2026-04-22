import type { KernelRequest } from "./types";
import type { KernelToolName } from "./tool-registry";

export type KernelExecutionPlan = {
  mode: "fast" | "agent";
  tools: KernelToolName[];
  reasoning: "light" | "structured";
};

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

export function buildExecutionPlan(
  request: KernelRequest,
): KernelExecutionPlan {
  const text = request.message.toLowerCase();
  const mode = request.mode === "agent" ? "agent" : "fast";

  const tools: KernelToolName[] = [];

  if (mode === "agent") {
    tools.push("tasks.plan", "productivity.next_action");
  }

  if (
    includesAny(text, [
      "remember",
      "previous",
      "before",
      "last time",
      "project",
      "context",
    ])
  ) {
    tools.push("memory.search");
  }

  if (
    includesAny(text, [
      "compare",
      "vs",
      "difference",
      "better",
      "best option",
      "which one",
    ])
  ) {
    tools.push("compare.smart");
  }

  if (
    includesAny(text, [
      "money",
      "budget",
      "save",
      "subscription",
      "finance",
      "cost",
      "price",
    ])
  ) {
    tools.push("finance.analyze");
  }

  return {
    mode,
    tools: Array.from(new Set(tools)),
    reasoning: mode === "agent" ? "structured" : "light",
  };
}
