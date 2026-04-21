'use client';

import { trackEvent } from '@/app/lib/analytics-client';
import type { AgentExecutionPayload, AgentResponseMetadata } from '@/types/agent-response';
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

function buildSafeStructuredData(
  value: unknown,
): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  return value as Record<string, unknown>;
}

function buildSafeToolResults(
  value: unknown,
): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value)) return undefined;

  const normalized = value
    .filter((item) => Boolean(item) && typeof item === 'object')
    .map((item) => item as Record<string, unknown>);

  return normalized.length ? normalized : undefined;
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
    if (tool === 'calendar') return 'Checking Calendar';
    if (tool === 'memory') return 'Retrieving memory';
    if (tool === 'web') return 'Researching sources';
    if (tool === 'browser_search' || tool === 'browser') return 'Searching the web';
    if (tool === 'compare') return 'Comparing options';
    if (tool === 'finance') return 'Reviewing finances';
    if (tool === 'file' || tool === 'files' || tool === 'notes') return 'Reviewing files';

    return tool ? `Using ${tool}` : 'Using tools';
  }

  return 'Processing request';
}

function toExecutionIntent(intent?: string): AgentExecutionPayload['intent'] {
  switch ((intent || '').toLowerCase()) {
    case 'gmail':
    case 'email':
      return 'email';
    case 'calendar':
    case 'planning':
    case 'productivity':
      return 'calendar';
    case 'browser':
    case 'browser_search':
    case 'web':
    case 'search':
    case 'research':
    case 'shopping':
    case 'compare':
      return 'browser';
    case 'memory':
      return 'memory';
    case 'files':
    case 'file':
    case 'notes':
      return 'files';
    default:
      return 'general';
  }
}

function inferExecutionIntentFromStepTool(steps: Array<{ tool?: string; action?: string; title?: string }>): AgentExecutionPayload['intent'] {
  for (const step of steps) {
    const tool = String(step.tool || '').toLowerCase();
    if (tool) return toExecutionIntent(tool);

    const action = String(step.action || step.title || '').toLowerCase();
    if (action.includes('gmail') || action.includes('email')) return 'email';
    if (action.includes('calendar')) return 'calendar';
    if (action.includes('browser') || action.includes('search') || action.includes('research')) {
      return 'browser';
    }
    if (action.includes('memory')) return 'memory';
    if (action.includes('file') || action.includes('note')) return 'files';
  }

  return 'general';
}

function buildExecutionFromLiveState(params: {
  metadata?: AgentResponseMetadata | null;
  existingMessage?: Message;
  steps: Array<{
    stepId?: string;
    id?: string;
    title?: string;
    action?: string;
    tool?: string;
    status?: string;
    summary?: string;
  }>;
  streamedText: string;
}): AgentExecutionPayload {
  const metadataExecution =
    params.metadata && typeof params.metadata.execution === 'object' && params.metadata.execution
      ? (params.metadata.execution as Partial<AgentExecutionPayload>)
      : undefined;

  const structuredExecution =
    params.metadata &&
    params.metadata.structuredData &&
    typeof params.metadata.structuredData === 'object' &&
    typeof (params.metadata.structuredData as Record<string, unknown>).execution === 'object' &&
    (params.metadata.structuredData as Record<string, unknown>).execution
      ? ((params.metadata.structuredData as Record<string, unknown>).execution as Partial<AgentExecutionPayload>)
      : undefined;

  const existingExecution =
    params.existingMessage?.structuredData &&
    typeof params.existingMessage.structuredData === 'object' &&
    typeof (params.existingMessage.structuredData as Record<string, unknown>).execution === 'object'
      ? ((params.existingMessage.structuredData as Record<string, unknown>).execution as Partial<AgentExecutionPayload>)
      : params.existingMessage?.agentMetadata &&
          typeof params.existingMessage.agentMetadata === 'object' &&
          typeof (params.existingMessage.agentMetadata as Record<string, unknown>).execution === 'object'
        ? ((params.existingMessage.agentMetadata as Record<string, unknown>).execution as Partial<AgentExecutionPayload>)
        : undefined;

  const executionSeed = metadataExecution ?? structuredExecution ?? existingExecution;

  const failedStepIds = params.steps
    .filter((step) => step.status === 'failed')
    .map((step) => String(step.stepId || step.id || ''));

  const doneStepIds = params.steps
    .filter((step) => step.status === 'completed' || step.status === 'skipped')
    .map((step) => String(step.stepId || step.id || ''));

  const activeStep = params.steps.find((step) => step.status === 'running');
  const hasActiveStep = Boolean(activeStep);
  const hasFailedStep = failedStepIds.length > 0;
  const hasCompletedStep = doneStepIds.length > 0;
  const hasVisibleText = params.streamedText.trim().length > 0;

  const inferredIntent =
    executionSeed?.intent ||
    toExecutionIntent(params.metadata?.intent) ||
    inferExecutionIntentFromStepTool(params.steps);

  let statusText =
    executionSeed?.statusText ||
    activeStep?.summary ||
    activeStep?.title ||
    activeStep?.action ||
    undefined;

  if (!statusText) {
    if (hasFailedStep) {
      statusText = 'Something went wrong while working on this.';
    } else if (hasActiveStep) {
      statusText = 'Working on it';
    } else if (hasCompletedStep && !hasVisibleText) {
      statusText = 'Preparing answer';
    } else if (hasVisibleText) {
      statusText = 'Preparing answer';
    } else {
      statusText = 'Thinking';
    }
  }

  let forceMode: AgentExecutionPayload['forceMode'] = 'thinking';

  if (hasFailedStep) {
    forceMode = 'execution';
  } else if (hasActiveStep) {
    forceMode = 'thinking';
  } else if (hasCompletedStep && !hasVisibleText) {
    forceMode = 'execution';
  } else if (hasVisibleText) {
    forceMode = 'status';
  }

  return {
    intent: inferredIntent,
    introText: executionSeed?.introText,
    forceMode,
    statusText,
    activeStepId: activeStep ? String(activeStep.stepId || activeStep.id || '') : undefined,
    doneStepIds: doneStepIds.filter(Boolean),
    errorStepIds: failedStepIds.filter(Boolean),
    toolCount:
      typeof executionSeed?.toolCount === 'number'
        ? executionSeed.toolCount
        : params.steps.filter((step) => String(step.tool || '').trim().length > 0).length,
  };
}

