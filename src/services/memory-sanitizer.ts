export interface SanitizedMemoryResult {
  isValid: boolean;
  sanitized: Record<string, string | string[]>;
  rejectedKeys: string[];
  invalidReasons: string[];
}

const ALLOWED_MEMORY_KEYS: Record<string, 'string' | 'stringArray'> = {
  goals: 'stringArray',
  preferences: 'stringArray',
  subscriptions: 'stringArray',
  behaviorSummary: 'string',
};

const MAX_STRING_LENGTH = 500;
const MAX_SUMMARY_LENGTH = 2000;
const MAX_ARRAY_ITEMS = 50;

const SENSITIVE_KEY_PATTERN = /(token|secret|password|passwd|api[_-]?key|auth|session|cookie|bearer|jwt|ssn|social|credit|card|iban|routing|account|raw.?email|email.?dump|message.?body)/i;
const SENSITIVE_VALUE_PATTERN = /(?:-----BEGIN\s+[A-Z ]+KEY-----|\bsk_[a-z0-9]{16,}\b|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{20,}\b|\b(?:\d[ -]*?){13,19}\b|Bearer\s+[A-Za-z0-9\-._~+/]+=*)/i;

function sanitizeText(input: string, maxLength: number): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function hasSensitiveContent(value: string): boolean {
  return SENSITIVE_VALUE_PATTERN.test(value);
}

export function sanitizeMemoryPayload(payload: unknown): SanitizedMemoryResult {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      isValid: false,
      sanitized: {},
      rejectedKeys: [],
      invalidReasons: ['memory payload must be a non-array object'],
    };
  }

  const input = payload as Record<string, unknown>;
  const rejectedKeys = new Set<string>();
  const invalidReasons: string[] = [];
  const sanitized: Record<string, string | string[]> = {};

  for (const [key, value] of Object.entries(input)) {
    const expectedType = ALLOWED_MEMORY_KEYS[key];

    if (!expectedType || SENSITIVE_KEY_PATTERN.test(key)) {
      rejectedKeys.add(key);
      continue;
    }

    if (expectedType === 'string') {
      if (typeof value !== 'string') {
        invalidReasons.push(`${key} must be a string`);
        continue;
      }

      if (hasSensitiveContent(value)) {
        rejectedKeys.add(key);
        continue;
      }

      const maxLen = key === 'behaviorSummary' ? MAX_SUMMARY_LENGTH : MAX_STRING_LENGTH;
      const normalized = sanitizeText(value, maxLen);
      if (normalized) sanitized[key] = normalized;
      continue;
    }

    if (!Array.isArray(value)) {
      invalidReasons.push(`${key} must be an array of strings`);
      continue;
    }

    const normalizedItems: string[] = [];
    for (const item of value.slice(0, MAX_ARRAY_ITEMS)) {
      if (typeof item !== 'string') {
        invalidReasons.push(`${key} contains a non-string item`);
        continue;
      }

      if (hasSensitiveContent(item)) {
        rejectedKeys.add(key);
        continue;
      }

      const normalized = sanitizeText(item, MAX_STRING_LENGTH);
      if (normalized) normalizedItems.push(normalized);
    }

    if (normalizedItems.length > 0) {
      sanitized[key] = Array.from(new Set(normalizedItems));
    }
  }

  return {
    isValid: invalidReasons.length === 0,
    sanitized,
    rejectedKeys: Array.from(rejectedKeys),
    invalidReasons,
  };
}

export function logMemoryAuditRejections(scope: string, rejectedKeys: string[]): void {
  if (!rejectedKeys.length) return;

  console.warn(`[MEMORY][AUDIT][${scope}] Rejected sensitive/unsupported keys: ${rejectedKeys.join(', ')}`);
}
