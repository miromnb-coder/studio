import type {
  CalendarAutoAction,
  GmailAutoAction,
  IntegrationIntent,
  IntegrationSource,
} from './types';

const GMAIL_PATTERNS = [
  /\binbox\b/i,
  /\burgent email/i,
  /\burgent emails/i,
  /\bemail(s)?\b/i,
  /\bsubscription(s)?\b/i,
  /\bnewsletter(s)?\b/i,
];

const CALENDAR_PATTERNS = [
  /\bcalendar\b/i,
  /\btoday\b/i,
  /\bfocus time\b/i,
  /\bmeeting(s)?\b/i,
  /\bbusy week\b/i,
  /\bschedule\b/i,
  /\bweekly reset\b/i,
];

const MEMORY_PATTERNS = [
  /\bremember\b/i,
  /\bpreference(s)?\b/i,
  /\bcontext\b/i,
  /\bwhat matters most\b/i,
  /\bshould i do today\b/i,
];

function includesAny(input: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(input));
}

function resolveGmailAction(input: string): GmailAutoAction {
  if (/\bsubscription(s)?\b|\bnewsletter(s)?\b/i.test(input)) {
    return 'subscriptions';
  }

  if (/\burgent\b|\bpriority\b|\bimportant\b/i.test(input)) {
    return 'urgent';
  }

  if (/\bwhat matters\b|\bdigest\b/i.test(input)) {
    return 'digest';
  }

  return 'inbox_summary';
}

function resolveCalendarAction(input: string): CalendarAutoAction {
  if (/\bfocus time\b|\bdeep work\b/i.test(input)) {
    return 'find_focus_time';
  }

  if (/\bbusy week\b|\boverloaded\b|\boverbooked\b/i.test(input)) {
    return 'check_busy_week';
  }

  if (/\bweekly reset\b|\breset my week\b/i.test(input)) {
    return 'weekly_reset';
  }

  return 'today_plan';
}

export function detectIntegrationIntent(input: string): IntegrationIntent {
  const normalized = input.trim().toLowerCase();
  const sources: IntegrationSource[] = [];

  const gmail = includesAny(normalized, GMAIL_PATTERNS);
  const calendar = includesAny(normalized, CALENDAR_PATTERNS);
  const memory = includesAny(normalized, MEMORY_PATTERNS) || /\bmy\b|\bi\b/.test(normalized);

  if (gmail) sources.push('gmail');
  if (calendar) sources.push('calendar');
  if (memory) sources.push('memory');

  const combineSignals =
    /what should i do today|what matters most|prioritize|priority/i.test(normalized) ||
    (gmail && calendar);

  if (combineSignals) {
    if (!sources.includes('gmail')) sources.push('gmail');
    if (!sources.includes('calendar')) sources.push('calendar');
    if (!sources.includes('memory')) sources.push('memory');
  }

  if (!sources.length) {
    return {
      sources: [],
      confidence: 0.2,
      reason: 'No integration-specific intent detected.',
      combineSources: false,
    };
  }

  return {
    sources,
    confidence: combineSignals ? 0.88 : 0.78,
    reason: combineSignals
      ? 'Detected multi-source request; combine Gmail, Calendar, and Memory context.'
      : `Detected integration intent for ${sources.join(', ')}.`,
    gmailAction: sources.includes('gmail') ? resolveGmailAction(normalized) : undefined,
    calendarAction: sources.includes('calendar') ? resolveCalendarAction(normalized) : undefined,
    combineSources: combineSignals || sources.length > 1,
  };
}
