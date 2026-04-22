import type { KernelRequest } from "./types";
import type { KernelToolName } from "./tool-registry";

export type KernelExecutionPlan = {
  mode: "fast" | "agent";
  tools: KernelToolName[];
  reasoning: "light" | "structured";
  useBuiltInWebSearch: boolean;
};

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function needsFreshWebInfo(text: string): boolean {
  return includesAny(text, [
    "latest",
    "today",
    "current",
    "currently",
    "news",
    "recent",
    "recently",
    "2025",
    "2026",
    "price",
    "prices",
    "best ",
    "compare",
    "comparison",
    "vs ",
    "versus",
    "release date",
    "what happened",
    "update",
    "updates",
    "stock",
    "stocks",
    "crypto",
    "weather",
    "near me",
  ]);
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
    useBuiltInWebSearch: needsFreshWebInfo(text),
  };
}
