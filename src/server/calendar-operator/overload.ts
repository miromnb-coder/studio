import { detectBasicOverload, type GoogleCalendarEvent } from '@/lib/integrations/google-calendar';
import type { OverloadSignalResult } from './types';

function isDeadlinePressure(events: GoogleCalendarEvent[]): boolean {
  return events.some((event) => /deadline|due|launch|final|submit|cutoff/i.test(`${event.summary} ${event.description || ''}`));
}

function countTomorrowEvents(events: GoogleCalendarEvent[]): number {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const start = new Date(tomorrow);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return events.filter((event) => {
    const startAt = +new Date(event.startAt);
    return startAt >= +start && startAt < +end;
  }).length;
}

export function buildOverloadSignals(todayEvents: GoogleCalendarEvent[], next7DaysEvents: GoogleCalendarEvent[]): OverloadSignalResult {
  const overload = detectBasicOverload(todayEvents);
  const busyTomorrow = countTomorrowEvents(next7DaysEvents) >= 6;
  const deadlinePressure = isDeadlinePressure(next7DaysEvents);

  const summaryBits = [
    overload.tooManyMeetings ? 'High meeting load today.' : 'Meeting load today is manageable.',
    overload.noRecoveryGaps ? 'No recovery gaps detected.' : 'Recovery gaps available.',
    busyTomorrow ? 'Tomorrow is very busy.' : 'Tomorrow has workable capacity.',
    deadlinePressure ? 'Deadline pressure detected this week.' : 'No deadline pressure detected.',
  ];

  return {
    generatedAt: new Date().toISOString(),
    tooManyMeetings: overload.tooManyMeetings,
    noRecoveryGaps: overload.noRecoveryGaps,
    busyTomorrow,
    deadlinePressure,
    meetingCountToday: overload.meetingCount,
    meetingMinutesToday: overload.totalMeetingMinutes,
    summary: summaryBits.join(' '),
  };
}
