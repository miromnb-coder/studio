import type { ResponseLanguage } from './types';

function normalizeLanguage(value?: string | null): ResponseLanguage | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();

  if (normalized.startsWith('fi')) return 'fi';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('sv')) return 'sv';

  return null;
}

export function resolveResponseLanguage(params: {
  explicitLanguage?: string | null;
  detectedLanguage?: string | null;
  preferredLanguage?: string | null;
  userMessage?: string | null;
}): ResponseLanguage {
  const explicit = normalizeLanguage(params.explicitLanguage);
  if (explicit) return explicit;

  const preferred = normalizeLanguage(params.preferredLanguage);
  if (preferred) return preferred;

  const detected = normalizeLanguage(params.detectedLanguage);
  if (detected) return detected;

  const text = (params.userMessage ?? '').trim();

  if (/[äöå]/i.test(text) || /\b(että|mikä|haluan|voinko|etsi|vertaa|uutiset)\b/i.test(text)) {
    return 'fi';
  }

  if (/\b(och|inte|senaste|jämför|nyheter)\b/i.test(text)) {
    return 'sv';
  }

  return 'en';
}
