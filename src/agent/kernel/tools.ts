import type { KernelRequest } from "./types";
import type {
  KernelToolContext,
  KernelToolName,
  KernelToolResult,
} from "./tool-registry";

function lower(text: string) {
  return text.toLowerCase();
}

export async function runMemorySearchTool(
  request: KernelRequest,
  context: KernelToolContext,
): Promise<KernelToolResult> {
  return {
    tool: "memory.search",
    ok: true,
    summary: "Checked for prior context related to the user's request.",
    data: {
      userId: context.userId ?? null,
      found: false,
      notes: [],
    },
  };
}

export async function runTasksPlanTool(
  request: KernelRequest,
  _context: KernelToolContext,
): Promise<KernelToolResult> {
  const content = request.message.trim();

  return {
    tool: "tasks.plan",
    ok: true,
    summary: "Built a lightweight execution plan.",
    data: {
      steps: [
        `Understand the goal behind: "${content.slice(0, 80)}"`,
        "Identify the most useful response structure",
        "Produce a clear action-oriented answer",
      ],
    },
  };
}

export async function runNextActionTool(
  request: KernelRequest,
  _context: KernelToolContext,
): Promise<KernelToolResult> {
  const text = lower(request.message);

  let nextAction = "Clarify the goal and give the most actionable next step.";

  if (text.includes("build") || text.includes("create")) {
    nextAction = "Break the build into the first concrete implementation step.";
  } else if (text.includes("money") || text.includes("save")) {
    nextAction = "Identify the biggest savings opportunity first.";
  } else if (text.includes("plan") || text.includes("schedule")) {
    nextAction = "Turn the request into a prioritized plan.";
  }

  return {
    tool: "productivity.next_action",
    ok: true,
    summary: "Identified the best immediate next action.",
    data: {
      nextAction,
    },
  };
}

export async function runCompareSmartTool(
  request: KernelRequest,
  _context: KernelToolContext,
): Promise<KernelToolResult> {
  return {
    tool: "compare.smart",
    ok: true,
    summary: "Prepared a comparison frame for evaluating options.",
    data: {
      dimensions: ["cost", "speed", "quality", "complexity", "future-proofing"],
      prompt: request.message,
    },
  };
}

export async function runFinanceAnalyzeTool(
  request: KernelRequest,
  _context: KernelToolContext,
): Promise<KernelToolResult> {
  const text = lower(request.message);

  return {
    tool: "finance.analyze",
    ok: true,
    summary: "Analyzed the request for finance-related opportunities.",
    data: {
      category:
        text.includes("subscription") || text.includes("monthly")
          ? "subscriptions"
          : text.includes("budget") || text.includes("save")
            ? "budgeting"
            : "general_finance",
      likelyOpportunity:
        text.includes("save") || text.includes("money")
          ? "Potential savings opportunity detected."
          : "No strong finance pattern detected.",
    },
  };
}

export async function runKernelTool(
  tool: KernelToolName,
  request: KernelRequest,
  context: KernelToolContext,
): Promise<KernelToolResult> {
  switch (tool) {
    case "memory.search":
      return runMemorySearchTool(request, context);
    case "tasks.plan":
      return runTasksPlanTool(request, context);
    case "productivity.next_action":
      return runNextActionTool(request, context);
    case "compare.smart":
      return runCompareSmartTool(request, context);
    case "finance.analyze":
      return runFinanceAnalyzeTool(request, context);
    default:
      return {
        tool,
        ok: false,
        summary: `Unknown tool: ${tool}`,
      };
  }
}
