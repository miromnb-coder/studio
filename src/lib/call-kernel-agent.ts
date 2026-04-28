export type KernelClientToolEvent = {
  id: string;
  tool: string;
  title: string;
  subtitle?: string;
  status: 'running' | 'completed' | 'failed';
  output?: string;
};

export type KernelClientEvent =
  | {
      type: 'status';
      value: string;
      at?: string;
    }
  | {
      type: 'delta';
      text: string;
      at?: string;
    }
  | {
      type: 'log';
      message: string;
      at?: string;
    }
  | {
      type: 'tool_call';
      toolCall: KernelClientToolEvent;
      at?: string;
    }
  | {
      type: 'tool_result';
      toolResult: KernelClientToolEvent;
      at?: string;
    }
  | {
      type: 'done';
      result: {
        id: string;
        answer: string;
        mode: 'fast' | 'agent';
        status: 'completed' | 'failed';
        model: string;
        createdAt: string;
      };
      at?: string;
    }
  | {
      type: 'error';
      message: string;
      at?: string;
    };

type CallKernelAgentOptions = {
  mode?: 'fast' | 'agent';
  signal?: AbortSignal;
  onEvent?: (event: KernelClientEvent) => void;
};

type RawKernelStreamEvent = Record<string, unknown>;

function safeParse(line: string): RawKernelStreamEvent | null {
  try {
    const parsed = JSON.parse(line);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as RawKernelStreamEvent)
      : null;
  } catch {
    return null;
  }
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizeToolEvent(
  raw: RawKernelStreamEvent,
  status: KernelClientToolEvent['status'],
): KernelClientToolEvent {
  return {
    id: stringValue(raw.id) || `${stringValue(raw.tool) || 'tool'}-${Date.now()}`,
    tool: stringValue(raw.tool) || 'tool',
    title: stringValue(raw.title) || stringValue(raw.tool) || 'Tool',
    subtitle: stringValue(raw.subtitle) || undefined,
    status,
    output: stringValue(raw.output) || undefined,
  };
}

function normalizeStreamEvent(raw: RawKernelStreamEvent): KernelClientEvent | null {
  const type = stringValue(raw.type);
  const at = stringValue(raw.at) || undefined;

  if (type === 'status') {
    return {
      type: 'status',
      value: stringValue(raw.status) || stringValue(raw.value),
      at,
    };
  }

  if (type === 'log') {
    return {
      type: 'log',
      message: stringValue(raw.message),
      at,
    };
  }

  if (type === 'answer_delta' || type === 'delta') {
    return {
      type: 'delta',
      text: stringValue(raw.delta) || stringValue(raw.text),
      at,
    };
  }

  if (type === 'tool_started' || type === 'tool_call') {
    return {
      type: 'tool_call',
      toolCall: normalizeToolEvent(raw, 'running'),
      at,
    };
  }

  if (type === 'tool_completed' || type === 'tool_failed' || type === 'tool_result') {
    return {
      type: 'tool_result',
      toolResult: normalizeToolEvent(
        raw,
        type === 'tool_failed' ? 'failed' : 'completed',
      ),
      at,
    };
  }

  if (type === 'answer_completed') {
    const content = stringValue(raw.content);
    if (!content) return null;

    return {
      type: 'done',
      result: {
        id: stringValue(raw.id) || `answer-${Date.now()}`,
        answer: content,
        mode: 'agent',
        status: 'completed',
        model: stringValue(objectValue(raw.metadata).model) || 'kernel',
        createdAt: at || new Date().toISOString(),
      },
      at,
    };
  }

  if (type === 'done') {
    const result = objectValue(raw.result);
    return {
      type: 'done',
      result: {
        id: stringValue(result.id) || `answer-${Date.now()}`,
        answer: stringValue(result.answer),
        mode: result.mode === 'fast' ? 'fast' : 'agent',
        status: result.status === 'failed' ? 'failed' : 'completed',
        model: stringValue(result.model) || 'kernel',
        createdAt: stringValue(result.createdAt) || at || new Date().toISOString(),
      },
      at,
    };
  }

  if (type === 'error') {
    return {
      type: 'error',
      message: stringValue(raw.error) || stringValue(raw.message) || 'Kernel stream error.',
      at,
    };
  }

  return null;
}

export async function callKernelAgent(
  message: string,
  options: CallKernelAgentOptions = {},
) {
  const { mode = 'agent', signal, onEvent } = options;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    signal,
    body: JSON.stringify({
      message,
      mode,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errorBody = (await res.json()) as { error?: string; message?: string };
      detail = errorBody.message || errorBody.error || '';
    } catch {
      // keep generic error
    }

    throw new Error(detail || `Kernel request failed (${res.status})`);
  }

  if (!res.body) {
    throw new Error('Response body missing.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  let buffer = '';
  let answer = '';
  let completed = false;

  const handleRawEvent = (raw: RawKernelStreamEvent) => {
    const event = normalizeStreamEvent(raw);
    if (!event) return;

    if (event.type === 'delta') {
      answer += event.text;
    }

    if (event.type === 'done') {
      if (event.result.answer) answer = event.result.answer;
      completed = true;
    }

    if (event.type === 'error') {
      throw new Error(event.message || 'Kernel stream error.');
    }

    onEvent?.(event);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parsed = safeParse(trimmed);
      if (!parsed) continue;
      handleRawEvent(parsed);
    }
  }

  if (buffer.trim()) {
    const parsed = safeParse(buffer.trim());
    if (parsed) handleRawEvent(parsed);
  }

  if (!completed && answer.trim()) {
    onEvent?.({
      type: 'done',
      result: {
        id: `answer-${Date.now()}`,
        answer,
        mode,
        status: 'completed',
        model: 'kernel',
        createdAt: new Date().toISOString(),
      },
    });
  }

  return { answer };
}
