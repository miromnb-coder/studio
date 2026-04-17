import type { GoogleCalendarEvent } from '@/lib/integrations/google-calendar';

export type CalendarOperatorAction = 'today_plan' | 'find_focus_time' | 'check_busy_week' | 'weekly_reset';

export interface TodayPlannerResult {
  generatedAt: string;
  todaysEvents: GoogleCalendarEvent[];
  bestFocusSlot: { startAt: string; endAt: string; durationMinutes: number } | null;
  nextImportantEvent: GoogleCalendarEvent | null;
  recommendedAction: string;
}

export interface FreeTimeIntelligenceResult {
  generatedAt: string;
  nextFree30Min: { startAt: string; endAt: string } | null;
  nextFree60Min: { startAt: string; endAt: string } | null;
  bestDeepWorkWindow: { startAt: string; endAt: string; durationMinutes: number } | null;
}

export interface OverloadSignalResult {
  generatedAt: string;
  tooManyMeetings: boolean;
  noRecoveryGaps: boolean;
  busyTomorrow: boolean;
  deadlinePressure: boolean;
  meetingCountToday: number;
  meetingMinutesToday: number;
  summary: string;
}

export interface WeeklyResetResult {
  generatedAt: string;
  bestTimeBlocks: Array<{ startAt: string; endAt: string; durationMinutes: number }>;
  overloadedDays: Array<{ day: string; meetingCount: number; meetingMinutes: number }>;
  opportunities: string[];
}
