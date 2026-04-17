import type { IntegrationIntent, IntegrationSource } from './types';

const SOURCE_BASE_PRIORITY: Record<IntegrationSource, number> = {
  gmail: 90,
  calendar: 85,
  memory: 70,
};

export function rankSources(intent: IntegrationIntent): IntegrationSource[] {
  const scores = intent.sources.map((source) => {
    let score = SOURCE_BASE_PRIORITY[source];

    if (intent.combineSources) score += 10;
    if (source === 'gmail' && intent.gmailAction === 'urgent') score += 8;
    if (source === 'calendar' && intent.calendarAction === 'find_focus_time') score += 8;

    return { source, score };
  });

  return scores.sort((a, b) => b.score - a.score).map((item) => item.source);
}
