import { AGENT_VNEXT_FALLBACK_MESSAGES } from './constants';
import type { AgentErrorShape } from './types';

type ErrorParams = {
  code: string;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
  cause?: unknown;
};

const KNOWN_RETRYABLE_CODES = new Set([
  'TIMEOUT',
  'RATE_LIMITED',
  'NETWORK_ERROR',
  'TEMPORARY_UNAVAILABLE',
  'TOOL_EXECUTION_FAILED',
  'UPSTREAM_UNAVAILABLE',
]);

const SAFE_PUBLIC_CODES = new Set([
  'VALIDATION_ERROR',
  'AUTH_REQUIRED',
  'PERMISSION_DENIED',
  'TOOL_NOT_FOUND',
  'TOOL_EXECUTION_FAILED',
  'RATE_LIMITED',
  'TIMEOUT',
]);

export class AgentExecutionError extends Error {
  public readonly code: string;
  public readonly retryable: boolean;
  public readonly details?: Record<string, unknown>;
  public readonly cause?: unknown;

  constructor(params: ErrorParams) {
    super(params.message);
    this.name = 'AgentExecutionError';
    this.code = params.code;
    this.retryable = Boolean(params.retryable);
    this.details = params.details;
    this.cause = params.cause;
  }
}

export class AgentValidationError extends AgentExecutionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      code: 'VALIDATION_ERROR',
      message,
      retryable: false,
      details,
    });
    this.name = 'AgentValidationError';
  }
}

export class AgentToolError extends AgentExecutionError {
  constructor(
    message: string,
    details?: Record<string, unknown>,
    retryable = true,
  ) {
    super({
      code: 'TOOL_EXECUTION_FAILED',
      message,
      retryable,
      details,
    });
    this.name = 'AgentToolError';
  }
}

export class AgentTimeoutError extends AgentExecutionError {
  constructor(message = 'Agent execution timed out.') {
    super({
      code: 'TIMEOUT',
      message,
      retryable: true,
    });
    this.name = 'AgentTimeoutError';
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function toStringValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return String(value);
  } catch {
    return 'Unknown error';
  }
}

function inferCode(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('timeout')) return 'TIMEOUT';
  if (lower.includes('rate limit')) return 'RATE_LIMITED';
  if (lower.includes('network')) return 'NETWORK_ERROR';
  if (lower.includes('unauthorized')) return 'AUTH_REQUIRED';
  if (lower.includes('forbidden')) return 'PERMISSION_DENIED';
  if (lower.includes('validation')) return 'VALIDATION_ERROR';

  return 'AGENT_UNKNOWN_ERROR';
}

function inferRetryable(code: string): boolean {
  return KNOWN_RETRYABLE_CODES.has(code);
}

function sanitizeDetails(
  details?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const blockedKeys = new Set([
    'token',
    'apiKey',
    'authorization',
    'password',
    'secret',
    'cookie',
  ]);

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(details)) {
    if (blockedKeys.has(key)) continue;
    sanitized[key] = value;
  }

  return Object.keys(sanitized).length ? sanitized : undefined;
}

export function normalizeAgentError(error: unknown): AgentErrorShape {
  if (error instanceof AgentExecutionError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
      details: sanitizeDetails(error.details),
    };
  }

  if (error instanceof Error) {
    const code = inferCode(error.message);

    return {
      code,
      message: error.message || AGENT_VNEXT_FALLBACK_MESSAGES.generic,
      retryable: inferRetryable(code),
    };
  }

  if (isObject(error)) {
    const code =
      typeof error.code === 'string'
        ? error.code
        : inferCode(toStringValue(error.message));

    const message =
      typeof error.message === 'string'
        ? error.message
        : AGENT_VNEXT_FALLBACK_MESSAGES.generic;

    const retryable =
      typeof error.retryable === 'boolean'
        ? error.retryable
        : inferRetryable(code);

    return {
      code,
      message,
      retryable,
      details: sanitizeDetails(
        isObject(error.details) ? error.details : undefined,
      ),
    };
  }

  return {
    code: 'AGENT_NON_ERROR_THROWN',
    message: AGENT_VNEXT_FALLBACK_MESSAGES.generic,
    retryable: false,
    details: {
      value: toStringValue(error),
    },
  };
}

export function toUserSafeError(error: AgentErrorShape): AgentErrorShape {
  const publicCode = SAFE_PUBLIC_CODES.has(error.code)
    ? error.code
    : 'AGENT_ERROR';

  let message = AGENT_VNEXT_FALLBACK_MESSAGES.generic;

  if (error.code === 'TIMEOUT') {
    message = AGENT_VNEXT_FALLBACK_MESSAGES.timeout;
  } else if (error.code === 'RATE_LIMITED') {
    message =
      'Too many requests right now. Please wait a moment and try again.';
  } else if (error.code === 'AUTH_REQUIRED') {
    message = 'Please sign in to continue.';
  } else if (error.code === 'PERMISSION_DENIED') {
    message = 'You do not have permission for that action.';
  } else if (
    SAFE_PUBLIC_CODES.has(error.code) &&
    error.message
  ) {
    message = error.message;
  }

  return {
    code: publicCode,
    message,
    retryable: Boolean(error.retryable),
  };
}

export function isRetryableError(error: unknown): boolean {
  return normalizeAgentError(error).retryable;
}

export function createToolNotFoundError(tool: string): AgentExecutionError {
  return new AgentExecutionError({
    code: 'TOOL_NOT_FOUND',
    message: `Tool not found: ${tool}`,
    retryable: false,
    details: { tool },
  });
}

export function createAuthRequiredError(
  provider?: string,
): AgentExecutionError {
  return new AgentExecutionError({
    code: 'AUTH_REQUIRED',
    message: provider
      ? `${provider} connection is required.`
      : 'Authentication required.',
    retryable: false,
    details: provider ? { provider } : undefined,
  });
}
