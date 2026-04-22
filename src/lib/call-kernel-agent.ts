export type KernelClientEvent =
  | {
      type: "status";
      value: string;
      at?: string;
    }
  | {
      type: "delta";
      text: string;
      at?: string;
    }
  | {
      type: "log";
      message: string;
      at?: string;
    }
  | {
      type: "done";
      result: {
        id: string;
        answer: string;
        mode: "fast" | "agent";
        status: "completed" | "failed";
        model: string;
        createdAt: string;
      };
      at?: string;
    }
  | {
      type: "error";
      message: string;
      at?: string;
    };

type CallKernelAgentOptions = {
  mode?: "fast" | "agent";
  signal?: AbortSignal;
  onEvent?: (event: KernelClientEvent) => void;
};

function safeParse(line: string) {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

export async function callKernelAgent(
  message: string,
  options: CallKernelAgentOptions = {},
) {
  const {
    mode = "agent",
    signal,
    onEvent,
  } = options;

  const res = await fetch("/api/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
    body: JSON.stringify({
      message,
      mode,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Kernel request failed (${res.status})`,
    );
  }

  if (!res.body) {
    throw new Error("Response body missing.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";
  let finalResult: string | null = null;

  while (true) {
    const { done, value } =
      await reader.read();

    if (done) break;

    buffer += decoder.decode(value, {
      stream: true,
    });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) continue;

      const parsed =
        safeParse(trimmed) as KernelClientEvent | null;

      if (!parsed) continue;

      onEvent?.(parsed);

      if (parsed.type === "done") {
        finalResult =
          parsed.result.answer ?? "";
      }

      if (parsed.type === "error") {
        throw new Error(
          parsed.message ||
            "Kernel stream error.",
        );
      }
    }
  }

  if (buffer.trim()) {
    const parsed =
      safeParse(buffer.trim()) as KernelClientEvent | null;

    if (parsed) {
      onEvent?.(parsed);

      if (parsed.type === "done") {
        finalResult =
          parsed.result.answer ?? "";
      }
    }
  }

  return {
    answer: finalResult ?? "",
  };
}
