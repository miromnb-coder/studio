export type KernelExecutionMode = "fast" | "agent";

export type KernelStatus =
  | "starting"
  | "building_context"
  | "calling_model"
  | "finalizing"
  | "completed"
  | "failed";

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

export type KernelStreamEvent =
  | {
      type: "status";
      value: KernelStatus;
      at: string;
    }
  | {
      type: "delta";
      text: string;
      at: string;
    }
  | {
      type: "log";
      message: string;
      at: string;
    }
  | {
      type: "done";
      result: KernelResponse;
      at: string;
    }
  | {
      type: "error";
      message: string;
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
