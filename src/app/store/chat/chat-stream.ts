'use client';

import { trackEvent } from '@/app/lib/analytics-client';
import type {
  AgentExecutionPayload,
  AgentResponseMetadata,
} from '@/types/agent-response';
import type {
  AgentName,
  AppState,
  ChatStreamEvent,
  Message,
} from '../app-store-types';
import { DEFAULT_ACTIVE_AGENT, nowIso } from '../app-store-state';
import {
  emitUsageUpdate,
  getConversationWindow,
  providerSafeErrorMessage,
  sortConversations,
  summarizePreview,
} from './chat-helpers';
import {
  deriveActiveStepsFromMetadata,
  mergeAgentMetadata,
  STREAM_STEP_EVENT_TYPES,
  upsertLiveStep,
} from './chat-steps';

type SetState = (updater: (prev: AppState) => AppState) => void;
type GetState = () => AppState;

type StreamAssistantResponseArgs = {
  requestId: string;
  assistantMessageId: string;
  conversationId: string;
  setState: SetState;
  getState: GetState;
};

function updateAssistantMessage(
  messages: Message[],
  assistantMessageId: string,
  updater: (message: Message) => Message,
): Message[] {
  return messages.map((message) =>
    message.id === assistantMessageId ? updater(message) : message,
  );
}

function latestUserMessage(messages: Message[]) {
  return (
    [...messages].reverse().find((msg) => msg.role === 'user')?.content ?? ''
  );
}

function buildStreamPayload(messages: Message[], userId?: string) {
  return {
    message: latestUserMessage(messages),
    mode: 'agent',
    history: getConversationWindow(messages),
    userId: userId || 'system_anonymous',
  };
}

function safeObject(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }

  return value as Record<string, unknown>;
}

function safeArray(
  value: unknown,
): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value)) return undefined;

  const items = value.filter(
    (item) => item && typeof item === 'object',
  ) as Array<Record<string, unknown>>;

  return items.length ? items : undefined;
}

function fallbackStepLabel(event: any) {
  if (event?.label) return String(event.label);

  if (event?.tool) {
    return `Using ${String(event.tool)}`;
  }

  switch (event?.type) {
    case 'tool_call':
      return 'Using tool';
    case 'tool_result':
      return 'Tool completed';
    case 'thinking':
      return 'Thinking';
    default:
      return 'Processing';
  }
}

function buildExecution(
  statusText: string,
  streamedText: string,
  toolCount = 0,
): AgentExecutionPayload {
  return {
    intent: 'general',
    forceMode: streamedText.trim() ? 'status' : 'thinking',
    statusText,
    toolCount,
  };
}

export async function streamAssistantResponse({
  requestId,
  assistantMessageId,
  conversationId,
  setState,
  getState,
}: StreamAssistantResponseArgs) {
  const currentState = getState();
  const conversationMessages =
    currentState.messageState[conversationId] ?? [];

  const payload = buildStreamPayload(
    conversationMessages,
    currentState.user?.id,
  );

  setState((prev) => {
    const messages = prev.messageState[conversationId] ?? [];

    const execution = buildExecution('Thinking', '', 0);

    return {
      ...prev,
      activeAgent: DEFAULT_ACTIVE_AGENT,
      messageState: {
        ...prev.messageState,
        [conversationId]: updateAssistantMessage(
          messages,
          assistantMessageId,
          (message) => ({
            ...message,
            isStreaming: true,
            content: '',
            structuredData: { execution },
            agentMetadata: {
              ...mergeAgentMetadata(message.agentMetadata),
              execution,
              structuredData: { execution },
            },
          }),
        ),
      },
    };
  });

  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await response.json().catch(() => null);

    if (reason?.usage) {
      emitUsageUpdate({
        usage: reason.usage,
        plan: reason?.plan,
      });
    }

    throw new Error(
      providerSafeErrorMessage(
        reason?.error ||
          reason?.message ||
          `Request failed (${response.status})`,
      ),
    );
  }

  const reader = response.body?.getReader();

  if (!reader) {
    throw new Error('Missing response stream.');
  }

  const decoder = new TextDecoder();

  let buffer = '';
  let streamedText = '';
  let streamComplete = false;
  let toolCount = 0;
  const startedAt = Date.now();

  const applyState = (
    content: string,
    statusText: string,
    metadata?: AgentResponseMetadata,
    toolResults?: Array<Record<string, unknown>>,
  ) => {
    setState((prev) => {
      const messages = prev.messageState[conversationId] ?? [];
      const execution = buildExecution(
        statusText,
        content,
        toolCount,
      );

      const structuredData = {
        ...(safeObject(metadata?.structuredData) ?? {}),
        execution,
      };

      return {
        ...prev,
        activeSteps: deriveActiveStepsFromMetadata(
          {
            ...metadata,
            execution,
            structuredData,
          },
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: updateAssistantMessage(
            messages,
            assistantMessageId,
            (message) => ({
              ...message,
              content,
              isStreaming: !streamComplete,
              structuredData,
              toolResults,
              agentMetadata: {
                ...mergeAgentMetadata(message.agentMetadata),
                ...metadata,
                execution,
                structuredData,
              },
            }),
          ),
        },
      };
    });
  };

  const handleEvent = (event: ChatStreamEvent) => {
    const type = (event as any).type;

    if (
      STREAM_STEP_EVENT_TYPES.has(type) ||
      type === 'tool_call' ||
      type === 'tool_result'
    ) {
      if (type === 'tool_call') toolCount += 1;

      const label = fallbackStepLabel(event);

      trackEvent('chat_phase_transition', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: { phase: type, label },
      });

      applyState(streamedText, label);
      return;
    }

    if (type === 'answer_delta' || type === 'delta') {
      const delta =
        (event as any).delta ||
        (event as any).content ||
        '';

      if (!delta) return;

      streamedText += delta;
      applyState(streamedText, 'Writing answer');
      return;
    }

    if (
      type === 'answer_completed' ||
      type === 'completed'
    ) {
      streamComplete = true;

      const content =
        (event as any).content ||
        streamedText ||
        'No response generated.';

      const metadata =
        ((event as any).metadata ||
          {}) as AgentResponseMetadata;

      const toolResults = safeArray(
        (event as any).toolResults,
      );

      applyState(
        content,
        'Completed',
        metadata,
        toolResults,
      );

      trackEvent('chat_stream_completed', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: {
          ms: Date.now() - startedAt,
          chars: content.length,
        },
      });

      return;
    }

    if (type === 'error') {
      throw new Error(
        (event as any).message || 'Streaming failed.',
      );
    }
  };

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim()) continue;

      try {
        const parsed = JSON.parse(line) as ChatStreamEvent;
        handleEvent(parsed);
      } catch {
        // ignore malformed line
      }
    }
  }

  if (!streamComplete) {
    throw new Error(
      'Streaming interrupted before completion.',
    );
  }

  setState((prev) => {
    const messages = prev.messageState[conversationId] ?? [];

    return {
      ...prev,
      conversationList: sortConversations(
        prev.conversationList.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: nowIso(),
                lastMessagePreview:
                  summarizePreview(messages),
                messageCount: messages.length,
              }
            : conversation,
        ),
      ),
      agents: {
        ...prev.agents,
        [DEFAULT_ACTIVE_AGENT as AgentName]: {
          ...prev.agents[
            DEFAULT_ACTIVE_AGENT as AgentName
          ],
          status: 'completed',
          lastRun: nowIso(),
        },
      },
      isAgentResponding: false,
      activeRequestId: null,
    };
  });
}
