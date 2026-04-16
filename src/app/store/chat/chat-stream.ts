'use client';

import { trackEvent } from '@/app/lib/analytics-client';
import type { AgentResponseMetadata } from '@/types/agent-response';
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

function buildStreamPayload(messages: Message[], userId?: string) {
  return {
    messages: getConversationWindow(messages).filter((message) =>
      message.content.trim(),
    ),
    userId: userId || 'system_anonymous',
  };
}

function fallbackStepLabel(event: {
  type: string;
  label?: string;
  tool?: string;
}) {
  const explicit = String(event.label || '').trim();
  if (explicit) return explicit;

  if (event.type.startsWith('router')) return 'Understanding request';
  if (event.type.startsWith('planning')) return 'Planning response';
  if (event.type.startsWith('memory')) return 'Retrieving memory';

  if (event.type.startsWith('tool')) {
    const tool = String(event.tool || '').trim().toLowerCase();

    if (tool === 'gmail') return 'Checking Gmail';
    if (tool === 'memory') return 'Retrieving memory';
    if (tool === 'web') return 'Researching sources';
    if (tool === 'compare') return 'Comparing options';
    if (tool === 'finance') return 'Reviewing finances';
    if (tool === 'file' || tool === 'notes') return 'Reviewing files';

    return tool ? `Using ${tool}` : 'Using tools';
  }

  return 'Processing request';
}

