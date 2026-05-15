import type { AurenEnvironmentContext } from '../core/types';

export function getEnvironmentContext(now = new Date()): AurenEnvironmentContext {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;

  return {
    currentDateISO: now.toISOString(),
    timezone,
    locale,
  };
}
