export type KernelExecutionMode = "fast" | "agent";

export type KernelRequest = {
  message: string;
  userId?: string;
  conversationId?: string;
  mode?: KernelExecutionMode;
  metadata?: Record<string, unknown>;
};

export type KernelUsage = {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
};

export type KernelResponse = {
  id: string;
  mode: KernelExecutionMode;
  answer: string;
  summary?: string;
  status: "completed" | "failed";
  model: string;
  createdAt: string;
  usage?: KernelUsage;
  metadata?: Record<string, unknown>;
};

export type KernelToolEvent = {
  id: string;
  tool: string;
  title: string;
  subtitle?: string;
  status: "running" | "completed" | "failed";
  output?: string;
};

export type KernelStreamEvent =
  | {
      type: "status";
      status: string;
      at: string;
    }
  | {
      type: "log";
      message: string;
      at: string;
    }
  | {
      type: "tool_started";
      id: string;
      tool: string;
      title: string;
      subtitle?: string;
      at: string;
    }
  | {
      type: "tool_completed" | "tool_failed";
      id: string;
      tool: string;
      title: string;
      subtitle?: string;
      output?: string;
      at: string;
    }
  | {
      type: "answer_delta";
      delta: string;
      at: string;
    }
  | {
      type: "answer_completed";
      content: string;
      metadata?: Record<string, unknown>;
      structuredData?: Record<string, unknown>;
      toolResults?: Array<Record<string, unknown>>;
      metrics?: {
        charCount?: number;
        completionMs?: number;
      };
      at: string;
    }
  | {
      type: "done";
      result: KernelResponse;
      at: string;
    }
  | {
      type: "error";
      error: string;
      at: string;
    };

export type KernelRuntimeOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  reasoningEffort?: "none" | "low" | "medium" | "high" | "xhigh";
};

export type KernelDependencies = {
  apiKey?: string;
  runtime?: KernelRuntimeOptions;
};

export type RunKernelOptions = {
  signal?: AbortSignal;
};

export type RunKernelStreamOptions = RunKernelOptions;
