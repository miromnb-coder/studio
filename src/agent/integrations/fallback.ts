import type { IntegrationAvailability, IntegrationIntent, IntegrationSource } from './types';

export function getUnavailableSources(
  intent: IntegrationIntent,
  availability: IntegrationAvailability,
): IntegrationSource[] {
  return intent.sources.filter((source) => {
    if (source === 'gmail') return !availability.gmailConnected;
    if (source === 'calendar') return !availability.calendarConnected;
    return !availability.memoryAvailable;
  });
}

export function buildFallbackWarnings(
  intent: IntegrationIntent,
  availability: IntegrationAvailability,
): string[] {
  const missing = getUnavailableSources(intent, availability);
  if (!missing.length) return [];

  return [
    `Missing required sources: ${missing.join(', ')}. Falling back to available context only.`,
  ];
}
