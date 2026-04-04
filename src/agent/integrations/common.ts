import { ToolError, ToolErrorCode } from '@/agent/v4/types';

function resolveCode(error: unknown): ToolErrorCode {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('validation')) return 'VALIDATION_ERROR';
    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('unavailable')) return 'UNAVAILABLE';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('parse')) return 'PARSE_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

export function mapToolError(error: unknown, fallbackMessage: string): ToolError {
  const message = error instanceof Error ? error.message : fallbackMessage;
  const code = resolveCode(error);

  return {
    code,
    message,
    retriable: code === 'TIMEOUT' || code === 'UNAVAILABLE' || code === 'UNKNOWN_ERROR',
  };
}
