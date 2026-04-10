export function normalizeSiteUrl(raw?: string | null): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return null;
  }
}

export function buildAuthCallbackUrl(path: string): string {
  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const baseOrigin = configured || fallbackOrigin;

  return new URL(path, baseOrigin).toString();
}

export function resolveAppOrigin(requestUrl?: URL): string {
  const configured = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
  return configured || requestUrl?.origin || 'http://localhost:3000';
}

export function sanitizeNextPath(input: string | null | undefined, fallback = '/chat'): string {
  if (!input) return fallback;
  if (!input.startsWith('/')) return fallback;
  if (input.startsWith('//')) return fallback;
  return input;
}
