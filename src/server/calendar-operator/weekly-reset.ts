import { computeFreeTimeBlocks, type GoogleCalendarEvent } from '@/lib/integrations/google-calendar';
import type { WeeklyResetResult } from './types';

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildWeeklyReset(events: GoogleCalendarEvent[]): WeeklyResetResult {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const freeBlocks = computeFreeTimeBlocks(events, now, weekEnd)
    .filter((block) => block.durationMinutes >= 60)
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 5)
    .map((block) => ({ startAt: block.startAt, endAt: block.endAt, durationMinutes: block.durationMinutes }));

  const dayStats = new Map<string, { meetingCount: number; meetingMinutes: number }>();
  for (const event of events) {
    if (event.isAllDay) continue;
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    const key = dayKey(start);
    const duration = Math.max(0, Math.round((+end - +start) / 60000));
    const existing = dayStats.get(key) || { meetingCount: 0, meetingMinutes: 0 };
    existing.meetingCount += 1;
    existing.meetingMinutes += duration;
    dayStats.set(key, existing);
  }

  const overloadedDays = [...dayStats.entries()]
    .filter(([, stats]) => stats.meetingCount >= 6 || stats.meetingMinutes >= 300)
    .map(([day, stats]) => ({ day, ...stats }))
    .sort((a, b) => a.day.localeCompare(b.day));

  const opportunities: string[] = [];
  if (freeBlocks[0]) opportunities.push('Protect your top free block as deep work time.');
  if (overloadedDays.length) opportunities.push('Move non-critical meetings off overloaded days.');
  opportunities.push('Batch admin tasks into one 30-minute block to protect focus windows.');

  return {
    generatedAt: new Date().toISOString(),
    bestTimeBlocks: freeBlocks,
    overloadedDays,
    opportunities,
  };
}
