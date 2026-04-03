/**
 * @fileOverview Policy for long-term memory storage.
 * Allows only durable, non-sensitive fields into persisted memory.
 */

export type MemoryDecisionAction = 'store' | 'drop';

export type MemoryDropReasonCode =
  | 'INVALID_INPUT'
  | 'UNSUPPORTED_FIELD'
  | 'INVALID_VALUE_TYPE'
  | 'PII_BLOCKED';

export type PrimitiveMemoryValue = string | number | boolean;

export interface MemoryFieldDecision {
  action: MemoryDecisionAction;
  reasonCode: MemoryDropReasonCode | 'ACCEPTED';
  sanitizedValue?: PrimitiveMemoryValue[] | Record<string, PrimitiveMemoryValue>;
}

export interface MemoryPolicyResult {
  acceptedUpdates: {
    persistentPreferences?: Record<string, PrimitiveMemoryValue>;
    recurringGoals?: string[];
  };
  dropped: Array<{
    field: string;
    reasonCode: MemoryDropReasonCode;
  }>;
  shouldStore: boolean;
}

const SENSITIVE_KEY_PATTERN = /(password|passwd|secret|token|ssn|socialsecurity|creditcard|cardnumber|iban|swift|bank|routing|address|phone|email|dob|birth|location)/i;

const SENSITIVE_VALUE_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/, // SSN format
  /\b(?:\d[ -]*?){13,16}\b/, // credit-card-like
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // email
  /\b\+?\d{1,3}[ -]?(?:\(\d{2,4}\)|\d{2,4})[ -]?\d{3,4}[ -]?\d{3,4}\b/, // phone-like
  /\b\d{1,5}\s+[A-Za-z0-9.'\-\s]+\s(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b/i // address-like
];

function containsSensitiveContent(key: string, value: unknown): boolean {
  if (SENSITIVE_KEY_PATTERN.test(key)) return true;

  if (typeof value === 'string') {
    return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value));
  }

  if (Array.isArray(value)) {
    return value.some((item) => typeof item === 'string' && containsSensitiveContent(key, item));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).some(([nestedKey, nestedValue]) =>
      containsSensitiveContent(nestedKey, nestedValue)
    );
  }

  return false;
}

function isPrimitiveValue(value: unknown): value is PrimitiveMemoryValue {
  return ['string', 'number', 'boolean'].includes(typeof value);
}

/**
 * Test-friendly helper that decides whether one memory field should be stored.
 */
export function decideMemoryField(field: string, value: unknown): MemoryFieldDecision {
  if (containsSensitiveContent(field, value)) {
    return { action: 'drop', reasonCode: 'PII_BLOCKED' };
  }

  if (field === 'persistentPreferences') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { action: 'drop', reasonCode: 'INVALID_VALUE_TYPE' };
    }

    const sanitizedEntries = Object.entries(value as Record<string, unknown>).filter(([, entryValue]) =>
      isPrimitiveValue(entryValue)
    ) as Array<[string, PrimitiveMemoryValue]>;

    if (sanitizedEntries.length === 0) {
      return { action: 'drop', reasonCode: 'INVALID_VALUE_TYPE' };
    }

    return {
      action: 'store',
      reasonCode: 'ACCEPTED',
      sanitizedValue: Object.fromEntries(sanitizedEntries)
    };
  }

  if (field === 'recurringGoals') {
    if (!Array.isArray(value)) {
      return { action: 'drop', reasonCode: 'INVALID_VALUE_TYPE' };
    }

    const goals = value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0);

    if (goals.length === 0) {
      return { action: 'drop', reasonCode: 'INVALID_VALUE_TYPE' };
    }

    return { action: 'store', reasonCode: 'ACCEPTED', sanitizedValue: goals };
  }

  return { action: 'drop', reasonCode: 'UNSUPPORTED_FIELD' };
}

export function applyMemoryPolicy(memoryUpdates: unknown): MemoryPolicyResult {
  const result: MemoryPolicyResult = {
    acceptedUpdates: {},
    dropped: [],
    shouldStore: false
  };

  if (!memoryUpdates || typeof memoryUpdates !== 'object' || Array.isArray(memoryUpdates)) {
    result.dropped.push({ field: 'root', reasonCode: 'INVALID_INPUT' });
    return result;
  }

  for (const [field, value] of Object.entries(memoryUpdates as Record<string, unknown>)) {
    const decision = decideMemoryField(field, value);

    if (decision.action === 'drop') {
      result.dropped.push({ field, reasonCode: decision.reasonCode as MemoryDropReasonCode });
      continue;
    }

    if (field === 'persistentPreferences') {
      result.acceptedUpdates.persistentPreferences = decision.sanitizedValue as Record<string, PrimitiveMemoryValue>;
    }

    if (field === 'recurringGoals') {
      result.acceptedUpdates.recurringGoals = decision.sanitizedValue as string[];
    }
  }

  result.shouldStore = Object.keys(result.acceptedUpdates).length > 0;
  return result;
}