function mergeStructuredDataWithExecution(params: {
  currentStructuredData?: Record<string, unknown>;
  incomingStructuredData?: Record<string, unknown>;
  execution: AgentExecutionPayload;
}): Record<string, unknown> {
  return {
    ...(params.currentStructuredData ?? {}),
    ...(params.incomingStructuredData ?? {}),
    execution: params.execution,
  };
}

function updateAssistantMessage(
  messages: Message[],
  assistantMessageId: string,
  updater: (message: Message) => Message,
): Message[] {
  return messages.map((message) =>
    message.id === assistantMessageId ? updater(message) : message,
  );
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

  setState((prev) => {
    const messages = prev.messageState[conversationId] ?? [];

    return {
      ...prev,
      activeAgent: DEFAULT_ACTIVE_AGENT,
      messageState: {
        ...prev.messageState,
        [conversationId]: updateAssistantMessage(messages, assistantMessageId, (message) => {
          const execution: AgentExecutionPayload = {
            intent: 'general',
            forceMode: 'thinking',
            statusText: 'Thinking',
            toolCount: 0,
          };

          const structuredData = mergeStructuredDataWithExecution({
            currentStructuredData:
              message.structuredData && typeof message.structuredData === 'object'
                ? (message.structuredData as Record<string, unknown>)
                : undefined,
            execution,
          });

          return {
            ...message,
            isStreaming: true,
            content: message.content || '',
            structuredData,
            agentMetadata: {
              ...mergeAgentMetadata(message.agentMetadata),
              execution,
              structuredData,
            },
          };
        }),
      },
      agents: {
        ...prev.agents,
        [DEFAULT_ACTIVE_AGENT]: {
          ...prev.agents[DEFAULT_ACTIVE_AGENT as AgentName],
          status: 'running',
        },
      },
    };
  });

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
      const currentAssistantMessage = messages.find(
        (message) => message.id === assistantMessageId,
      );

      const existingMetadata = mergeAgentMetadata(
        currentAssistantMessage?.agentMetadata,
      );
      const currentSteps = Array.isArray(existingMetadata.steps)
        ? existingMetadata.steps
        : [];

      const execution = buildExecutionFromLiveState({
        metadata: existingMetadata,
        existingMessage: currentAssistantMessage,
        steps: currentSteps,
        streamedText: streamedText + delta,
      });

      return {
        ...prev,
        activeSteps: deriveActiveStepsFromMetadata(
          {
            ...existingMetadata,
            execution,
            structuredData: mergeStructuredDataWithExecution({
              currentStructuredData:
                currentAssistantMessage?.structuredData &&
                typeof currentAssistantMessage.structuredData === 'object'
                  ? (currentAssistantMessage.structuredData as Record<string, unknown>)
                  : undefined,
              incomingStructuredData:
                existingMetadata.structuredData &&
                typeof existingMetadata.structuredData === 'object'
                  ? (existingMetadata.structuredData as Record<string, unknown>)
                  : undefined,
              execution,
            }),
          },
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: updateAssistantMessage(messages, assistantMessageId, (message) => {
            const structuredData = mergeStructuredDataWithExecution({
              currentStructuredData:
                message.structuredData && typeof message.structuredData === 'object'
                  ? (message.structuredData as Record<string, unknown>)
                  : undefined,
              incomingStructuredData:
                existingMetadata.structuredData &&
                typeof existingMetadata.structuredData === 'object'
                  ? (existingMetadata.structuredData as Record<string, unknown>)
                  : undefined,
              execution,
            });

            return {
              ...message,
              content: (message.content || '') + delta,
              isStreaming: true,
              structuredData,
              agentMetadata: {
                ...existingMetadata,
                execution,
                structuredData,
              },
            };
          }),
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
      const existingMetadata = mergeAgentMetadata(assistantMessage?.agentMetadata);
      const existingSteps = Array.isArray(existingMetadata.steps)
        ? existingMetadata.steps
        : [];
      const nextSteps = upsertLiveStep(existingSteps, normalizedEvent);

      const execution = buildExecutionFromLiveState({
        metadata: existingMetadata,
        existingMessage: assistantMessage,
        steps: nextSteps,
        streamedText,
      });

      return {
        ...prev,
        activeSteps: deriveActiveStepsFromMetadata(
          {
            ...existingMetadata,
            steps: nextSteps,
            execution,
            structuredData: mergeStructuredDataWithExecution({
              currentStructuredData:
                assistantMessage?.structuredData &&
                typeof assistantMessage.structuredData === 'object'
                  ? (assistantMessage.structuredData as Record<string, unknown>)
                  : undefined,
              incomingStructuredData:
                existingMetadata.structuredData &&
                typeof existingMetadata.structuredData === 'object'
                  ? (existingMetadata.structuredData as Record<string, unknown>)
                  : undefined,
              execution,
            }),
          },
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: updateAssistantMessage(messages, assistantMessageId, (message) => {
            const structuredData = mergeStructuredDataWithExecution({
              currentStructuredData:
                message.structuredData && typeof message.structuredData === 'object'
                  ? (message.structuredData as Record<string, unknown>)
                  : undefined,
              incomingStructuredData:
                existingMetadata.structuredData &&
                typeof existingMetadata.structuredData === 'object'
                  ? (existingMetadata.structuredData as Record<string, unknown>)
                  : undefined,
              execution,
            });

            return {
              ...message,
              isStreaming: true,
              structuredData,
              agentMetadata: {
                ...existingMetadata,
                steps: nextSteps,
                execution,
                structuredData,
              },
            };
          }),
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

      const responseMode = mergedMetadata.responseMode;
      const shouldKeepWorkflowSteps =
        responseMode === 'operator' || responseMode === 'tool';

      const normalizedMetadata = shouldKeepWorkflowSteps
        ? mergedMetadata
        : {
            ...mergedMetadata,
            steps: [],
          };

      const safeStructuredData =
        buildSafeStructuredData(event.structuredData) ??
        buildSafeStructuredData(normalizedMetadata.structuredData);

      const safeToolResults =
        buildSafeToolResults(event.toolResults) ??
        buildSafeToolResults(safeStructuredData?.toolResults);

      const execution = buildExecutionFromLiveState({
        metadata: normalizedMetadata,
        existingMessage: currentAssistantMessage,
        steps: Array.isArray(normalizedMetadata.steps)
          ? normalizedMetadata.steps.map((step) => ({
              stepId: step.stepId,
              id: step.stepId,
              title: step.title,
              action: step.action,
              tool: step.tool,
              status: step.status,
              summary: step.summary,
            }))
          : [],
        streamedText: content,
      });

      const structuredData = mergeStructuredDataWithExecution({
        currentStructuredData:
          currentAssistantMessage?.structuredData &&
          typeof currentAssistantMessage.structuredData === 'object'
            ? (currentAssistantMessage.structuredData as Record<string, unknown>)
            : undefined,
        incomingStructuredData: safeStructuredData,
        execution,
      });

      return {
        ...prev,
        activeAgent: DEFAULT_ACTIVE_AGENT,
        activeSteps: deriveActiveStepsFromMetadata(
          {
            ...normalizedMetadata,
            execution,
            structuredData,
          },
          prev.activeSteps,
        ),
        messageState: {
          ...prev.messageState,
          [conversationId]: updateAssistantMessage(messages, assistantMessageId, (message) => ({
            ...message,
            content,
            isStreaming: false,
            structured: event.structured,
            structuredData,
            toolResults: safeToolResults,
            agentMetadata: {
              ...normalizedMetadata,
              execution,
              structuredData,
            },
          })),
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

    if (event.metadata?.memoryUsed) {
      trackEvent('memory_used_in_response', {
        conversationId,
        messageId: assistantMessageId,
        requestId,
        properties: {
          responseMode: event.metadata.responseMode || 'general',
          intent: event.metadata.intent || 'general',
        },
      });
    }
  };

  const handleStreamEvent = (event: ChatStreamEvent) => {
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
      } catch {
        // Ignore malformed lines to keep stream resilient
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
