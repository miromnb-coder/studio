import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { AgentToolName, ToolInput } from './types';

export const DEFAULT_EMAIL_PREFERENCES = {
  concise: false,
  prioritizeSavings: true,
  ignoreNewsletters: false,
  actionOriented: true,
};

export const TOOL_CONFIDENCE: Record<AgentToolName, number> = {
  gmail: 0.88,
  calendar: 0.88,
  memory: 0.74,
  compare: 0.7,
  notes: 0.62,
  finance: 0.58,
  file: 0.4,
  web: 0.82,
};

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function normalizeText(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeLower(value: unknown): string {
  return normalizeText(value).toLowerCase();
}

export function asObject(value: unknown): ToolInput {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as ToolInput;
  }
  return {};
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function asStringArray(value: unknown): string[] {
  return asArray<unknown>(value).map((item) => normalizeText(item)).filter(Boolean);
}

export function asMessageArray(
  value: unknown,
): Array<{ role?: string; content?: string }> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is { role?: string; content?: string } =>
      Boolean(item) && typeof item === 'object',
  );
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown tool execution error';
}

export function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function uniqueStrings(items: string[]): string[] {
  return unique(items.map((item) => normalizeText(item)).filter(Boolean));
}

export function hasAnyPattern(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
