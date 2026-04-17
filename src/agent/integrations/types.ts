export type IntegrationSource = 'gmail' | 'calendar' | 'memory';

export type GmailAutoAction =
  | 'inbox_summary'
  | 'urgent'
  | 'subscriptions'
  | 'digest';

export type CalendarAutoAction =
  | 'today_plan'
  | 'find_focus_time'
  | 'check_busy_week'
  | 'weekly_reset';

export type IntegrationIntent = {
  sources: IntegrationSource[];
  confidence: number;
  reason: string;
  gmailAction?: GmailAutoAction;
  calendarAction?: CalendarAutoAction;
  combineSources: boolean;
};

export type IntegrationAvailability = {
  gmailConnected: boolean;
  calendarConnected: boolean;
  memoryAvailable: boolean;
};

export type UnifiedContext = {
  intent: IntegrationIntent;
  availability: IntegrationAvailability;
  sourcePriority: IntegrationSource[];
  sourceData: Partial<Record<IntegrationSource, Record<string, unknown>>>;
  warnings: string[];
};
