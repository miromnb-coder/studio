import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import type { AgentErrorShape } from './types';

export class AgentExecutionError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(params: { code: string; message: string; retryable?: boolean; details?: Record<string, unknown> }) {
    super(params.message);
    this.name = 'AgentExecutionError';
    this.code = params.code;
    this.retryable = Boolean(params.retryable);
    this.details = params.details;
  }
}

export function normalizeAgentError(error: unknown): AgentErrorShape {
  if (error instanceof AgentExecutionError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'AGENT_UNKNOWN_ERROR',
      message: error.message,
      retryable: false,
    };
  }

  return {
    code: 'AGENT_NON_ERROR_THROWN',
    message: AGENT_VNEXT_FALLBACK_MESSAGES.generic,
    retryable: false,
    details: { value: String(error) },
  };
}

export function toUserSafeError(error: AgentErrorShape): AgentErrorShape {
  return {
    code: error.code,
    message: error.retryable ? AGENT_VNEXT_FALLBACK_MESSAGES.timeout : AGENT_VNEXT_FALLBACK_MESSAGES.generic,
    retryable: error.retryable,
  };
}
