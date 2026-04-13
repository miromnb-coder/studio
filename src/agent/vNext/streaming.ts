import type { AgentRequest, AgentStreamEvent } from './types';

function makeEvent(
  type: AgentStreamEvent['type'],
  request: AgentRequest,
  payload?: Record<string, unknown>,
): AgentStreamEvent {
  return {
    type,
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
    payload,
  };
}

export const streamEvents = {
  routerStarted: (request: AgentRequest) => makeEvent('router_started', request),
  routerCompleted: (request: AgentRequest, payload?: Record<string, unknown>) =>
    makeEvent('router_completed', request, payload),
  planningStarted: (request: AgentRequest) => makeEvent('planning_started', request),
  planningCompleted: (request: AgentRequest, payload?: Record<string, unknown>) =>
    makeEvent('planning_completed', request, payload),
  toolStarted: (request: AgentRequest, payload?: Record<string, unknown>) => makeEvent('tool_started', request, payload),
  toolCompleted: (request: AgentRequest, payload?: Record<string, unknown>) =>
    makeEvent('tool_completed', request, payload),
  memoryStarted: (request: AgentRequest) => makeEvent('memory_started', request),
  memoryCompleted: (request: AgentRequest, payload?: Record<string, unknown>) =>
    makeEvent('memory_completed', request, payload),
  answerDelta: (request: AgentRequest, delta: string) => makeEvent('answer_delta', request, { delta }),
  answerCompleted: (request: AgentRequest, payload?: Record<string, unknown>) =>
    makeEvent('answer_completed', request, payload),
  error: (request: AgentRequest, payload?: Record<string, unknown>) => makeEvent('error', request, payload),
};