export async function streamAssistantResponse({
  requestId,
  assistantMessageId,
  conversationId,
  setState,
  getState,
}: StreamAssistantResponseArgs) {
  const currentState = getState();
  const conversationMessages = currentState.messageState[conversationId] ?? [];

  const payload = buildStreamPayload(
    conversationMessages,
    currentState.user?.id,
  );

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await response.json().catch(() => null);
    const errorCode = reason?.error;

    if (errorCode === 'LIMIT_REACHED') {
      if (reason?.usage) {
        emitUsageUpdate({
          usage: {
            current:
              typeof reason.usage.current === 'number'
                ? reason.usage.current
                : 0,
            limit:
              typeof reason.usage.limit === 'number'
                ? reason.usage.limit
                : 10,
            remaining:
              typeof reason.usage.remaining === 'number'
                ? reason.usage.remaining
                : 0,
            unlimited: Boolean(reason.usage.unlimited),
            unlimitedReason:
              reason.usage.unlimitedReason === 'dev' ||
              reason.usage.unlimitedReason === 'admin'
                ? reason.usage.unlimitedReason
                : null,
          },
          plan: reason?.plan,
        });
      }

      throw new Error(`LIMIT_REACHED:${JSON.stringify(reason?.usage ?? {})}`);
    }

    if (errorCode === 'AUTH_REQUIRED') {
      throw new Error('AUTH_REQUIRED:Please sign in to use chat.');
    }

    throw new Error(
      providerSafeErrorMessage(
        reason?.message || `Request failed (${response.status})`,
      ),
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Missing streaming body.');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let streamedText = '';
  let firstTokenMarked = false;
  let streamComplete = false;
  let rafPending = false;
  let bufferedDelta = '';
  const streamStartedAt = Date.now();

  const flushDelta = () => {
    if (!bufferedDelta) return;

    const delta = bufferedDelta;
    bufferedDelta = '';

    setState((prev) => {
      const messages = prev.messageState[conversationId] ?? [];

      return {
        ...prev,
        messageState: {
          ...prev.messageState,
          [conversationId]: messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content: (message.content || '') + delta,
                }
              : message,
          ),
        },
      };
    });
  };

  const queueDeltaFlush = () => {
    if (rafPending) return;

    rafPending = true;
    requestAnimationFrame(() => {
      flushDelta();
      rafPending = false;
    });
  };

  const handleStepEvent = (
    event: Extract<ChatStreamEvent, { stepId?: string; label?: string }>,
  ) => {
    const label = fallbackStepLabel(event);

    console.log('STREAM STEP EVENT', {
      requestId,
      conversationId,
      assistantMessageId,
      type: event.type,
      rawLabel: event.label,
      fallbackLabel: label,
      tool: event.tool,
      stepId: event.stepId,
    });

    if (!label) return;

    const normalizedEvent = {
      ...event,
      label,
    };

    trackEvent('chat_phase_transition', {
      conversationId,
      messageId: assistantMessageId,
      requestId,
      properties: {
        phase: event.type,
        label,
      },
    });

    setState((prev) => {
      const messages = prev.messageState[conversationId] ?? [];
      const assistantMessage = messages.find(
        (message) => message.id === assistantMessageId,
      );
      const existingMetadata = assistantMessage?.agentMetadata;
      const existingSteps = Array.isArray(existingMetadata?.steps)
        ? existingMetadata.steps
        : [];
      const nextSteps = upsertLiveStep(existingSteps, normalizedEvent);

      return {
        ...prev,
        activeSteps: deriveActiveStepsFromMetadata(
          { ...(existingMetadata ?? mergeAgentMetadata()), steps: nextSteps },
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  agentMetadata: {
                    ...mergeAgentMetadata(message.agentMetadata),
                    steps: nextSteps,
                  },
                }
              : message,
          ),
        },
      };
    });
  };

  const handleAnswerDelta = (
    event: Extract<ChatStreamEvent, { type: 'answer_delta' }>,
  ) => {
    if (!event.delta) return;

    streamedText += event.delta;
    bufferedDelta += event.delta;
    queueDeltaFlush();

    if (!firstTokenMarked) {
      firstTokenMarked = true;

      trackEvent('chat_stream_first_token', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: { ttfbMs: Date.now() - streamStartedAt },
      });
    }
  };

  const handleAnswerCompleted = (
    event: Extract<ChatStreamEvent, { type: 'answer_completed' }>,
  ) => {
    flushDelta();
    streamComplete = true;

    setState((prev) => {
      const messages = prev.messageState[conversationId] ?? [];
      const content =
        event.content || streamedText || 'I could not generate a response.';

      const currentAssistantMessage = messages.find(
        (message) => message.id === assistantMessageId,
      );

      const inFlightSteps = currentAssistantMessage?.agentMetadata?.steps ?? [];

      const fallbackSteps = inFlightSteps.map((step) => ({
        action: step.action,
        status: step.status === 'running' ? 'completed' : step.status,
        summary: step.summary,
      }));

      const mergedMetadata = mergeAgentMetadata(
        {
          ...(event.metadata as AgentResponseMetadata | undefined),
          ...(event.operatorResponse
            ? { operatorResponse: event.operatorResponse }
            : {}),
        },
        fallbackSteps,
      );

      console.log('STREAM ANSWER COMPLETED', {
        requestId,
        assistantMessageId,
        inFlightSteps,
        fallbackSteps,
        mergedMetadata,
      });

      return {
        ...prev,
        activeAgent: DEFAULT_ACTIVE_AGENT,
        activeSteps: deriveActiveStepsFromMetadata(
          mergedMetadata,
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: messages.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  content,
                  agentMetadata: mergedMetadata,
                }
              : message,
          ),
        },
      };
    });

    trackEvent('chat_stream_completed', {
      conversationId,
      messageId: assistantMessageId,
      requestId,
      properties: {
        completionMs:
          event.metrics?.completionMs ?? Date.now() - streamStartedAt,
        chars: event.metrics?.charCount ?? streamedText.length,
      },
    });
  };

  const handleStreamEvent = (event: ChatStreamEvent) => {
    console.debug('[chat-stream] event', event);

    if (STREAM_STEP_EVENT_TYPES.has(event.type)) {
      handleStepEvent(
        event as Extract<ChatStreamEvent, { stepId?: string; label?: string }>,
      );
      return;
    }

    if (event.type === 'answer_delta') {
      handleAnswerDelta(event);
      return;
    }

    if (event.type === 'answer_completed') {
      handleAnswerCompleted(event);
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
        handleStreamEvent(parsed);
      } catch (error) {
        console.error('CHAT_STREAM_PARSE_ERROR', {
          line,
          error,
        });
      }
    }
  }

  if (!streamComplete) {
    trackEvent('chat_stream_interrupted', {
      conversationId,
      messageId: assistantMessageId,
      requestId,
      properties: {
        chars: streamedText.length,
      },
    });

    throw new Error('Streaming interrupted before completion.');
  }

  setState((prev) => {
    const messages = prev.messageState[conversationId] ?? [];
    const nextConversationMessages = messages;

    return {
      ...prev,
      messageState: {
        ...prev.messageState,
        [conversationId]: nextConversationMessages,
      },
      conversationList: sortConversations(
        prev.conversationList.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                updatedAt: nowIso(),
                lastMessagePreview: summarizePreview(nextConversationMessages),
                messageCount: nextConversationMessages.length,
              }
            : conversation,
        ),
      ),
      agents: {
        ...prev.agents,
        [DEFAULT_ACTIVE_AGENT]: {
          ...prev.agents[DEFAULT_ACTIVE_AGENT as AgentName],
          status: 'completed',
          lastRun: nowIso(),
        },
      },
    };
  });
}
