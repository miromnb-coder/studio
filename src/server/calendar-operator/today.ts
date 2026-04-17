import { computeFreeTimeBlocks, type GoogleCalendarEvent } from '@/lib/integrations/google-calendar';
import type { TodayPlannerResult } from './types';

function scoreImportance(event: GoogleCalendarEvent): number {
  const text = `${event.summary} ${event.description || ''}`.toLowerCase();
  let score = 0;
  if (/interview|review|deadline|launch|board|client|exam|important/.test(text)) score += 3;
  if (/1:1|standup|sync/.test(text)) score += 1;
  if (/focus|deep work/.test(text)) score -= 1;
  return score;
}

export function buildTodayPlanner(events: GoogleCalendarEvent[]): TodayPlannerResult {
  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const sorted = [...events].sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const nextImportant = sorted
    .filter((event) => +new Date(event.endAt) > +now)
    .sort((a, b) => scoreImportance(b) - scoreImportance(a))[0] || null;

  const freeBlocks = computeFreeTimeBlocks(sorted, now, todayEnd);
  const focusSlot = [...freeBlocks]
    .filter((block) => block.durationMinutes >= 45)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)[0] || null;

  const recommendedAction = nextImportant
    ? `Prep for “${nextImportant.summary}” and reserve ${focusSlot ? 'your focus slot before it.' : '15 minutes for notes.'}`
    : focusSlot
      ? 'Use your next focus slot for your highest priority task.'
      : 'Calendar is packed today. Protect one short recovery break.';

  return {
    generatedAt: new Date().toISOString(),
    todaysEvents: sorted,
    bestFocusSlot: focusSlot
      ? { startAt: focusSlot.startAt, endAt: focusSlot.endAt, durationMinutes: focusSlot.durationMinutes }
      : null,
    nextImportantEvent: nextImportant,
    recommendedAction,
  };
}
